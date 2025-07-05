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
    
    return this.getAvailability(
      startOfWeek.toISOString().split('T')[0],
      endOfWeek.toISOString().split('T')[0]
    );
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
  
  // Obtener disponibilidad con fallback a mock data
  static async getAvailabilityWithFallback() {
    try {
      const isConnected = await this.checkConnection();
      
      if (!isConnected) {
        console.log('Not connected to Google Calendar, using mock data');
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
} 