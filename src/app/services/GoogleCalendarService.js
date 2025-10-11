import { google } from 'googleapis';
import { refreshAccessTokenFromCookies } from './CalendarAuthService';
import { cookies } from 'next/headers';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly'
];

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export const getAuthUrl = () => {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
};

export const getTokens = async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token) {
      throw new Error('No access token received');
    }

    oauth2Client.setCredentials(tokens);
    return tokens;
  } catch (error) {
    console.error("Error exchanging code for tokens:", error);
    throw error;
  }
};

// Función auxiliar para manejar refresh de tokens automáticamente
const handleTokenRefresh = async (accessToken) => {
  try {
    // Intentar usar el token actual primero y adjuntar refresh_token si está en cookies
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('calendar_refresh_token')?.value;

    const creds = { access_token: accessToken };
    if (refreshToken) creds.refresh_token = refreshToken;

    oauth2Client.setCredentials(creds);
    return { success: true, refreshed: false };
  } catch (error) {
    console.log('Token may be expired, attempting refresh...');
    
    try {
      // Intentar refresh del token server-side usando cookies (sin fetch HTTP)
      const refreshResult = await refreshAccessTokenFromCookies();

      if (refreshResult.success) {
        console.log('Token refreshed successfully (server-side)');
        // Si el helper devolvió credenciales, aplícalas al oauth2Client
        if (refreshResult.credentials) {
          oauth2Client.setCredentials(refreshResult.credentials);
        } else if (refreshResult.accessToken) {
          // Asegurar que el refresh_token también esté presente si está en cookies
          const cookieStore2 = await cookies();
          const refreshToken2 = cookieStore2.get('calendar_refresh_token')?.value;
          const newCreds = { access_token: refreshResult.accessToken };
          if (refreshToken2) newCreds.refresh_token = refreshToken2;
          oauth2Client.setCredentials(newCreds);
        }
        return { success: true, refreshed: true };
      } else {
        console.error('Token refresh failed:', refreshResult.error);
        return {
          success: false,
          error: refreshResult.error,
          needsReconnection: refreshResult.needsReconnection
        };
      }
    } catch (refreshError) {
      console.error('Error during token refresh:', refreshError);
      return { success: false, error: 'Failed to refresh token', needsReconnection: true };
    }
  }
};

// Función wrapper para ejecutar operaciones con retry automático
const executeWithRetry = async (operation, accessToken, operationName = 'Google Calendar operation') => {
  try {
    // Intentar configurar el token
    const tokenResult = await handleTokenRefresh(accessToken);
    if (!tokenResult.success) {
      throw new Error(`Authentication failed: ${tokenResult.error}`);
    }
    
    // Ejecutar la operación
    return await operation();
  } catch (error) {
    console.error(`${operationName} failed:`, error);
    
    // Si es un error de autenticación, intentar refresh y retry
    if (error.code === 401 || error.message.includes('authentication') || error.message.includes('credential')) {
      console.log(`${operationName} failed with auth error, attempting token refresh...`);
      
      try {
        const refreshResult = await refreshAccessTokenFromCookies();

        if (refreshResult.success) {
          console.log(`Token refreshed, retrying ${operationName}...`);
          return await operation();
        } else {
          throw new Error(`Token refresh failed: ${refreshResult.error}. Please reconnect your Google Calendar.`);
        }
      } catch (refreshError) {
        console.error('Token refresh attempt failed:', refreshError);
        throw new Error(`Authentication expired. Please reconnect your Google Calendar. Details: ${refreshError.message}`);
      }
    }
    
    // Si no es un error de autenticación, relanzar el error original
    throw error;
  }
};

export const listEvents = async (accessToken, timeMin, timeMax, maxResults = 10) => {
  const operation = async () => {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin || new Date().toISOString(),
      timeMax: timeMax,
      maxResults: maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items;
  };

  return executeWithRetry(operation, accessToken, 'List events');
};

export const createEvent = async (accessToken, event) => {
  const operation = async () => {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });
    return response.data;
  };

  return executeWithRetry(operation, accessToken, 'Create event');
};

export const deleteEvent = async (accessToken, eventId) => {
  const operation = async () => {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });
    return true;
  };

  return executeWithRetry(operation, accessToken, 'Delete event');
};

// Función para encontrar el calendario "Disponibilidad" del tutor
export const findAvailabilityCalendar = async (accessToken) => {
  const operation = async () => {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const response = await calendar.calendarList.list();
    const calendars = response.data.items;
    
    // Buscar el calendario que contenga "Disponibilidad" en el nombre
    const availabilityCalendar = calendars.find(cal => 
      cal.summary && cal.summary.toLowerCase().includes('disponibilidad')
    );
    
    if (availabilityCalendar) {
      return {
        id: availabilityCalendar.id,
        summary: availabilityCalendar.summary,
        description: availabilityCalendar.description,
        accessRole: availabilityCalendar.accessRole
      };
    }
    
    return null;
  };

  return executeWithRetry(operation, accessToken, 'Find availability calendar');
};

// Función modificada para listar eventos de un calendario específico
export const listEventsFromCalendar = async (accessToken, calendarId, timeMin, timeMax, maxResults = 10) => {
  const operation = async () => {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: timeMin || new Date().toISOString(),
      timeMax: timeMax,
      maxResults: maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items;
  };

  return executeWithRetry(operation, accessToken, 'List events from specific calendar');
};

// Función para crear evento en un calendario específico
export const createEventInCalendar = async (accessToken, calendarId, event) => {
  const operation = async () => {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const response = await calendar.events.insert({
      calendarId: calendarId,
      resource: event,
    });
    return response.data;
  };

  return executeWithRetry(operation, accessToken, 'Create event in specific calendar');
};

// Función para eliminar evento de un calendario específico
export const deleteEventFromCalendar = async (accessToken, calendarId, eventId) => {
  const operation = async () => {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    await calendar.events.delete({
      calendarId: calendarId,
      eventId: eventId,
    });
    return true;
  };

  return executeWithRetry(operation, accessToken, 'Delete event from specific calendar');
};

export const getFreeBusy = async (accessToken, timeMin, timeMax) => {
  const operation = async () => {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const response = await calendar.freebusy.query({
      resource: {
        timeMin,
        timeMax,
        items: [{ id: 'primary' }],
      },
    });
    return response.data.calendars.primary.busy;
  };

  return executeWithRetry(operation, accessToken, 'Get free/busy');
}; 