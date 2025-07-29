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

export class TutorSearchService {
  
  // Obtener todas las materias disponibles
  static async getMaterias() {
    try {
      const snapshot = await getDocs(collection(db, 'course'));
      return snapshot.docs.map(docSnap => ({
        codigo: docSnap.id,
        nombre: docSnap.data().name,
      }));
    } catch (error) {
      console.error('Error obteniendo materias:', error);
      throw new Error(`Error obteniendo materias: ${error.message}`);
    }
  }

  // Obtener todos los tutores (usuarios con isTutor: true)
  static async getAllTutors() {
    try {
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

      return tutors;
    } catch (error) {
      console.error('Error obteniendo tutores:', error);
      throw new Error(`Error obteniendo tutores: ${error.message}`);
    }
  }

  // Obtener tutores que enseñan una materia específica
  static async getTutorsBySubject(subjectName) {
    try {
      console.log('Buscando tutores para la materia:', subjectName);
      
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

      console.log(`Encontrados ${tutors.length} tutores que enseñan ${subjectName}`);

      // Si no se encuentran tutores con el método exacto, intentar búsqueda más flexible
      if (tutors.length === 0) {
        console.log('No se encontraron tutores con coincidencia exacta, buscando con disponibilidad...');
        
        // Buscar tutores que tienen disponibilidad para esa materia
        const availabilities = await FirebaseAvailabilityService.getAvailabilitiesBySubject(subjectName);
        const tutorIds = [...new Set(availabilities.map(avail => avail.tutorId || avail.tutorEmail))];
        
        console.log(`Encontrados ${tutorIds.length} tutores con disponibilidad en ${subjectName}`);

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
            console.warn(`Error obteniendo disponibilidades para tutor ${tutor.id}:`, error);
            tutor.availabilities = [];
          }
        }
      }

      console.log(`Retornando ${tutors.length} tutores para ${subjectName}`);
      return tutors;
    } catch (error) {
      console.error('Error obteniendo tutores por materia:', error);
      throw new Error(`Error obteniendo tutores para ${subjectName}: ${error.message}`);
    }
  }

  // Obtener disponibilidad completa de un tutor específico
  static async getTutorAvailability(tutorId, limitCount = 20) {
    try {
      return await FirebaseAvailabilityService.getAvailabilitiesByTutor(tutorId, limitCount);
    } catch (error) {
      console.error('Error obteniendo disponibilidad del tutor:', error);
      throw new Error(`Error obteniendo disponibilidad: ${error.message}`);
    }
  }

  // Buscar tutores por nombre o email
  static async searchTutors(searchTerm) {
    try {
      const allTutors = await this.getAllTutors();
      
      if (!searchTerm || searchTerm.trim() === '') {
        return allTutors;
      }

      const term = searchTerm.toLowerCase().trim();
      
      return allTutors.filter(tutor => 
        tutor.name?.toLowerCase().includes(term) ||
        tutor.email?.toLowerCase().includes(term) ||
        tutor.mail?.toLowerCase().includes(term)
      );
    } catch (error) {
      console.error('Error buscando tutores:', error);
      throw new Error(`Error en búsqueda: ${error.message}`);
    }
  }

  // Obtener estadísticas de un tutor (número de tutorías, materias, etc.)
  static async getTutorStats(tutorId) {
    try {
      const availabilities = await this.getTutorAvailability(tutorId, 100);
      
      // Extraer materias únicas
      const subjects = [...new Set(availabilities.map(avail => avail.subject).filter(Boolean))];
      
      // Contar próximas sesiones disponibles
      const now = new Date();
      const upcomingSessions = availabilities.filter(avail => 
        avail.startDateTime && new Date(avail.startDateTime) > now
      );

      return {
        totalAvailabilities: availabilities.length,
        upcomingSessions: upcomingSessions.length,
        subjects: subjects,
        subjectCount: subjects.length
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas del tutor:', error);
      return {
        totalAvailabilities: 0,
        upcomingSessions: 0,
        subjects: [],
        subjectCount: 0
      };
    }
  }
} 