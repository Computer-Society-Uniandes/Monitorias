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
import { NotificationService } from './NotificationService';

export class TutoringSessionService {
  static COLLECTION_NAME = 'tutoring_sessions';
  static SLOT_BOOKINGS_COLLECTION = 'slot_bookings';

  // Crear una nueva sesión de tutoría para un slot específico
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

  // Reservar un slot específico de 1 hora
  static async bookSpecificSlot(slot, studentEmail, studentName, notes = '', selectedSubject = null) {
    try {
      // Verificar que el slot esté disponible
      if (slot.isBooked) {
        throw new Error('Este horario ya no está disponible');
      }

      // Verificar si el slot ya está reservado en la base de datos
      const existingBooking = await this.getSlotBooking(slot.parentAvailabilityId, slot.slotIndex);
      if (existingBooking) {
        throw new Error('Este horario ya fue reservado por otro estudiante');
      }

      // Crear la sesión de tutoría con información del slot específico
      // Usar la materia seleccionada por el estudiante si está disponible, sino usar la del slot
      const sessionSubject = selectedSubject || slot.subject;
      
      console.log('🎯 Materia para la sesión:', {
        selectedByStudent: selectedSubject,
        fromSlot: slot.subject,
        finalSubject: sessionSubject,
        studentEmail: studentEmail
      });
      
      const sessionData = {
        tutorEmail: slot.tutorEmail,
        studentEmail: studentEmail,
        studentName: studentName,
        subject: sessionSubject, // Usar la materia seleccionada por el estudiante
        scheduledDateTime: slot.startDateTime,
        endDateTime: slot.endDateTime,
        location: slot.location,
        price: 25000, // Precio por hora
        // Información específica del slot
        parentAvailabilityId: slot.parentAvailabilityId,
        slotIndex: slot.slotIndex,
        slotId: slot.id,
        googleEventId: slot.googleEventId,
        notes: notes,
        status: 'pending', // Session is now pending tutor approval
        paymentStatus: 'pending',
        tutorApprovalStatus: 'pending', // New field for tutor approval tracking
        requestedAt: serverTimestamp()
      };

      // Crear la sesión de tutoría
      const sessionResult = await this.createTutoringSession(sessionData);

      // Crear el registro de slot reservado
      const slotBookingData = {
        parentAvailabilityId: slot.parentAvailabilityId,
        slotIndex: slot.slotIndex,
        slotId: slot.id,
        tutorEmail: slot.tutorEmail,
        studentEmail: studentEmail,
        sessionId: sessionResult.id,
        bookedAt: serverTimestamp(),
        slotStartTime: slot.startDateTime,
        slotEndTime: slot.endDateTime,
        subject: sessionSubject // Usar la misma materia que se usó para la sesión
      };

      await this.createSlotBooking(slotBookingData);

      // Create notification for the tutor about the pending session
      await NotificationService.createPendingSessionNotification({
        sessionId: sessionResult.id,
        tutorEmail: slot.tutorEmail,
        studentEmail: studentEmail,
        studentName: studentName,
        subject: sessionSubject,
        scheduledDateTime: slot.startDateTime
      });

      console.log(`Slot ${slot.id} reservado exitosamente para ${studentEmail}`);
      return sessionResult;
    } catch (error) {
      console.error('Error booking specific slot:', error);
      throw new Error(`Error reservando horario: ${error.message}`);
    }
  }

  // Crear un registro de slot reservado
  static async createSlotBooking(bookingData) {
    try {
      const docRef = await addDoc(collection(db, this.SLOT_BOOKINGS_COLLECTION), {
        ...bookingData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log('Slot booking created with ID:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating slot booking:', error);
      throw new Error(`Error creando reserva de slot: ${error.message}`);
    }
  }

  // Obtener reserva de un slot específico
  static async getSlotBooking(parentAvailabilityId, slotIndex) {
    try {
      const q = query(
        collection(db, this.SLOT_BOOKINGS_COLLECTION),
        where('parentAvailabilityId', '==', parentAvailabilityId),
        where('slotIndex', '==', slotIndex)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        bookedAt: doc.data().bookedAt?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        slotStartTime: doc.data().slotStartTime?.toDate(),
        slotEndTime: doc.data().slotEndTime?.toDate(),
      };
    } catch (error) {
      console.error('Error getting slot booking:', error);
      return null;
    }
  }

  // Obtener todas las reservas de slots para una disponibilidad específica
  static async getSlotBookingsForAvailability(parentAvailabilityId) {
    try {
      const q = query(
        collection(db, this.SLOT_BOOKINGS_COLLECTION),
        where('parentAvailabilityId', '==', parentAvailabilityId)
      );

      const querySnapshot = await getDocs(q);
      const bookings = [];

      querySnapshot.forEach((doc) => {
        bookings.push({
          id: doc.id,
          ...doc.data(),
          bookedAt: doc.data().bookedAt?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          slotStartTime: doc.data().slotStartTime?.toDate(),
          slotEndTime: doc.data().slotEndTime?.toDate(),
        });
      });

      return bookings;
    } catch (error) {
      console.error('Error getting slot bookings for availability:', error);
      return [];
    }
  }

  // Obtener todas las reservas de slots para un tutor
  static async getSlotBookingsForTutor(tutorEmail) {
    try {
      const q = query(
        collection(db, this.SLOT_BOOKINGS_COLLECTION),
        where('tutorEmail', '==', tutorEmail),
        orderBy('slotStartTime', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const bookings = [];

      querySnapshot.forEach((doc) => {
        bookings.push({
          id: doc.id,
          ...doc.data(),
          bookedAt: doc.data().bookedAt?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          slotStartTime: doc.data().slotStartTime?.toDate(),
          slotEndTime: doc.data().slotEndTime?.toDate(),
        });
      });

      return bookings;
    } catch (error) {
      console.error('Error getting slot bookings for tutor:', error);
      return [];
    }
  }

  // Cancelar una reserva de slot específico
  static async cancelSlotBooking(sessionId, cancelledBy) {
    try {
      // Obtener la sesión para encontrar el slot booking relacionado
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

      // Eliminar el slot booking si existe
      if (sessionData.parentAvailabilityId && sessionData.slotIndex !== undefined) {
        const slotBookingQuery = query(
          collection(db, this.SLOT_BOOKINGS_COLLECTION),
          where('parentAvailabilityId', '==', sessionData.parentAvailabilityId),
          where('slotIndex', '==', sessionData.slotIndex),
          where('sessionId', '==', sessionId)
        );

        const slotBookingSnapshot = await getDocs(slotBookingQuery);
        
        for (const doc of slotBookingSnapshot.docs) {
          await deleteDoc(doc.ref);
          console.log(`Slot booking ${doc.id} deleted`);
        }
      }

      console.log('Session and slot booking cancelled:', sessionId);
      return { success: true };
    } catch (error) {
      console.error('Error cancelling slot booking:', error);
      throw new Error(`Error cancelando reserva: ${error.message}`);
    }
  }

  // Obtener sesiones de un estudiante (manteniendo compatibilidad)
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

  // Obtener sesiones de un tutor (manteniendo compatibilidad)
  static async getTutorSessions(tutorEmail) {
    try {
      console.log('tutorEmail', tutorEmail);
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
      console.log('sessions', sessions);

      return sessions;
    } catch (error) {
      console.error('Error getting tutor sessions:', error);
      throw new Error(`Error obteniendo sesiones del tutor: ${error.message}`);
    }
  }

  // Completar una sesión de tutoría (manteniendo compatibilidad)
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

  // Obtener estadísticas de sesiones para un tutor (manteniendo compatibilidad)
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

  // Calcular calificación promedio (manteniendo compatibilidad)
  static calculateAverageRating(sessions) {
    const ratedSessions = sessions.filter(s => s.rating && s.rating.score);
    if (ratedSessions.length === 0) return 0;
    
    const totalRating = ratedSessions.reduce((sum, s) => sum + s.rating.score, 0);
    return totalRating / ratedSessions.length;
  }

  // Accept a pending tutoring session
  static async acceptTutoringSession(sessionId, tutorEmail) {
    try {
      const sessionRef = doc(db, this.COLLECTION_NAME, sessionId);
      const sessionDoc = await getDoc(sessionRef);

      if (!sessionDoc.exists()) {
        throw new Error('Session not found');
      }

      const sessionData = sessionDoc.data();

      // Verify the tutor is authorized to accept this session
      if (sessionData.tutorEmail !== tutorEmail) {
        throw new Error('Unauthorized to accept this session');
      }

      // Verify the session is still pending
      if (sessionData.status !== 'pending') {
        throw new Error('Session is no longer pending');
      }

      // Update session status to scheduled (confirmed)
      await updateDoc(sessionRef, {
        status: 'scheduled',
        tutorApprovalStatus: 'accepted',
        acceptedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Create notification for the student
      await NotificationService.createSessionAcceptedNotification({
        sessionId: sessionId,
        studentEmail: sessionData.studentEmail,
        tutorEmail: sessionData.tutorEmail,
        subject: sessionData.subject,
        scheduledDateTime: sessionData.scheduledDateTime
      });

      console.log('Session accepted:', sessionId);
      return { success: true, message: 'Session accepted successfully' };
    } catch (error) {
      console.error('Error accepting session:', error);
      throw new Error(`Error accepting session: ${error.message}`);
    }
  }

  // Decline a pending tutoring session
  static async declineTutoringSession(sessionId, tutorEmail) {
    try {
      const sessionRef = doc(db, this.COLLECTION_NAME, sessionId);
      const sessionDoc = await getDoc(sessionRef);

      if (!sessionDoc.exists()) {
        throw new Error('Session not found');
      }

      const sessionData = sessionDoc.data();

      // Verify the tutor is authorized to decline this session
      if (sessionData.tutorEmail !== tutorEmail) {
        throw new Error('Unauthorized to decline this session');
      }

      // Verify the session is still pending
      if (sessionData.status !== 'pending') {
        throw new Error('Session is no longer pending');
      }

      // Update session status to declined
      await updateDoc(sessionRef, {
        status: 'declined',
        tutorApprovalStatus: 'declined',
        declinedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Create notification for the student
      await NotificationService.createSessionDeclinedNotification({
        sessionId: sessionId,
        studentEmail: sessionData.studentEmail,
        tutorEmail: sessionData.tutorEmail,
        subject: sessionData.subject,
        scheduledDateTime: sessionData.scheduledDateTime
      });

      // Remove the slot booking to make the slot available again
      if (sessionData.parentAvailabilityId && sessionData.slotIndex !== undefined) {
        const slotBookingQuery = query(
          collection(db, this.SLOT_BOOKINGS_COLLECTION),
          where('parentAvailabilityId', '==', sessionData.parentAvailabilityId),
          where('slotIndex', '==', sessionData.slotIndex),
          where('sessionId', '==', sessionId)
        );

        const slotBookingSnapshot = await getDocs(slotBookingQuery);
        
        for (const doc of slotBookingSnapshot.docs) {
          await deleteDoc(doc.ref);
          console.log(`Slot booking ${doc.id} deleted after decline`);
        }
      }

      console.log('Session declined:', sessionId);
      return { success: true, message: 'Session declined successfully' };
    } catch (error) {
      console.error('Error declining session:', error);
      throw new Error(`Error declining session: ${error.message}`);
    }
  }

  // Get pending sessions for a tutor
  static async getPendingSessionsForTutor(tutorEmail) {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('tutorEmail', '==', tutorEmail),
        where('status', '==', 'pending'),
        where('tutorApprovalStatus', '==', 'pending'),
        orderBy('requestedAt', 'desc')
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
          requestedAt: doc.data().requestedAt?.toDate(),
        });
      });

      return sessions;
    } catch (error) {
      console.error('Error getting pending sessions:', error);
      throw new Error(`Error getting pending sessions: ${error.message}`);
    }
  }

  // MÉTODO OBSOLETO - Mantener para compatibilidad
  static async bookAvailabilitySlot(availability, studentEmail, studentName, notes = '') {
    console.warn('bookAvailabilitySlot is deprecated. Use bookSpecificSlot instead.');
    
    // Convertir la disponibilidad completa en un slot de 1 hora para compatibilidad
    const slot = {
      id: `${availability.id}_legacy_slot`,
      parentAvailabilityId: availability.id,
      slotIndex: 0,
      tutorId: availability.tutorId,
      tutorEmail: availability.tutorEmail,
      startDateTime: availability.startDateTime,
      endDateTime: availability.endDateTime,
      subject: availability.subject,
      location: availability.location,
      googleEventId: availability.googleEventId,
      isBooked: availability.isBooked || false
    };

    return this.bookSpecificSlot(slot, studentEmail, studentName, notes);
  }
} 