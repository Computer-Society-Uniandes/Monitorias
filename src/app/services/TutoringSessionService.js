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
  static async bookSpecificSlot(slot, studentEmail, studentName, notes = '') {
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
      const sessionData = {
        tutorEmail: slot.tutorEmail,
        studentEmail: studentEmail,
        subject: slot.subject,
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
        status: 'scheduled',
        paymentStatus: 'pending'
      };

      // Crear la sesión de tutoría en Firebase
      const sessionResult = await this.createTutoringSession(sessionData);

      // Crear evento en el calendario central de Calico
      try {
        const calendarEventResult = await this.createCalicoCalendarEvent({
          sessionId: sessionResult.id,
          tutorEmail: slot.tutorEmail,
          tutorName: slot.tutorName || slot.tutorEmail,
          studentEmail: studentEmail,
          studentName: studentName,
          subject: slot.subject,
          startDateTime: slot.startDateTime,
          endDateTime: slot.endDateTime,
          location: slot.location,
          notes: notes
        });

        // Actualizar la sesión con el ID del evento de Google Calendar
        if (calendarEventResult.success) {
          await this.updateTutoringSession(sessionResult.id, {
            calicoCalendarEventId: calendarEventResult.eventId,
            calicoCalendarHtmlLink: calendarEventResult.htmlLink,
            updatedAt: serverTimestamp()
          });
        }

        console.log('✅ Evento creado en calendario central de Calico:', calendarEventResult.eventId);
      } catch (calendarError) {
        console.error('⚠️ Error creando evento en calendario central (pero sesión de Firebase creada):', calendarError);
        // No fallar la reserva si el calendario falla, pero registrar el error
      }

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
        subject: slot.subject
      };

      await this.createSlotBooking(slotBookingData);

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

  // Método para actualizar una sesión de tutoría existente
  static async updateTutoringSession(sessionId, updateData) {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, sessionId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });

      console.log('Tutoring session updated:', sessionId);
      return { success: true, id: sessionId };
    } catch (error) {
      console.error('Error updating tutoring session:', error);
      throw new Error(`Error actualizando sesión de tutoría: ${error.message}`);
    }
  }

  // Crear evento en el calendario central de Calico usando la API
  static async createCalicoCalendarEvent(eventData) {
    try {
      const {
        sessionId,
        tutorEmail,
        tutorName,
        studentEmail,
        studentName,
        subject,
        startDateTime,
        endDateTime,
        location,
        notes
      } = eventData;

      // Preparar datos para el evento
      const eventPayload = {
        summary: `Tutoría de ${subject || 'materia'} - ${tutorName || tutorEmail} con ${studentName || studentEmail}`,
        description: `Sesión de tutoría agendada a través de Calico\n\nMateria: ${subject || 'No especificada'}\nTutor: ${tutorName || tutorEmail}\nEstudiante: ${studentName || studentEmail}\n\nNotas: ${notes || 'Sin notas adicionales'}\n\nID de sesión: ${sessionId}`,
        startDateTime: startDateTime,
        endDateTime: endDateTime,
        studentEmail: studentEmail,
        studentName: studentName,
        tutorEmail: tutorEmail,
        tutorName: tutorName,
        location: location || 'Por definir',
        subject: subject,
        notes: notes
      };

      console.log('🚀 Calling Calico Calendar API to create event...');

      // Llamar a la API de creación de eventos
      const response = await fetch('/api/tutoring-sessions/create-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventPayload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!result.success) {
        throw new Error(result.message || 'Failed to create calendar event');
      }

      console.log('✅ Calico Calendar event created successfully:', result.eventId);

      return {
        success: true,
        eventId: result.eventId,
        htmlLink: result.htmlLink,
        hangoutLink: result.hangoutLink
      };

    } catch (error) {
      console.error('❌ Error creating Calico Calendar event:', error);
      throw new Error(`Error creando evento en calendario central: ${error.message}`);
    }
  }

  // Cancelar evento en el calendario central de Calico
  static async cancelCalicoCalendarEvent(eventId, reason = 'Sesión cancelada') {
    try {
      if (!eventId) {
        console.warn('No eventId provided for calendar cancellation');
        return { success: false, reason: 'No event ID' };
      }

      console.log('🚮 Cancelling Calico Calendar event:', eventId);

      const response = await fetch(`/api/tutoring-sessions/create-event?eventId=${eventId}&action=cancel`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Calico Calendar event cancelled successfully');
      return result;

    } catch (error) {
      console.error('❌ Error cancelling Calico Calendar event:', error);
      // No lanzar error para no interrumpir la cancelación de la sesión
      return { success: false, error: error.message };
    }
  }

  // Actualizar una sesión y su evento de calendario asociado
  static async updateTutoringSessionWithCalendar(sessionId, updateData) {
    try {
      // Actualizar la sesión en Firebase
      await this.updateTutoringSession(sessionId, updateData);

      // Si hay cambios que afectan el calendario, actualizar el evento
      if (updateData.calicoCalendarEventId && 
          (updateData.scheduledDateTime || updateData.endDateTime || updateData.location)) {
        
        try {
          const calendarUpdateData = {};
          
          if (updateData.scheduledDateTime) {
            calendarUpdateData.start = {
              dateTime: updateData.scheduledDateTime,
              timeZone: 'America/Bogota'
            };
          }
          
          if (updateData.endDateTime) {
            calendarUpdateData.end = {
              dateTime: updateData.endDateTime,
              timeZone: 'America/Bogota'
            };
          }
          
          if (updateData.location) {
            calendarUpdateData.location = updateData.location;
          }

          const response = await fetch(`/api/tutoring-sessions/create-event?eventId=${updateData.calicoCalendarEventId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(calendarUpdateData)
          });

          if (response.ok) {
            console.log('✅ Calendar event updated successfully');
          } else {
            console.warn('⚠️ Calendar event update failed, but session updated');
          }

        } catch (calendarError) {
          console.error('⚠️ Error updating calendar event:', calendarError);
          // No fallar la actualización de la sesión si el calendario falla
        }
      }

      return { success: true, id: sessionId };

    } catch (error) {
      console.error('Error updating tutoring session with calendar:', error);
      throw new Error(`Error actualizando sesión con calendario: ${error.message}`);
    }
  }

  // Cancelar una sesión de tutoría y su evento de calendario
  static async cancelTutoringSessionWithCalendar(sessionId, reason = 'Sesión cancelada') {
    try {
      // Obtener la sesión para conseguir el eventId
      const session = await this.getTutoringSessionById(sessionId);
      
      if (!session) {
        throw new Error('Sesión de tutoría no encontrada');
      }

      // Cancelar evento en calendario central si existe
      if (session.calicoCalendarEventId) {
        await this.cancelCalicoCalendarEvent(session.calicoCalendarEventId, reason);
      }

      // Actualizar el estado de la sesión en Firebase
      await this.updateTutoringSession(sessionId, {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        cancellationReason: reason
      });

      console.log('✅ Tutoring session and calendar event cancelled successfully');
      return { success: true, id: sessionId };

    } catch (error) {
      console.error('Error cancelling tutoring session with calendar:', error);
      throw new Error(`Error cancelando sesión con calendario: ${error.message}`);
    }
  }
} 