// Servicio para manejar la disponibilidad del tutor
export class AvailabilityService {
  
  // Obtener disponibilidad desde Google Calendar
  static async getAvailability(startDate = null, endDate = null, maxResults = 50) {
    try {
      const params = new URLSearchParams();
      
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (maxResults) params.append('maxResults', maxResults.toString());
      
      const response = await fetch(`/api/calendar/availability?${params}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch availability');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching availability:', error);
      throw error;
    }
  }
  
  // Obtener disponibilidad para la semana actual
  static async getWeeklyAvailability() {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return this.getAvailabilityWithRetry(
      startOfWeek.toISOString().split('T')[0],
      endOfWeek.toISOString().split('T')[0]
    );
  }

  // Obtener disponibilidad con reintentos automáticos para tokens expirados
  static async getAvailabilityWithRetry(startDate = null, endDate = null, maxResults = 50) {
    try {
      return await this.getAvailability(startDate, endDate, maxResults);
    } catch (error) {
      console.log('First attempt failed, checking if token needs refresh...');
      
      // Si es un error de autenticación, intentar renovar el token
      if (error.message.includes('401') || 
          error.message.includes('authentication') || 
          error.message.includes('credential')) {
        
        console.log('Attempting to refresh token...');
        const refreshResult = await this.refreshGoogleToken();
        
        if (refreshResult.success) {
          console.log('Token refreshed, retrying availability request...');
          // Reintentar después de renovar el token
          return await this.getAvailability(startDate, endDate, maxResults);
        } else {
          console.log('Token refresh failed, user needs to reconnect');
          throw new Error(`Token expirado. ${refreshResult.error}. Por favor, reconecta tu Google Calendar.`);
        }
      }
      
      // Si no es un error de autenticación, relanzar el error original
      throw error;
    }
  }
  
  // Obtener disponibilidad para un rango de fechas específico
  static async getAvailabilityForDateRange(startDate, endDate) {
    return this.getAvailability(startDate, endDate);
  }
  
  // Verificar si el usuario está conectado a Google Calendar
  static async checkConnection() {
    try {
      const response = await fetch('/api/calendar/check-connection');
      const data = await response.json();
      return data.connected;
    } catch (error) {
      console.error('Error checking connection:', error);
      return false;
    }
  }

  // Intentar renovar el token de Google Calendar
  static async refreshGoogleToken() {
    try {
      const response = await fetch('/api/calendar/refresh-token', {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('Google Calendar token refreshed successfully');
        return { success: true };
      } else {
        console.log('Token refresh failed:', result.error);
        return { 
          success: false, 
          needsReconnection: result.needsReconnection,
          error: result.error 
        };
      }
    } catch (error) {
      console.error('Error refreshing Google token:', error);
      return { 
        success: false, 
        needsReconnection: true,
        error: error.message 
      };
    }
  }
  
  // Obtener disponibilidad con fallback a mock data
  static async getAvailabilityWithFallback() {
    try {
      const isConnected = await this.checkConnection();
      
      if (!isConnected) {
        console.log('Not connected to Google Calendar, checking Firebase...');
        
        // Intentar obtener desde Firebase
        try {
          const firebaseResult = await this.getAvailabilitiesFromFirebase();
          if (firebaseResult.success && firebaseResult.availabilitySlots.length > 0) {
            return {
              ...firebaseResult,
              connected: false,
              source: 'firebase'
            };
          }
        } catch (firebaseError) {
          console.log('Firebase also unavailable, using mock data');
        }
        
        return {
          success: true,
          connected: false,
          availabilitySlots: this.getMockAvailability(),
          totalEvents: 5,
          usingMockData: true
        };
      }
      
      const result = await this.getWeeklyAvailability();
      
      // Si no hay eventos de disponibilidad, usar mock data como ejemplo
      if (result.availabilitySlots.length === 0) {
        console.log('No availability events found, using mock data as example');
        return {
          ...result,
          availabilitySlots: this.getMockAvailability(),
          usingMockData: true,
          message: 'No se encontraron eventos de disponibilidad en tu calendario. Mostrando ejemplos.'
        };
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching availability, falling back to mock data:', error);
      return {
        success: false,
        connected: false,
        availabilitySlots: this.getMockAvailability(),
        totalEvents: 5,
        usingMockData: true,
        error: error.message
      };
    }
  }
  
  // Mock data para cuando no hay conexión o eventos
  static getMockAvailability() {
    return [
      {
        id: 'mock-1',
        title: 'Disponible para Cálculo',
        day: 'Lunes',
        startTime: '09:00',
        endTime: '11:00',
        date: this.getDateForDay(1), // Lunes
        recurring: true,
        color: '#4CAF50',
        description: 'Horario disponible para tutorías de Cálculo',
        location: 'Virtual o Presencial',
        googleEventId: null
      },
      {
        id: 'mock-2',
        title: 'Disponible para Física',
        day: 'Martes',
        startTime: '14:00',
        endTime: '16:00',
        date: this.getDateForDay(2), // Martes
        recurring: true,
        color: '#2196F3',
        description: 'Horario disponible para tutorías de Física',
        location: 'Virtual o Presencial',
        googleEventId: null
      },
      {
        id: 'mock-3',
        title: 'Disponible para Matemáticas',
        day: 'Miércoles',
        startTime: '10:00',
        endTime: '12:00',
        date: this.getDateForDay(3), // Miércoles
        recurring: true,
        color: '#FF9800',
        description: 'Horario disponible para tutorías de Matemáticas',
        location: 'Virtual o Presencial',
        googleEventId: null
      },
      {
        id: 'mock-4',
        title: 'Disponible para Programación',
        day: 'Jueves',
        startTime: '15:00',
        endTime: '17:00',
        date: this.getDateForDay(4), // Jueves
        recurring: true,
        color: '#9C27B0',
        description: 'Horario disponible para tutorías de Programación',
        location: 'Virtual o Presencial',
        googleEventId: null
      },
      {
        id: 'mock-5',
        title: 'Disponible para Tutorías Generales',
        day: 'Viernes',
        startTime: '08:00',
        endTime: '10:00',
        date: this.getDateForDay(5), // Viernes
        recurring: true,
        color: '#607D8B',
        description: 'Horario disponible para tutorías de cualquier materia',
        location: 'Virtual o Presencial',
        googleEventId: null
      }
    ];
  }
  
  // Obtener fecha para un día específico de la semana actual
  static getDateForDay(dayOfWeek) {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const targetDate = new Date(startOfWeek.getTime() + dayOfWeek * 24 * 60 * 60 * 1000);
    return targetDate.toISOString().split('T')[0];
  }
  
  // Agrupar slots por día de la semana
  static groupSlotsByDay(slots) {
    const grouped = {};
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    // Inicializar todos los días
    days.forEach(day => {
      grouped[day] = [];
    });
    
    // Agrupar slots
    slots.forEach(slot => {
      if (grouped[slot.day]) {
        grouped[slot.day].push(slot);
      }
    });
    
    return grouped;
  }
  
  // Calcular total de horas disponibles
  static calculateTotalHours(slots) {
    let totalHours = 0;
    
    slots.forEach(slot => {
      const start = new Date(`2000-01-01T${slot.startTime}`);
      const end = new Date(`2000-01-01T${slot.endTime}`);
      const hours = (end - start) / (1000 * 60 * 60);
      totalHours += hours;
    });
    
    return totalHours;
  }
  
  // Obtener estadísticas de disponibilidad
  static getAvailabilityStats(slots) {
    return {
      totalSlots: slots.length,
      totalHours: this.calculateTotalHours(slots),
      recurringSlots: slots.filter(slot => slot.recurring).length,
      uniqueDays: [...new Set(slots.map(slot => slot.day))].length
    };
  }
  
  // Crear un nuevo evento de disponibilidad en Google Calendar
  static async createAvailabilityEvent(eventData) {
    try {
      // Obtener información del usuario desde localStorage
      const tutorId = localStorage.getItem('userEmail') || 'unknown';
      const tutorEmail = localStorage.getItem('userEmail') || '';
      
      if (!tutorEmail) {
        throw new Error('No se encontró información del usuario. Por favor, inicia sesión nuevamente.');
      }
      
      const response = await fetch('/api/calendar/create-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...eventData,
          tutorId,
          tutorEmail
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al crear el evento');
      }
      
      return result;
    } catch (error) {
      console.error('Error creating availability event:', error);
      throw error;
    }
  }

  // Eliminar un evento de disponibilidad de Google Calendar
  static async deleteAvailabilityEvent(eventId) {
    try {
      const response = await fetch(`/api/calendar/delete-event?eventId=${eventId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al eliminar el evento');
      }
      
      return result;
    } catch (error) {
      console.error('Error deleting availability event:', error);
      throw error;
    }
  }
  
  // Validar datos del evento antes de enviarlo
  static validateEventData(eventData) {
    const errors = [];
    
    if (!eventData.date) {
      errors.push('La fecha es requerida');
    }
    
    if (!eventData.startTime) {
      errors.push('La hora de inicio es requerida');
    }
    
    if (!eventData.endTime) {
      errors.push('La hora de fin es requerida');
    }
    
    if (eventData.startTime && eventData.endTime) {
      const startTime = new Date(`2000-01-01T${eventData.startTime}:00`);
      const endTime = new Date(`2000-01-01T${eventData.endTime}:00`);
      
      if (endTime <= startTime) {
        errors.push('La hora de fin debe ser posterior a la hora de inicio');
      }
    }
    
    if (eventData.date) {
      const selectedDate = new Date(eventData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        errors.push('No se puede crear un evento en una fecha pasada');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Obtener disponibilidades desde Firebase
  static async getAvailabilitiesFromFirebase() {
    try {
      const tutorId = localStorage.getItem('userEmail') || '';
      
      if (!tutorId) {
        throw new Error('No se encontró información del usuario');
      }

      const response = await fetch(`/api/availability?tutorId=${tutorId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al obtener disponibilidades');
      }

      return {
        success: true,
        availabilitySlots: result.availabilities || [],
        totalEvents: result.totalCount || 0,
        source: 'firebase'
      };
    } catch (error) {
      console.error('Error fetching availabilities from Firebase:', error);
      throw error;
    }
  }

  // Sincronizar disponibilidades desde Google Calendar hacia Firebase
  static async syncAvailabilitiesToFirebase() {
    try {
      const tutorId = localStorage.getItem('userEmail') || '';
      const tutorEmail = localStorage.getItem('userEmail') || '';
      
      if (!tutorEmail) {
        throw new Error('No se encontró información del usuario. Por favor, inicia sesión nuevamente.');
      }

      return await this.syncWithRetry(tutorId, tutorEmail);
    } catch (error) {
      console.error('Error syncing availabilities to Firebase:', error);
      throw error;
    }
  }

  // Sincronizar con reintentos automáticos para tokens expirados
  static async syncWithRetry(tutorId, tutorEmail) {
    try {
      const response = await fetch('/api/availability/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tutorId,
          tutorEmail
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al sincronizar disponibilidades');
      }

      return result;
    } catch (error) {
      console.log('Sync attempt failed, checking if token needs refresh...');
      
      // Si es un error de autenticación, intentar renovar el token
      if (error.message.includes('401') || 
          error.message.includes('authentication') || 
          error.message.includes('credential')) {
        
        console.log('Attempting to refresh token for sync...');
        const refreshResult = await this.refreshGoogleToken();
        
        if (refreshResult.success) {
          console.log('Token refreshed, retrying sync...');
          // Reintentar la sincronización después de renovar el token
          const response = await fetch('/api/availability/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              tutorId,
              tutorEmail
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || 'Error al sincronizar disponibilidades después de renovar token');
          }

          return result;
        } else {
          console.log('Token refresh failed for sync, user needs to reconnect');
          throw new Error(`Token expirado. ${refreshResult.error}. Por favor, reconecta tu Google Calendar para sincronizar.`);
        }
      }
      
      // Si no es un error de autenticación, relanzar el error original
      throw error;
    }
  }

  // Obtener disponibilidades por materia (para estudiantes)
  static async getAvailabilitiesBySubject(subject) {
    try {
      const response = await fetch(`/api/availability?subject=${encodeURIComponent(subject)}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al obtener disponibilidades');
      }

      return {
        success: true,
        availabilitySlots: result.availabilities || [],
        totalEvents: result.totalCount || 0,
        source: 'firebase'
      };
    } catch (error) {
      console.error('Error fetching availabilities by subject:', error);
      throw error;
    }
  }

  // Obtener disponibilidades en un rango de fechas (para estudiantes)
  static async getAvailabilitiesInRange(startDate, endDate) {
    try {
      const params = new URLSearchParams({
        startDate: startDate,
        endDate: endDate
      });

      const response = await fetch(`/api/availability?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al obtener disponibilidades');
      }

      return {
        success: true,
        availabilitySlots: result.availabilities || [],
        totalEvents: result.totalCount || 0,
        source: 'firebase'
      };
    } catch (error) {
      console.error('Error fetching availabilities in range:', error);
      throw error;
    }
  }
} 