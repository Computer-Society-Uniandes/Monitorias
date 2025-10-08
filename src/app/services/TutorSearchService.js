import { db } from '../../firebaseConfig';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { FirebaseAvailabilityService } from './FirebaseAvailabilityService';
import pino from 'pino';

const logger = pino({ name: 'TutorSearchService' });

export class TutorSearchService {
  
  // Obtener todas las materias disponibles
  static async getMaterias() {
    try {
      logger.info('Obteniendo todas las materias');
      const snapshot = await getDocs(collection(db, 'course'));
      const materias = snapshot.docs.map(docSnap => ({
        codigo: docSnap.id,
        nombre: docSnap.data().name,
        base_price: docSnap.data().base_price || null,
      }));
      logger.info({ count: materias.length }, 'Materias obtenidas exitosamente');
      return materias;
    } catch (error) {
      logger.error({ error }, 'Error obteniendo materias');
      throw new Error(`Error obteniendo materias: ${error.message}`);
    }
  }

  // Obtener todos los tutores (usuarios con isTutor: true)
  static async getAllTutors() {
    try {
      logger.info('Obteniendo todos los tutores');
      const q = query(
        collection(db, 'user'),
        where('isTutor', '==', true)
      );

      const querySnapshot = await getDocs(q);
      const tutors = [];

      querySnapshot.forEach((doc) => {
        tutors.push({
          id: doc.id,
          email: doc.id, // El email es el ID del documento
          ...doc.data()
        });
      });

      logger.info({ count: tutors.length }, 'Tutores obtenidos exitosamente');
      return tutors;
    } catch (error) {
      logger.error({ error }, 'Error obteniendo tutores');
      throw new Error(`Error obteniendo tutores: ${error.message}`);
    }
  }

  // Obtener tutores que enseñan una materia específica
  static async getTutorsBySubject(subjectName) {
    try {
      logger.info({ subjectName }, 'Buscando tutores para la materia');

      // Método 1: Buscar tutores que tienen esa materia en su array de subjects
      const q = query(
        collection(db, 'user'),
        where('isTutor', '==', true),
        where('subjects', 'array-contains', subjectName)
      );

      const querySnapshot = await getDocs(q);
      const tutors = [];

      querySnapshot.forEach((doc) => {
        tutors.push({
          id: doc.id,
          email: doc.id,
          ...doc.data()
        });
      });

      logger.info({ count: tutors.length, subjectName }, 'Tutores encontrados con coincidencia exacta');

      // Si no se encuentran tutores con el método exacto, intentar búsqueda más flexible
      if (tutors.length === 0) {
        logger.info({ subjectName }, 'Buscando tutores con disponibilidad');

        // Buscar tutores que tienen disponibilidad para esa materia
        const availabilities = await FirebaseAvailabilityService.getAvailabilitiesBySubject(subjectName);
        const tutorIds = [...new Set(availabilities.map(avail => avail.tutorId || avail.tutorEmail))];

        logger.info({ count: tutorIds.length, subjectName }, 'Tutores encontrados con disponibilidad');

        if (tutorIds.length === 0) {
          return [];
        }

        // Obtener información de esos tutores
        const allTutorsQuery = query(
          collection(db, 'user'),
          where('isTutor', '==', true)
        );

        const allTutorsSnapshot = await getDocs(allTutorsQuery);
        
        allTutorsSnapshot.forEach((doc) => {
          if (tutorIds.includes(doc.id) || tutorIds.includes(doc.data().mail)) {
            // Filtrar las disponibilidades de este tutor para esta materia
            const tutorAvailabilities = availabilities.filter(avail => 
              avail.tutorId === doc.id || 
              avail.tutorEmail === doc.id || 
              avail.tutorId === doc.data().mail || 
              avail.tutorEmail === doc.data().mail
            );

            tutors.push({
              id: doc.id,
              email: doc.id,
              ...doc.data(),
              availabilities: tutorAvailabilities
            });
          }
        });
      } else {
        // Si encontramos tutores por el método exacto, obtener sus disponibilidades
        for (const tutor of tutors) {
          try {
            const tutorAvailabilities = await FirebaseAvailabilityService.getAvailabilitiesByTutor(tutor.id, 20);
            tutor.availabilities = tutorAvailabilities.filter(avail =>
              !subjectName || avail.subject === subjectName || !avail.subject
            );
          } catch (error) {
            logger.warn({ error, tutorId: tutor.id }, 'Error obteniendo disponibilidades para tutor');
            tutor.availabilities = [];
          }
        }
      }

      logger.info({ count: tutors.length, subjectName }, 'Retornando tutores para materia');
      return tutors;
    } catch (error) {
      logger.error({ error, subjectName }, 'Error obteniendo tutores por materia');
      throw new Error(`Error obteniendo tutores para ${subjectName}: ${error.message}`);
    }
  }

  // Obtener disponibilidad completa de un tutor específico
  static async getTutorAvailability(tutorId, limitCount = 20) {
    try {
      logger.info({ tutorId, limitCount }, 'Obteniendo disponibilidad de tutor');
      const availabilities = await FirebaseAvailabilityService.getAvailabilitiesByTutor(tutorId, limitCount);
      logger.info({ tutorId, count: availabilities.length }, 'Disponibilidad obtenida exitosamente');
      return availabilities;
    } catch (error) {
      logger.error({ error, tutorId }, 'Error obteniendo disponibilidad del tutor');
      throw new Error(`Error obteniendo disponibilidad: ${error.message}`);
    }
  }

  // Buscar tutores por nombre o email
  static async searchTutors(searchTerm) {
    try {
      logger.info({ searchTerm }, 'Buscando tutores');
      const allTutors = await this.getAllTutors();

      if (!searchTerm || searchTerm.trim() === '') {
        logger.info({ count: allTutors.length }, 'Retornando todos los tutores');
        return allTutors;
      }

      const term = searchTerm.toLowerCase().trim();

      const filtered = allTutors.filter(tutor =>
        tutor.name?.toLowerCase().includes(term) ||
        tutor.email?.toLowerCase().includes(term) ||
        tutor.mail?.toLowerCase().includes(term)
      );

      logger.info({ searchTerm, count: filtered.length }, 'Tutores filtrados exitosamente');
      return filtered;
    } catch (error) {
      logger.error({ error, searchTerm }, 'Error buscando tutores');
      throw new Error(`Error en búsqueda: ${error.message}`);
    }
  }

  // Obtener estadísticas de un tutor (número de tutorías, materias, etc.)
  static async getTutorStats(tutorId) {
    try {
      logger.info({ tutorId }, 'Obteniendo estadísticas de tutor');
      const availabilities = await this.getTutorAvailability(tutorId, 100);

      // Extraer materias únicas
      const subjects = [...new Set(availabilities.map(avail => avail.subject).filter(Boolean))];

      // Contar próximas sesiones disponibles
      const now = new Date();
      const upcomingSessions = availabilities.filter(avail =>
        avail.startDateTime && new Date(avail.startDateTime) > now
      );

      const stats = {
        totalAvailabilities: availabilities.length,
        upcomingSessions: upcomingSessions.length,
        subjects: subjects,
        subjectCount: subjects.length
      };

      logger.info({ tutorId, stats }, 'Estadísticas obtenidas exitosamente');
      return stats;
    } catch (error) {
      logger.error({ error, tutorId }, 'Error obteniendo estadísticas del tutor');
      return {
        totalAvailabilities: 0,
        upcomingSessions: 0,
        subjects: [],
        subjectCount: 0
      };
    }
  }
} 