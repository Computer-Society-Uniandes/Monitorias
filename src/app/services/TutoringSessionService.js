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
      // Validar y limpiar datos antes de enviar a Firebase
      const cleanedData = this.validateAndCleanSessionData(sessionData);
      
      console.log('📋 Creating tutoring session with cleaned data:', cleanedData);
      
      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        ...cleanedData,
        status: 'scheduled',
        paymentStatus: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log('✅ Tutoring session created with ID:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Error creating tutoring session:', error);
      console.error('🔍 Session data that caused error:', sessionData);
      throw new Error(`Error creando sesión de tutoría: ${error.message}`);
    }
  }

  // Reservar un slot específico de 1 hora
  static async bookSpecificSlot(slot, studentEmail, studentName, notes = '', selectedSubject = null) {
    try {
      console.log('🎯 BookSpecificSlot called with:', {
        slotId: slot?.id,
        slotSubject: slot?.subject,
        slotTitle: slot?.title,
        studentEmail,
        studentName,
        notes,
        selectedSubject
      });

      // Verificar que el slot esté disponible
      if (slot.isBooked) {
        throw new Error('Este horario ya no está disponible');
      }

      // Verificar si el slot ya está reservado en la base de datos
      const existingBooking = await this.getSlotBooking(slot.parentAvailabilityId, slot.slotIndex);
      if (existingBooking) {
        throw new Error('Este horario ya fue reservado por otro estudiante');
      }

      // Usar la materia seleccionada por el estudiante como prioridad
      let extractedSubject = 'Tutoría General';
      
      if (selectedSubject && selectedSubject !== undefined && selectedSubject !== '') {
        extractedSubject = selectedSubject;
      } else if (slot.subject && slot.subject !== undefined && slot.subject !== '') {
        extractedSubject = slot.subject;
      } else if (slot.title) {
        extractedSubject = this.extractSubjectFromTitle(slot.title);
      }
      
      console.log('🔍 Subject extraction:', {
        selectedSubject: selectedSubject,
        originalSubject: slot.subject,
        slotTitle: slot.title,
        extractedSubject: extractedSubject
      });

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
        subject: extractedSubject,
        scheduledDateTime: slot.startDateTime,
        endDateTime: slot.endDateTime,
        location: slot.location || 'Por definir',
        price: 25000, // Precio por hora
        // Información específica del slot
        parentAvailabilityId: slot.parentAvailabilityId,
        slotIndex: slot.slotIndex,
        slotId: slot.id,
        googleEventId: slot.googleEventId,
        notes: notes || '',
        status: 'scheduled',
        paymentStatus: 'pending'
      };

      console.log('📋 Session data to be created:', sessionData);

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
          subject: sessionData.subject, // Usar el subject ya procesado
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

  // Enviar comprobante de pago y actualizar el estado a 'en_verificación'
  static async submitPaymentProof(sessionId, proofData) {
    try {
      if (!sessionId) throw new Error('sessionId is required');

      const updateData = {
        paymentStatus: 'en_verificación',
        paymentProof: {
          url: proofData.fileUrl || null,
          fileName: proofData.fileName || null,
          amountSent: proofData.amountSent || null,
          senderName: proofData.senderName || null,
          transactionNumber: proofData.transactionNumber || null,
          submittedAt: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      };

      await this.updateTutoringSession(sessionId, updateData);

      console.log('Payment proof submitted for session:', sessionId);
      return { success: true };
    } catch (error) {
      console.error('Error enviando comprobante de pago:', error);
      throw new Error(`Error enviando comprobante de pago: ${error.message}`);
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
        summary: `Tutoria ${subject || 'General'}`,
        description: `Sesión de tutoría agendada a través de Calico\n\nMateria seleccionada: ${subject || 'No especificada'}\nTutor: ${tutorName || tutorEmail}\nEstudiante: ${studentName || studentEmail}\n\nNotas: ${notes || 'Sin notas adicionales'}\n\nID de sesión: ${sessionId}`,
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
      console.log('📤 Event payload:', eventPayload);

      // Llamar a la API de creación de eventos
      const response = await fetch('/api/tutoring-sessions/create-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventPayload)
      });

      console.log('📡 Response status:', response.status, response.statusText);
      console.log('📡 Response headers:', response.headers);

      // Leer la respuesta como texto primero para poder manejar errores
      const responseText = await response.text();
      console.log('📄 Raw response:', responseText.substring(0, 500));

      // Verificar si la respuesta es JSON válido
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('❌ Non-JSON response received:', responseText);
        throw new Error(`La API devolvió una respuesta no-JSON (${response.status}): ${responseText.substring(0, 200)}...`);
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('❌ Error parsing JSON response:', jsonError);
        throw new Error(`Error parsing JSON response: ${jsonError.message}. Response: ${responseText.substring(0, 200)}...`);
      }

      console.log('📥 Parsed response:', result);

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

  // Obtener una sesión de tutoría por ID
  static async getTutoringSessionById(sessionId) {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, sessionId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate(),
        updatedAt: docSnap.data().updatedAt?.toDate(),
        scheduledDateTime: docSnap.data().scheduledDateTime?.toDate(),
        endDateTime: docSnap.data().endDateTime?.toDate(),
        cancelledAt: docSnap.data().cancelledAt?.toDate(),
      };
    } catch (error) {
      console.error('Error getting tutoring session by ID:', error);
      throw new Error(`Error obteniendo sesión: ${error.message}`);
    }
  }

  // Verificar si una sesión puede ser cancelada (más de 2 horas antes)
  static canCancelSession(scheduledDateTime) {
    const now = new Date();
    const sessionDate = new Date(scheduledDateTime);
    const hoursUntilSession = (sessionDate - now) / (1000 * 60 * 60);
    
    return hoursUntilSession > 2;
  }

  // Cancelar una sesión de tutoría (con validación de tiempo)
  static async cancelSession(sessionId, cancelledBy, reason = 'Sesión cancelada') {
    try {
      // Obtener la sesión
      const session = await this.getTutoringSessionById(sessionId);
      
      if (!session) {
        throw new Error('Sesión no encontrada');
      }

      // Verificar si la sesión ya fue cancelada
      if (session.status === 'cancelled') {
        throw new Error('Esta sesión ya fue cancelada');
      }

      // Verificar si la sesión puede ser cancelada (más de 2 horas antes)
      if (!this.canCancelSession(session.scheduledDateTime)) {
        throw new Error('No puedes cancelar esta sesión. Debe ser con al menos 2 horas de anticipación.');
      }

      // Cancelar evento en calendario central si existe
      if (session.calicoCalendarEventId) {
        await this.cancelCalicoCalendarEvent(session.calicoCalendarEventId, reason);
      }

      // Actualizar el estado de la sesión en Firebase
      const sessionRef = doc(db, this.COLLECTION_NAME, sessionId);
      await updateDoc(sessionRef, {
        status: 'cancelled',
        cancelledBy: cancelledBy,
        cancelledAt: serverTimestamp(),
        cancellationReason: reason,
        updatedAt: serverTimestamp()
      });

      // Eliminar el slot booking si existe para liberar el horario
      if (session.parentAvailabilityId && session.slotIndex !== undefined) {
        const slotBookingQuery = query(
          collection(db, this.SLOT_BOOKINGS_COLLECTION),
          where('parentAvailabilityId', '==', session.parentAvailabilityId),
          where('slotIndex', '==', session.slotIndex),
          where('sessionId', '==', sessionId)
        );

        const slotBookingSnapshot = await getDocs(slotBookingQuery);
        
        for (const doc of slotBookingSnapshot.docs) {
          await deleteDoc(doc.ref);
          console.log(`Slot booking ${doc.id} deleted after cancellation`);
        }
      }

      // Crear notificación para la otra parte
      const otherPartyEmail = cancelledBy === session.tutorEmail ? session.studentEmail : session.tutorEmail;
      const cancellerRole = cancelledBy === session.tutorEmail ? 'tutor' : 'estudiante';
      
      await NotificationService.createSessionCancelledNotification({
        sessionId: sessionId,
        recipientEmail: otherPartyEmail,
        cancelledBy: cancelledBy,
        cancellerRole: cancellerRole,
        subject: session.subject,
        scheduledDateTime: session.scheduledDateTime,
        reason: reason
      });

      console.log('✅ Session cancelled successfully by', cancelledBy);
      return { 
        success: true, 
        message: 'Sesión cancelada exitosamente',
        id: sessionId 
      };

    } catch (error) {
      console.error('Error cancelling session:', error);
      throw new Error(error.message || 'Error cancelando la sesión');
    }
  }

  // Método auxiliar para extraer materia del título del evento
  static extractSubjectFromTitle(title) {
    if (!title) return 'Tutoría General';
    
    const titleLower = title.toLowerCase();
    
    // Buscar palabras clave comunes de materias
    if (titleLower.includes('cálculo') || titleLower.includes('calculo')) return 'Cálculo';
    if (titleLower.includes('física') || titleLower.includes('fisica')) return 'Física';
    if (titleLower.includes('matemáticas') || titleLower.includes('matematicas') || titleLower.includes('math')) return 'Matemáticas';
    if (titleLower.includes('programación') || titleLower.includes('programacion') || titleLower.includes('programming')) return 'Programación';
    if (titleLower.includes('química') || titleLower.includes('quimica')) return 'Química';
    if (titleLower.includes('biología') || titleLower.includes('biologia')) return 'Biología';
    if (titleLower.includes('historia')) return 'Historia';
    if (titleLower.includes('inglés') || titleLower.includes('ingles') || titleLower.includes('english')) return 'Inglés';
    if (titleLower.includes('estadística') || titleLower.includes('estadistica') || titleLower.includes('statistics')) return 'Estadística';
    if (titleLower.includes('economía') || titleLower.includes('economia')) return 'Economía';
    if (titleLower.includes('algebra') || titleLower.includes('álgebra')) return 'Álgebra';
    if (titleLower.includes('geometría') || titleLower.includes('geometria')) return 'Geometría';
    if (titleLower.includes('trigonometría') || titleLower.includes('trigonometria')) return 'Trigonometría';
    
    // Si contiene "tutoria" o "tutoría", usar el título completo como materia
    if (titleLower.includes('tutoria') || titleLower.includes('tutoría')) {
      return title.replace(/tutoria|tutoría/gi, '').trim() || 'Tutoría General';
    }
    
    // Si no encuentra palabras clave específicas, usar el título como materia
    return title.length > 30 ? 'Tutoría General' : title;
  }

  // Validar y limpiar datos de sesión para Firebase
  static validateAndCleanSessionData(sessionData) {
    const cleaned = {};
    
    // Lista de campos requeridos con valores por defecto
    const fieldDefaults = {
      tutorEmail: null,
      studentEmail: null,
      subject: 'Tutoría General',
      scheduledDateTime: null,
      endDateTime: null,
      location: 'Por definir',
      price: 25000,
      notes: '',
      parentAvailabilityId: null,
      slotIndex: null,
      slotId: null,
      googleEventId: null
    };

    // Copiar solo campos válidos (no undefined, no null en campos requeridos)
    Object.keys(fieldDefaults).forEach(key => {
      let value = sessionData[key];
      
      // Si el valor es undefined o null, usar el default
      if (value === undefined || value === null) {
        value = fieldDefaults[key];
      }
      
      // Solo agregar al objeto limpio si no es undefined o null
      if (value !== undefined && value !== null) {
        cleaned[key] = value;
      }
    });

    // También agregar cualquier campo adicional que no esté en defaults (pero que no sea undefined)
    Object.keys(sessionData).forEach(key => {
      if (!fieldDefaults.hasOwnProperty(key) && sessionData[key] !== undefined && sessionData[key] !== null) {
        cleaned[key] = sessionData[key];
      }
    });

    // Validaciones específicas
    if (!cleaned.tutorEmail) {
      throw new Error('tutorEmail is required');
    }
    
    if (!cleaned.studentEmail) {
      throw new Error('studentEmail is required');
    }
    
    if (!cleaned.scheduledDateTime) {
      throw new Error('scheduledDateTime is required');
    }
    
    if (!cleaned.endDateTime) {
      throw new Error('endDateTime is required');
    }

    // Asegurar que subject nunca sea undefined, null o vacío
    if (!cleaned.subject || cleaned.subject === undefined || cleaned.subject === null || cleaned.subject === '') {
      cleaned.subject = 'Tutoría General';
    }

    console.log('🔧 Cleaned session data:', {
      originalFields: Object.keys(sessionData),
      cleanedFields: Object.keys(cleaned),
      subject: cleaned.subject
    });

    return cleaned;
  }

  // Enviar notificación manual por email sobre la sesión creada (opcional)
  static async sendTutoringSessionNotification(sessionData, calendarEventData) {
    try {
      console.log('📧 Sending manual tutoring session notification...');
      
      // Aquí puedes implementar el envío de emails usando tu servicio preferido
      // Por ejemplo: SendGrid, Nodemailer, etc.
      
      const notificationData = {
        tutorEmail: sessionData.tutorEmail,
        studentEmail: sessionData.studentEmail,
        subject: sessionData.subject,
        scheduledDateTime: sessionData.scheduledDateTime,
        endDateTime: sessionData.endDateTime,
        location: sessionData.location,
        notes: sessionData.notes,
        calendarLink: calendarEventData?.htmlLink,
        sessionId: calendarEventData?.sessionId
      };

      // TODO: Implementar envío de email
      console.log('📧 Email notification data prepared:', notificationData);
      console.log('💡 Implementa aquí tu servicio de email preferido (SendGrid, Nodemailer, etc.)');

      return {
        success: true,
        message: 'Notification data prepared (email service not implemented yet)'
      };

    } catch (error) {
      console.error('❌ Error preparing notification:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
} 