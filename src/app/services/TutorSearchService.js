import { db } from '../../firebaseConfig';
import {
  collection,
  getDocs,
  getDoc,
  query,
  where,
  doc,
} from 'firebase/firestore';
import { FirebaseAvailabilityService } from './FirebaseAvailabilityService';
import pino from 'pino';

const logger = pino({ name: 'TutorSearchService' });

export class TutorSearchService {
  // -------- Helpers --------

  // Estandariza la forma del tutor que consumirá el Front (sin datos sensibles)
  static sanitizeTutor(docOrObj, extra = {}) {
    const isDoc = typeof docOrObj?.data === 'function';
    const raw = isDoc ? docOrObj.data() : docOrObj;

    return {
      id: isDoc ? docOrObj.id : docOrObj.id,
      name: raw?.name ?? '',
      isTutor: !!raw?.isTutor,
      rating:
        typeof raw?.rating === 'number' ? raw.rating : null,
      hourlyRate:
        typeof raw?.hourlyRate === 'number'
          ? raw.hourlyRate
          : typeof raw?.hourly_rate === 'number'
          ? raw.hourly_rate
          : null,
      bio: raw?.bio ?? '',
      subjects: Array.isArray(raw?.subjects) ? raw.subjects : [],
      profileImage: raw?.profileImage ?? null,
      ...extra,
    };
  }

  // Normaliza el subject ingresado a {code, name}
  // code => p.ej. "FISI1018"; name => p.ej. "Física I"
  static async normalizeSubject(input) {
    if (!input) return { code: null, name: null };

    const s = String(input).trim();
    // ¿ya es código?
    if (/^[A-Za-z]{4}\d{4}$/.test(s)) {
      const code = s.toUpperCase();
      // intentamos leer el nombre (opcional)
      let name = null;
      try {
        const snap = await getDoc(doc(db, 'course', code));
        if (snap.exists()) name = snap.data()?.name ?? null;
      } catch (_) {}
      return { code, name };
    }

    // si viene nombre, tratamos de mapear a código
    const all = await getDocs(collection(db, 'course'));
    let code = null;
    all.forEach((d) => {
      const n = (d.data()?.name || '').toLowerCase();
      if (n === s.toLowerCase()) code = d.id;
    });
    return { code, name: s };
  }

  // -------- API pública --------

  // Materias disponibles (colección "course")
  static async getMaterias() {
    try {
      logger.info('Obteniendo todas las materias');
      const snapshot = await getDocs(collection(db, 'course'));
      const items = snapshot.docs.map((docSnap) => ({
        codigo: docSnap.id,
        nombre: docSnap.data().name,
        base_price: docSnap.data().base_price || null,
      }));
      return items.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    } catch (error) {
      logger.error({ error }, 'Error obteniendo materias');
      throw new Error(`Error obteniendo materias: ${error.message}`);
    }
  }

  // Todos los tutores (sanitizados)
  static async getAllTutors() {
    try {
      const qRef = query(collection(db, 'user'), where('isTutor', '==', true));
      const qs = await getDocs(qRef);
      const tutors = [];
      qs.forEach((d) => tutors.push(this.sanitizeTutor(d)));
      // orden por rating desc
      tutors.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      return tutors;
    } catch (error) {
      logger.error({ error }, 'Error obteniendo tutores');
      throw new Error(`Error obteniendo tutores: ${error.message}`);
    }
  }

  // Tutores que enseñan una materia específica (por código o nombre)
  static async getTutorsBySubject(subjectInput) {
    try {
      console.log('Buscando tutores para:', subjectInput);
      const subj = await this.normalizeSubject(subjectInput);

      const foundMap = new Map(); // id -> tutor

      // 1) Búsqueda por código (array-contains)
      if (subj.code) {
        const qCode = query(
          collection(db, 'user'),
          where('isTutor', '==', true),
          where('subjects', 'array-contains', subj.code)
        );
        const qsCode = await getDocs(qCode);
        qsCode.forEach((d) => {
          const t = this.sanitizeTutor(d);
          foundMap.set(t.id, t);
        });
      }

      // 2) Búsqueda por nombre (por si almacenaron nombres en subjects)
      if (subj.name) {
        const qName = query(
          collection(db, 'user'),
          where('isTutor', '==', true),
          where('subjects', 'array-contains', subj.name)
        );
        const qsName = await getDocs(qName);
        qsName.forEach((d) => {
          const t = this.sanitizeTutor(d);
          foundMap.set(t.id, t);
        });
      }

      let tutors = Array.from(foundMap.values());

      // 3) Si no hay, fallback usando disponibilidades
      if (tutors.length === 0) {
        console.log('No hubo coincidencia directa, probando disponibilidad…');
        const avails = await FirebaseAvailabilityService.getAvailabilitiesBySubject(
          subj.code || subj.name
        );
        const ids = [...new Set(avails.map((a) => a.tutorId || a.tutorEmail))];

        if (ids.length > 0) {
          const qAll = query(collection(db, 'user'), where('isTutor', '==', true));
          const qsAll = await getDocs(qAll);
          qsAll.forEach((d) => {
            if (ids.includes(d.id) || ids.includes(d.data()?.email)) {
              const t = this.sanitizeTutor(d, {
                availabilities: avails.filter(
                  (a) =>
                    a.tutorId === d.id ||
                    a.tutorEmail === d.id ||
                    a.tutorId === d.data()?.email ||
                    a.tutorEmail === d.data()?.mail
                ),
              });
              foundMap.set(t.id, t);
            }
          });
          tutors = Array.from(foundMap.values());
        }
      } else {
        // 4) Añadimos disponibilidades (filtradas por la materia si viene)
        for (const t of tutors) {
          try {
            const list = await FirebaseAvailabilityService.getAvailabilitiesByTutor(
              t.id,
              20
            );
            t.availabilities = list.filter(
              (a) =>
                !subj.code ||
                a.subject === subj.code ||
                a.subject === subj.name ||
                !a.subject
            );
          } catch (e) {
            console.warn('No se pudieron leer disponibilidades de', t.id, e);
            t.availabilities = [];
          }
        }
      }

      // Orden: rating desc, luego hourlyRate asc
      tutors.sort((a, b) => {
        const r = (b.rating ?? 0) - (a.rating ?? 0);
        if (r !== 0) return r;
        const ha = a.hourlyRate ?? Number.MAX_SAFE_INTEGER;
        const hb = b.hourlyRate ?? Number.MAX_SAFE_INTEGER;
        return ha - hb;
      });

      console.log(`Retornando ${tutors.length} tutores para`, subjectInput);
      return tutors;
    } catch (error) {
      console.error('Error obteniendo tutores por materia:', error);
      throw new Error(
        `Error obteniendo tutores para ${subjectInput}: ${error.message}`
      );
    }
  }

  // Disponibilidad completa de un tutor
  static async getTutorAvailability(tutorId, limitCount = 20) {
    try {
      return await FirebaseAvailabilityService.getAvailabilitiesByTutor(
        tutorId,
        limitCount
      );
    } catch (error) {
      logger.error({ error, tutorId }, 'Error obteniendo disponibilidad del tutor');
      throw new Error(`Error obteniendo disponibilidad: ${error.message}`);
    }
  }

  // Búsqueda libre por nombre (sanitizada)
  static async searchTutors(searchTerm) {
    try {
      const all = await this.getAllTutors();
      if (!searchTerm || !searchTerm.trim()) return all;

      const q = searchTerm.toLowerCase().trim();
      return all.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (Array.isArray(t.subjects) &&
            t.subjects.join(' ').toLowerCase().includes(q))
      );
    } catch (error) {
      logger.error({ error, searchTerm }, 'Error buscando tutores');
      throw new Error(`Error en búsqueda: ${error.message}`);
    }
  }

  // Stats simples basadas en disponibilidades
  static async getTutorStats(tutorId) {
    try {
      const avs = await this.getTutorAvailability(tutorId, 100);
      const now = new Date();
      const subjects = [...new Set(avs.map((a) => a.subject).filter(Boolean))];
      const upcoming = avs.filter(
        (a) => a.startDateTime && new Date(a.startDateTime) > now
      );

      return {
        totalAvailabilities: avs.length,
        upcomingSessions: upcoming.length,
        subjects,
        subjectCount: subjects.length,
      };
    } catch (error) {
      logger.error({ error, tutorId }, 'Error obteniendo estadísticas del tutor');
      return {
        totalAvailabilities: 0,
        upcomingSessions: 0,
        subjects: [],
        subjectCount: 0,
      };
    }
  }

  /**
   * Busca tutores específicamente por materia con información enriquecida
   * @param {string} subject - Nombre de la materia
   * @returns {Promise<Array>} Array de tutores con información completa
   */
  static async searchTutorsBySubject(subject) {
    try {
      logger.info({ subject }, 'Buscando tutores por materia específica');
      
      // Normalizar la materia
      const normalized = await this.normalizeSubject(subject);
      const searchTerm = normalized.name || subject;

      console.log('Normalized subject:', normalized);
      
      // Buscar en la colección de usuarios que son tutores
      const usersCollection = collection(db, 'users');
      const tutorsQuery = query(usersCollection, where('isTutor', '==', true));
      const tutorsSnapshot = await getDocs(tutorsQuery);

      console.log('Tutors found:', tutorsSnapshot.docs.length);
      
      const tutorsWithSubject = [];
      
      for (const tutorDoc of tutorsSnapshot.docs) {
        const tutorData = tutorDoc.data();
        const tutorEmail = tutorDoc.id;
        
        // Verificar si el tutor enseña esta materia
        if (tutorData.subjects && Array.isArray(tutorData.subjects)) {
          const hasSubject = tutorData.subjects.some(sub => 
            sub.toLowerCase().includes(searchTerm.toLowerCase()) ||
            searchTerm.toLowerCase().includes(sub.toLowerCase())
          );
          
          if (hasSubject) {
            // Obtener disponibilidad del tutor
            const availability = await FirebaseAvailabilityService.getTutorAvailability(tutorEmail);

            console.log('Tutor availability:', availability);

            // Crear objeto tutor enriquecido
            const enrichedTutor = this.sanitizeTutor(tutorDoc, {
              email: tutorEmail,
              totalSessions: availability.length,
              hasAvailability: availability.length > 0,
              nextAvailableSlot: this.getNextAvailableSlot(availability),
              description: this.generateTutorDescription(tutorData, searchTerm),
              location: tutorData.location || 'Virtual',
              subjects: tutorData.subjects || []
            });
            
            tutorsWithSubject.push(enrichedTutor);
          }
        }
      }
      
      // Ordenar por rating y disponibilidad
      tutorsWithSubject.sort((a, b) => {
        if (a.hasAvailability && !b.hasAvailability) return -1;
        if (!a.hasAvailability && b.hasAvailability) return 1;
        return (b.rating || 0) - (a.rating || 0);
      });
      
      logger.info({ 
        subject: searchTerm, 
        tutorsFound: tutorsWithSubject.length 
      }, 'Búsqueda de tutores por materia completada');
      
      return tutorsWithSubject;
    } catch (error) {
      logger.error({ error, subject }, 'Error buscando tutores por materia');
      return [];
    }
  }

  /**
   * Genera una descripción automática para el tutor basada en su información
   * @param {Object} tutorData - Datos del tutor
   * @param {string} subject - Materia específica
   * @returns {string} Descripción generada
   */
  static generateTutorDescription(tutorData, subject) {
    if (tutorData.bio && tutorData.bio.trim()) {
      return tutorData.bio;
    }
    
    const subjectCount = tutorData.subjects ? tutorData.subjects.length : 0;
    const rating = tutorData.rating || 4.5;
    
    const descriptions = [
      `Experienced tutor specializing in ${subject}. Proven track record of helping students achieve academic success.`,
      `Passionate educator with a focus on ${subject}. Dedicated to fostering a love for learning and writing.`,
      `Certified tutor in ${subject}. Committed to making complex topics understandable and engaging for students.`,
      `Expert tutor in ${subject} and ${subjectCount > 1 ? 'multiple subjects' : 'specialized topics'}. Skilled in creating interactive and informative learning experiences.`
    ];
    
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  /**
   * Obtiene el próximo slot disponible de un tutor
   * @param {Array} availability - Array de disponibilidades
   * @returns {Object|null} Próximo slot disponible o null
   */
  static getNextAvailableSlot(availability) {
    if (!availability || availability.length === 0) return null;
    
    const now = new Date();
    const futureSlots = availability
      .filter(slot => new Date(slot.startDateTime) > now)
      .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));
    
    return futureSlots.length > 0 ? futureSlots[0] : null;
  }

  // Obtener disponibilidad conjunta para una materia
  static async getJointAvailabilityBySubject(subject) {
    try {
      return await FirebaseAvailabilityService.getAvailabilitiesBySubject(subject);
    } catch (error) {
      logger.error({ error, subject }, 'Error obteniendo disponibilidad conjunta por materia');
      throw new Error(`Error obteniendo disponibilidad conjunta: ${error.message}`);
    }
  }
}