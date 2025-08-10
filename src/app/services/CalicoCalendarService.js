import { google } from 'googleapis';

/**
 * Servicio para gestionar eventos en el calendario central de Calico
 * usando una Service Account de Google Calendar API
 */
export class CalicoCalendarService {
  static calenderId = null;
  static auth = null;

  /**
   * Inicializar la autenticación con Service Account
   */
  static async initializeAuth() {
    try {
      if (this.auth) {
        return this.auth; // Ya está inicializado
      }

      // Obtener las credenciales de la variable de entorno
      const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
      if (!serviceAccountKey) {
        throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set');
      }

      // Obtener el ID del calendario central
      this.calenderId = process.env.CALICO_CALENDAR_ID;
      if (!this.calenderId) {
        throw new Error('CALICO_CALENDAR_ID environment variable is not set');
      }

      // Parsear las credenciales JSON
      let credentials;
      try {
        credentials = JSON.parse(serviceAccountKey);
      } catch (parseError) {
        throw new Error(`Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY: ${parseError.message}`);
      }

      // Configurar la autenticación con Google Auth
      this.auth = new google.auth.GoogleAuth({
        credentials: credentials,
        scopes: [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events'
        ]
      });

      console.log('✅ Google Calendar Service Account initialized successfully');
      return this.auth;
    } catch (error) {
      console.error('❌ Error initializing Google Calendar Service Account:', error);
      throw new Error(`Failed to initialize Google Calendar Service Account: ${error.message}`);
    }
  }

  /**
   * Obtener el cliente de Google Calendar autenticado
   */
  static async getCalendarClient() {
    try {
      const auth = await this.initializeAuth();
      const calendar = google.calendar({ version: 'v3', auth });
      return calendar;
    } catch (error) {
      console.error('Error getting calendar client:', error);
      throw error;
    }
  }

  /**
   * Crear un evento de sesión de tutoría en el calendario central de Calico
   */
  static async createTutoringSessionEvent(sessionData) {
    try {
      const {
        summary,
        description,
        startDateTime,
        endDateTime,
        attendees = [],
        location = 'Virtual/Presencial',
        tutorEmail,
        tutorName
      } = sessionData;

      // Validaciones
      if (!summary || !startDateTime || !endDateTime) {
        throw new Error('summary, startDateTime, and endDateTime are required');
      }

      if (!tutorEmail) {
        throw new Error('tutorEmail is required');
      }

      // Asegurar que el tutor esté en la lista de asistentes
      const attendeeEmails = attendees.map(a => a.email);
      if (!attendeeEmails.includes(tutorEmail)) {
        attendees.push({
          email: tutorEmail,
          displayName: tutorName || tutorEmail,
          responseStatus: 'accepted' // El tutor siempre acepta
        });
      }

      // Configurar fechas con zona horaria de Colombia
      const timeZone = 'America/Bogota';
      
      // Asegurar que las fechas estén en formato ISO
      const start = startDateTime instanceof Date ? startDateTime.toISOString() : startDateTime;
      const end = endDateTime instanceof Date ? endDateTime.toISOString() : endDateTime;

      // Configurar el evento
      const event = {
        summary: summary,
        description: description || `Sesión de tutoría agendada a través de Calico.\n\nTutor: ${tutorName || tutorEmail}`,
        start: {
          dateTime: start,
          timeZone: timeZone
        },
        end: {
          dateTime: end,
          timeZone: timeZone
        },
        location: location,
        attendees: attendees.map(attendee => ({
          email: attendee.email,
          displayName: attendee.displayName || attendee.email,
          responseStatus: attendee.responseStatus || 'needsAction'
        })),
        // Configuraciones adicionales
        status: 'confirmed',
        visibility: 'default',
        guestsCanInviteOthers: false,
        guestsCanModify: false,
        guestsCanSeeOtherGuests: true,
        // Recordatorios
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 día antes
            { method: 'popup', minutes: 30 }       // 30 minutos antes
          ]
        }
      };

      console.log('📅 Creating tutoring session event in Calico calendar...');
      console.log('Event data:', {
        summary: event.summary,
        start: event.start,
        end: event.end,
        attendees: event.attendees.map(a => a.email),
        calendarId: this.calenderId
      });

      // Obtener el cliente de Calendar
      const calendar = await this.getCalendarClient();

      // Crear el evento en el calendario central
      const response = await calendar.events.insert({
        calendarId: this.calenderId,
        resource: event,
        sendUpdates: 'all' // Enviar invitaciones por email a todos los asistentes
      });

      console.log('✅ Tutoring session event created successfully:', response.data.id);

      return {
        success: true,
        eventId: response.data.id,
        htmlLink: response.data.htmlLink,
        hangoutLink: response.data.hangoutLink,
        event: response.data
      };

    } catch (error) {
      console.error('❌ Error creating tutoring session event:', error);
      
      // Manejar errores específicos de Google Calendar API
      if (error.code === 403) {
        throw new Error('No se tienen permisos para crear eventos en el calendario central. Verifica la configuración de la Service Account.');
      } else if (error.code === 404) {
        throw new Error('El calendario central no fue encontrado. Verifica el CALICO_CALENDAR_ID.');
      } else if (error.code === 400) {
        throw new Error(`Datos del evento inválidos: ${error.message}`);
      }
      
      throw new Error(`Error creando evento en calendario central: ${error.message}`);
    }
  }

  /**
   * Actualizar un evento de sesión de tutoría
   */
  static async updateTutoringSessionEvent(eventId, updateData) {
    try {
      if (!eventId) {
        throw new Error('Event ID is required for update');
      }

      console.log('📅 Updating tutoring session event:', eventId);

      const calendar = await this.getCalendarClient();

      // Obtener el evento actual
      const currentEvent = await calendar.events.get({
        calendarId: this.calenderId,
        eventId: eventId
      });

      // Combinar datos actuales con actualizaciones
      const updatedEvent = {
        ...currentEvent.data,
        ...updateData,
        // Preservar campos importantes si no se especifican
        start: updateData.start || currentEvent.data.start,
        end: updateData.end || currentEvent.data.end
      };

      // Actualizar el evento
      const response = await calendar.events.update({
        calendarId: this.calenderId,
        eventId: eventId,
        resource: updatedEvent,
        sendUpdates: 'all'
      });

      console.log('✅ Tutoring session event updated successfully');

      return {
        success: true,
        eventId: response.data.id,
        event: response.data
      };

    } catch (error) {
      console.error('❌ Error updating tutoring session event:', error);
      throw new Error(`Error actualizando evento: ${error.message}`);
    }
  }

  /**
   * Cancelar/eliminar un evento de sesión de tutoría
   */
  static async cancelTutoringSessionEvent(eventId, reason = 'Sesión cancelada') {
    try {
      if (!eventId) {
        throw new Error('Event ID is required for cancellation');
      }

      console.log('📅 Cancelling tutoring session event:', eventId);

      const calendar = await this.getCalendarClient();

      // Opción 1: Marcar como cancelado (mantiene el historial)
      const response = await calendar.events.patch({
        calendarId: this.calenderId,
        eventId: eventId,
        resource: {
          status: 'cancelled',
          summary: `[CANCELADA] ${reason}`
        },
        sendUpdates: 'all'
      });

      console.log('✅ Tutoring session event cancelled successfully');

      return {
        success: true,
        eventId: response.data.id,
        status: 'cancelled'
      };

    } catch (error) {
      console.error('❌ Error cancelling tutoring session event:', error);
      throw new Error(`Error cancelando evento: ${error.message}`);
    }
  }

  /**
   * Eliminar completamente un evento de sesión de tutoría
   */
  static async deleteTutoringSessionEvent(eventId) {
    try {
      if (!eventId) {
        throw new Error('Event ID is required for deletion');
      }

      console.log('📅 Deleting tutoring session event:', eventId);

      const calendar = await this.getCalendarClient();

      await calendar.events.delete({
        calendarId: this.calenderId,
        eventId: eventId,
        sendUpdates: 'all'
      });

      console.log('✅ Tutoring session event deleted successfully');

      return {
        success: true,
        eventId: eventId,
        deleted: true
      };

    } catch (error) {
      console.error('❌ Error deleting tutoring session event:', error);
      throw new Error(`Error eliminando evento: ${error.message}`);
    }
  }

  /**
   * Obtener información de un evento específico
   */
  static async getTutoringSessionEvent(eventId) {
    try {
      if (!eventId) {
        throw new Error('Event ID is required');
      }

      const calendar = await this.getCalendarClient();

      const response = await calendar.events.get({
        calendarId: this.calenderId,
        eventId: eventId
      });

      return {
        success: true,
        event: response.data
      };

    } catch (error) {
      console.error('❌ Error getting tutoring session event:', error);
      throw new Error(`Error obteniendo evento: ${error.message}`);
    }
  }
}
