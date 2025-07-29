import { db } from '../../firebaseConfig';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc,
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp,
  addDoc
} from 'firebase/firestore';

export class TutoringSessionService {
  static COLLECTION_NAME = 'tutoring_sessions';

  // Crear una nueva sesión de tutoría
  static async createTutoringSession(sessionData) {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        ...sessionData,
        status: 'scheduled',
        paymentStatus: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log('Tutoring session created with ID:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating tutoring session:', error);
      throw new Error(`Error creando sesión de tutoría: ${error.message}`);
    }
  }

  // Reservar un horario específico
  static async bookAvailabilitySlot(availability, studentEmail, studentName, notes = '') {
    try {
      // Verificar que el horario aún esté disponible
      if (availability.isBooked) {
        throw new Error('Este horario ya no está disponible');
      }

      const sessionData = {
        tutorEmail: availability.tutorEmail,
        studentEmail: studentEmail,
        subject: availability.subject,
        scheduledDateTime: availability.startDateTime,
        endDateTime: availability.endDateTime,
        location: availability.location,
        price: 25000, // Precio por defecto, después se puede calcular dinámicamente
        availabilityId: availability.id,
        googleEventId: availability.googleEventId,
        notes: notes,
        status: 'scheduled',
        paymentStatus: 'pending'
      };

      // Crear la sesión de tutoría
      const result = await this.createTutoringSession(sessionData);

      // Marcar la disponibilidad como reservada
      await this.markAvailabilityAsBooked(availability.id, studentEmail);

      return result;
    } catch (error) {
      console.error('Error booking availability slot:', error);
      throw new Error(`Error reservando horario: ${error.message}`);
    }
  }

  // Marcar una disponibilidad como reservada
  static async markAvailabilityAsBooked(availabilityId, studentEmail) {
    try {
      const docRef = doc(db, 'availabilities', availabilityId);
      await updateDoc(docRef, {
        isBooked: true,
        bookedBy: studentEmail,
        updatedAt: serverTimestamp()
      });

      console.log('Availability marked as booked:', availabilityId);
      return { success: true };
    } catch (error) {
      console.error('Error marking availability as booked:', error);
      throw new Error(`Error marcando disponibilidad como reservada: ${error.message}`);
    }
  }

  // Obtener sesiones de un estudiante
  static async getStudentSessions(studentEmail) {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('studentEmail', '==', studentEmail),
        orderBy('scheduledDateTime', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const sessions = [];

      querySnapshot.forEach((doc) => {
        sessions.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          scheduledDateTime: doc.data().scheduledDateTime?.toDate(),
          endDateTime: doc.data().endDateTime?.toDate(),
        });
      });

      return sessions;
    } catch (error) {
      console.error('Error getting student sessions:', error);
      throw new Error(`Error obteniendo sesiones del estudiante: ${error.message}`);
    }
  }

  // Obtener sesiones de un tutor
  static async getTutorSessions(tutorEmail) {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('tutorEmail', '==', tutorEmail),
        orderBy('scheduledDateTime', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const sessions = [];

      querySnapshot.forEach((doc) => {
        sessions.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          scheduledDateTime: doc.data().scheduledDateTime?.toDate(),
          endDateTime: doc.data().endDateTime?.toDate(),
        });
      });

      return sessions;
    } catch (error) {
      console.error('Error getting tutor sessions:', error);
      throw new Error(`Error obteniendo sesiones del tutor: ${error.message}`);
    }
  }

  // Cancelar una sesión de tutoría
  static async cancelSession(sessionId, cancelledBy) {
    try {
      const sessionRef = doc(db, this.COLLECTION_NAME, sessionId);
      const sessionDoc = await getDoc(sessionRef);

      if (!sessionDoc.exists()) {
        throw new Error('Sesión no encontrada');
      }

      const sessionData = sessionDoc.data();

      // Actualizar el estado de la sesión
      await updateDoc(sessionRef, {
        status: 'cancelled',
        cancelledBy: cancelledBy,
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Liberar la disponibilidad si existe
      if (sessionData.availabilityId) {
        await this.unmarkAvailabilityAsBooked(sessionData.availabilityId);
      }

      console.log('Session cancelled:', sessionId);
      return { success: true };
    } catch (error) {
      console.error('Error cancelling session:', error);
      throw new Error(`Error cancelando sesión: ${error.message}`);
    }
  }

  // Liberar una disponibilidad (marcar como no reservada)
  static async unmarkAvailabilityAsBooked(availabilityId) {
    try {
      const docRef = doc(db, 'availabilities', availabilityId);
      await updateDoc(docRef, {
        isBooked: false,
        bookedBy: null,
        updatedAt: serverTimestamp()
      });

      console.log('Availability unmarked as booked:', availabilityId);
      return { success: true };
    } catch (error) {
      console.error('Error unmarking availability as booked:', error);
      throw new Error(`Error liberando disponibilidad: ${error.message}`);
    }
  }

  // Completar una sesión de tutoría
  static async completeSession(sessionId, rating = null, comment = '') {
    try {
      const updateData = {
        status: 'completed',
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (rating) {
        updateData.rating = {
          score: rating,
          comment: comment,
          ratedAt: serverTimestamp()
        };
      }

      const sessionRef = doc(db, this.COLLECTION_NAME, sessionId);
      await updateDoc(sessionRef, updateData);

      console.log('Session completed:', sessionId);
      return { success: true };
    } catch (error) {
      console.error('Error completing session:', error);
      throw new Error(`Error completando sesión: ${error.message}`);
    }
  }

  // Obtener estadísticas de sesiones para un tutor
  static async getTutorSessionStats(tutorEmail) {
    try {
      const sessions = await this.getTutorSessions(tutorEmail);
      
      const stats = {
        total: sessions.length,
        completed: sessions.filter(s => s.status === 'completed').length,
        scheduled: sessions.filter(s => s.status === 'scheduled').length,
        cancelled: sessions.filter(s => s.status === 'cancelled').length,
        totalEarnings: sessions
          .filter(s => s.status === 'completed' && s.paymentStatus === 'paid')
          .reduce((sum, s) => sum + (s.price || 0), 0),
        averageRating: this.calculateAverageRating(sessions)
      };

      return stats;
    } catch (error) {
      console.error('Error getting tutor session stats:', error);
      return {
        total: 0,
        completed: 0,
        scheduled: 0,
        cancelled: 0,
        totalEarnings: 0,
        averageRating: 0
      };
    }
  }

  // Calcular calificación promedio
  static calculateAverageRating(sessions) {
    const ratedSessions = sessions.filter(s => s.rating && s.rating.score);
    if (ratedSessions.length === 0) return 0;
    
    const totalRating = ratedSessions.reduce((sum, s) => sum + s.rating.score, 0);
    return totalRating / ratedSessions.length;
  }
} 