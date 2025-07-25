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

  // Obtener tutores que tienen disponibilidad para una materia específica
  static async getTutorsBySubject(subjectName) {
    try {
      // Primero obtener todas las disponibilidades para esa materia
      const availabilities = await FirebaseAvailabilityService.getAvailabilitiesBySubject(subjectName);
      
      // Extraer los IDs únicos de tutores que tienen disponibilidad en esa materia
      const tutorIds = [...new Set(availabilities.map(avail => avail.tutorId))];
      
      if (tutorIds.length === 0) {
        return [];
      }

      // Obtener la información de esos tutores
      const tutors = [];
      for (const tutorId of tutorIds) {
        try {
          const q = query(
            collection(db, 'user'),
            where('isTutor', '==', true)
          );
          
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((doc) => {
            if (doc.id === tutorId || doc.data().mail === tutorId) {
              tutors.push({
                id: doc.id,
                email: doc.id,
                ...doc.data(),
                // Agregar las disponibilidades de este tutor para esta materia
                availabilities: availabilities.filter(avail => 
                  avail.tutorId === tutorId || avail.tutorEmail === tutorId
                )
              });
            }
          });
        } catch (error) {
          console.warn(`Error obteniendo tutor ${tutorId}:`, error);
        }
      }

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