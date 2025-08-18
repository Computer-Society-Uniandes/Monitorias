import { cookies } from 'next/headers';
import { findAvailabilityCalendar, listEventsFromCalendar } from '../../../services/GoogleCalendarService';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('calendar_access_token');

    if (!accessToken) {
      return Response.json({ 
        error: 'No access token found', 
        connected: false 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const maxResults = searchParams.get('maxResults') || 50;

    // Calcular fechas por defecto (próximos 7 días)
    const now = new Date();
    const timeMin = startDate ? new Date(startDate).toISOString() : now.toISOString();
    const timeMax = endDate ? new Date(endDate).toISOString() : 
      new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    console.log('Fetching availability events from Disponibilidad calendar...');
    console.log('Time range:', timeMin, 'to', timeMax);

    // Primero buscar el calendario "Disponibilidad"
    const availabilityCalendar = await findAvailabilityCalendar(accessToken.value);
    
    if (!availabilityCalendar) {
      return Response.json({
        error: 'No se encontró un calendario llamado "Disponibilidad". Por favor, crea un calendario con ese nombre en tu cuenta de Google.',
        connected: true,
        calendarFound: false,
        events: [],
        availabilitySlots: [],
        totalEvents: 0,
        message: 'Para usar esta funcionalidad, necesitas crear un calendario llamado "Disponibilidad" en tu cuenta de Google Calendar.'
      }, { status: 404 });
    }

    console.log(`Using calendar: "${availabilityCalendar.summary}" (ID: ${availabilityCalendar.id})`);

    const events = await listEventsFromCalendar(
      accessToken.value, 
      availabilityCalendar.id, 
      timeMin, 
      timeMax, 
      maxResults
    );

    // Mapear eventos de Google Calendar al formato esperado por la aplicación
    const availabilitySlots = events.map(event => {
      const start = new Date(event.start.dateTime || event.start.date);
      const end = new Date(event.end.dateTime || event.end.date);
      const dayOfWeek = getDayOfWeek(start);
      
      return {
        id: event.id,
        title: event.summary || 'Disponible',
        day: dayOfWeek,
        startTime: formatTime(start),
        endTime: formatTime(end),
        date: start.toISOString().split('T')[0],
        recurring: event.recurrence && event.recurrence.length > 0,
        color: getRandomColor(),
        description: event.description || '',
        location: event.location || '',
        googleEventId: event.id
      };
    });

    // Como todos los eventos vienen del calendario "Disponibilidad", 
    // no necesitamos filtrar - todos son válidos
    console.log(`Found ${events.length} events in Disponibilidad calendar`);

    return Response.json({
      success: true,
      connected: true,
      calendarFound: true,
      calendar: availabilityCalendar,
      events: events,
      availabilitySlots: availabilitySlots,
      totalEvents: events.length,
      timeRange: {
        start: timeMin,
        end: timeMax
      }
    });

  } catch (error) {
    console.error('Error fetching availability from Google Calendar:', error);
    return Response.json({ 
      error: 'Failed to fetch availability', 
      message: error.message,
      connected: false 
    }, { status: 500 });
  }
}

// Función auxiliar para obtener el día de la semana
function getDayOfWeek(date) {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[date.getDay()];
}

// Función auxiliar para formatear hora
function formatTime(date) {
  return date.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  });
}

// Función auxiliar para obtener color aleatorio
function getRandomColor() {
  const colors = [
    '#4CAF50', // Verde
    '#2196F3', // Azul
    '#FF9800', // Naranja
    '#9C27B0', // Púrpura
    '#F44336', // Rojo
    '#795548', // Marrón
    '#3F51B5', // Índigo
    '#607D8B', // Azul gris
    '#FFC107', // Ámbar
    '#009688', // Verde azulado
    '#E91E63', // Rosa
    '#673AB7', // Púrpura profundo
    '#FF5722', // Naranja profundo
    '#8BC34A', // Verde claro
    '#00BCD4', // Cian
    '#CDDC39', // Lima
    '#FF9E80', // Naranja claro
    '#A1C4FD', // Azul claro
    '#C2E9FB', // Azul muy claro
    '#FFB74D'  // Naranja medio
  ];
  
  const randomIndex = Math.floor(Math.random() * colors.length);
  return colors[randomIndex];
} 