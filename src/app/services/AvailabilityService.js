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
      // Obtener información del usuario desde localStorage
      const tutorEmail = localStorage.getItem('userEmail') || '';
      const tutorId = tutorEmail; // Usar email como ID por consistencia
      
      console.log('Starting sync process for tutor:', tutorEmail);

      // Validar información del usuario
      if (!tutorEmail || tutorEmail.trim() === '') {
        throw new Error('No se encontró información del usuario en el almacenamiento local. Por favor, inicia sesión nuevamente.');
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(tutorEmail)) {
        throw new Error('El email del usuario no tiene un formato válido. Por favor, inicia sesión nuevamente.');
      }

      // Verificar conexión antes de intentar sincronizar
      const isConnected = await this.checkConnection();
      if (!isConnected) {
        throw new Error('No hay conexión activa con Google Calendar. Por favor, conecta tu calendario primero.');
      }

      console.log('Starting sync with retry for tutor:', tutorEmail);
      const result = await this.syncWithRetry(tutorId, tutorEmail);
      
      console.log('Sync completed successfully:', result);
      return result;
    } catch (error) {
      console.error('Error syncing availabilities to Firebase:', error);
      
      // Añadir contexto adicional al error
      if (error.message.includes('localStorage') || error.message.includes('almacenamiento')) {
        throw new Error(`Error de autenticación: ${error.message}`);
      } else if (error.message.includes('conexión') || error.message.includes('Calendar')) {
        throw new Error(`Error de conexión con Google Calendar: ${error.message}`);
      } else {
        throw new Error(`Error durante la sincronización: ${error.message}`);
      }
    }
  }

  // Sincronizar con reintentos automáticos para tokens expirados
  static async syncWithRetry(tutorId, tutorEmail, retryCount = 0) {
    const maxRetries = 2;
    
    try {
      // Validar parámetros antes de hacer la llamada
      if (!tutorId || !tutorEmail) {
        throw new Error('tutorId y tutorEmail son requeridos para la sincronización');
      }

      console.log(`Sync attempt ${retryCount + 1} for tutor:`, tutorEmail);

      const requestBody = {
        tutorId,
        tutorEmail
      };

      console.log('Sending sync request with body:', requestBody);

      const response = await fetch('/api/availability/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Sync response status:', response.status);

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('Failed to parse sync response:', parseError);
        throw new Error('Respuesta inválida del servidor de sincronización');
      }

      console.log('Sync response:', result);

      if (!response.ok) {
        // Manejar diferentes tipos de errores del servidor
        if (response.status === 401 && result.needsReconnection) {
          throw new Error('NEEDS_RECONNECTION: ' + (result.error || 'Token expirado'));
        }
        throw new Error(result.error || `Error del servidor (${response.status})`);
      }

      return result;
    } catch (error) {
      console.error(`Sync attempt ${retryCount + 1} failed:`, error.message);
      
      // Si es un error de reconexión necesaria, no reintentar
      if (error.message.includes('NEEDS_RECONNECTION')) {
        throw new Error(error.message.replace('NEEDS_RECONNECTION: ', '') + ' Por favor, reconecta tu Google Calendar.');
      }
      
      // Si es un error de autenticación y aún tenemos reintentos disponibles
      if ((error.message.includes('401') || 
          error.message.includes('authentication') || 
          error.message.includes('credential') ||
          error.message.includes('Token expirado')) && 
          retryCount < maxRetries) {
        
        console.log(`Attempting to refresh token for sync (retry ${retryCount + 1})...`);
        
        try {
          const refreshResult = await this.refreshGoogleToken();
          
          if (refreshResult.success) {
            console.log('Token refreshed successfully, retrying sync...');
            // Reintentar la sincronización con contador incrementado
            return await this.syncWithRetry(tutorId, tutorEmail, retryCount + 1);
          } else {
            console.log('Token refresh failed for sync, user needs to reconnect');
            throw new Error(`Token expirado y no se pudo renovar. ${refreshResult.error || 'Error desconocido'}. Por favor, reconecta tu Google Calendar.`);
          }
        } catch (refreshError) {
          console.error('Error durante refresh de token:', refreshError);
          throw new Error(`Error renovando token: ${refreshError.message}. Por favor, reconecta tu Google Calendar.`);
        }
      }
      
      // Si no es un error de autenticación o ya agotamos los reintentos
      if (retryCount >= maxRetries) {
        throw new Error(`Sincronización falló después de ${maxRetries + 1} intentos: ${error.message}`);
      }
      
      // Para otros errores, relanzar el error original
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

  // Función de testing y debugging para verificar la sincronización completa
  static async testFirebaseSync() {
    console.log('🔄 Iniciando test completo de sincronización con Firebase...');
    
    const testResults = {
      userValidation: false,
      connectionCheck: false,
      googleCalendarAccess: false,
      firebaseSync: false,
      firebaseRead: false,
      errors: [],
      details: {}
    };

    try {
      // 1. Validar información del usuario
      console.log('1️⃣ Validando información del usuario...');
      const tutorEmail = localStorage.getItem('userEmail') || '';
      const tutorId = tutorEmail;

      if (!tutorEmail) {
        throw new Error('No se encontró información del usuario');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(tutorEmail)) {
        throw new Error('Email inválido');
      }

      testResults.userValidation = true;
      testResults.details.userEmail = tutorEmail;
      console.log('✅ Usuario validado:', tutorEmail);

      // 2. Verificar conexión con Google Calendar
      console.log('2️⃣ Verificando conexión con Google Calendar...');
      const isConnected = await this.checkConnection();
      
      if (!isConnected) {
        throw new Error('No hay conexión con Google Calendar');
      }

      testResults.connectionCheck = true;
      console.log('✅ Conexión con Google Calendar verificada');

      // 3. Probar acceso a Google Calendar
      console.log('3️⃣ Probando acceso a eventos de Google Calendar...');
      try {
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        const googleResult = await this.getAvailability(
          now.toISOString().split('T')[0],
          nextWeek.toISOString().split('T')[0],
          10
        );

        testResults.googleCalendarAccess = true;
        testResults.details.googleEvents = googleResult.totalEvents || 0;
        console.log(`✅ Google Calendar accesible - ${googleResult.totalEvents} eventos encontrados`);
      } catch (calendarError) {
        console.error('❌ Error accediendo a Google Calendar:', calendarError.message);
        testResults.errors.push(`Google Calendar: ${calendarError.message}`);
      }

      // 4. Probar sincronización con Firebase
      console.log('4️⃣ Probando sincronización con Firebase...');
      try {
        const syncResult = await this.syncWithRetry(tutorId, tutorEmail);
        
        testResults.firebaseSync = true;
        testResults.details.syncResults = {
          created: syncResult.syncResults?.created || 0,
          updated: syncResult.syncResults?.updated || 0,
          totalProcessed: syncResult.syncResults?.totalProcessed || 0
        };
        console.log('✅ Sincronización con Firebase exitosa:', testResults.details.syncResults);
      } catch (syncError) {
        console.error('❌ Error en sincronización:', syncError.message);
        testResults.errors.push(`Sync: ${syncError.message}`);
      }

      // 5. Verificar lectura desde Firebase
      console.log('5️⃣ Verificando lectura desde Firebase...');
      try {
        const firebaseResult = await this.getAvailabilitiesFromFirebase();
        
        testResults.firebaseRead = true;
        testResults.details.firebaseEvents = firebaseResult.totalEvents || 0;
        console.log(`✅ Lectura desde Firebase exitosa - ${firebaseResult.totalEvents} eventos`);
      } catch (readError) {
        console.error('❌ Error leyendo desde Firebase:', readError.message);
        testResults.errors.push(`Firebase Read: ${readError.message}`);
      }

    } catch (error) {
      console.error('❌ Error en test:', error.message);
      testResults.errors.push(`General: ${error.message}`);
    }

    // Resumen de resultados
    const allPassed = testResults.userValidation && 
                     testResults.connectionCheck && 
                     testResults.googleCalendarAccess && 
                     testResults.firebaseSync && 
                     testResults.firebaseRead;

    console.log('\n📊 RESUMEN DEL TEST:');
    console.log('👤 Validación usuario:', testResults.userValidation ? '✅' : '❌');
    console.log('🔗 Conexión Google Calendar:', testResults.connectionCheck ? '✅' : '❌');
    console.log('📅 Acceso Google Calendar:', testResults.googleCalendarAccess ? '✅' : '❌');
    console.log('🔄 Sincronización Firebase:', testResults.firebaseSync ? '✅' : '❌');
    console.log('📖 Lectura Firebase:', testResults.firebaseRead ? '✅' : '❌');
    console.log('\n' + (allPassed ? '🎉 TODOS LOS TESTS PASARON' : '⚠️ ALGUNOS TESTS FALLARON'));

    if (testResults.errors.length > 0) {
      console.log('\n❌ Errores encontrados:');
      testResults.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    if (testResults.details.syncResults) {
      console.log('\n📈 Detalles de sincronización:');
      console.log(`- Creados: ${testResults.details.syncResults.created}`);
      console.log(`- Actualizados: ${testResults.details.syncResults.updated}`);
      console.log(`- Total procesados: ${testResults.details.syncResults.totalProcessed}`);
    }

    return {
      success: allPassed,
      results: testResults,
      summary: {
        totalTests: 5,
        passed: [
          testResults.userValidation,
          testResults.connectionCheck,
          testResults.googleCalendarAccess,
          testResults.firebaseSync,
          testResults.firebaseRead
        ].filter(Boolean).length,
        errors: testResults.errors
      }
    };
  }

  // Función auxiliar para debugging de conexión
  static async debugConnection() {
    console.log('🔍 Debugging conexión con Google Calendar...');
    
    try {
      // Verificar cookies
      const cookieStore = document.cookie;
      const hasAccessToken = cookieStore.includes('calendar_access_token');
      const hasRefreshToken = cookieStore.includes('calendar_refresh_token');
      
      console.log('🍪 Cookies:');
      console.log('- Access Token:', hasAccessToken ? '✅ Presente' : '❌ Ausente');
      console.log('- Refresh Token:', hasRefreshToken ? '✅ Presente' : '❌ Ausente');

      // Probar endpoint de verificación
      const checkResponse = await fetch('/api/calendar/check-connection');
      const checkResult = await checkResponse.json();
      
      console.log('🔗 Check Connection API:', checkResult);

      // Probar refresh de token si es necesario
      if (!checkResult.connected && hasRefreshToken) {
        console.log('🔄 Intentando refresh de token...');
        const refreshResponse = await fetch('/api/calendar/refresh-token', { method: 'POST' });
        const refreshResult = await refreshResponse.json();
        console.log('🔄 Refresh Token Result:', refreshResult);
      }

      return {
        cookies: { hasAccessToken, hasRefreshToken },
        connectionCheck: checkResult,
        connected: checkResult.connected
      };
    } catch (error) {
      console.error('❌ Error en debugging:', error);
      return { error: error.message };
    }
  }
} 