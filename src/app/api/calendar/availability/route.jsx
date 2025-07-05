import { cookies } from 'next/headers';
import { listEvents } from '../../../services/GoogleCalendarService';

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

    console.log('Fetching availability events from Google Calendar...');
    console.log('Time range:', timeMin, 'to', timeMax);

    const events = await listEvents(accessToken.value, timeMin, timeMax, maxResults);

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
        color: getColorForEvent(event.summary || 'Disponible'),
        description: event.description || '',
        location: event.location || '',
        googleEventId: event.id
      };
    });

    // Filtrar y agrupar eventos por tipo si es necesario
    const filteredSlots = availabilitySlots.filter(slot => {
      // Filtrar eventos que parezcan disponibilidad (puedes ajustar estos criterios)
      const title = slot.title.toLowerCase();
      return title.includes('disponible') || 
             title.includes('libre') || 
             title.includes('tutoria') || 
             title.includes('tutoría') ||
             title.includes('disponibilidad');
    });

    console.log(`Found ${events.length} events, ${filteredSlots.length} availability slots`);

    return Response.json({
      success: true,
      connected: true,
      events: events,
      availabilitySlots: filteredSlots,
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

// Función auxiliar para asignar colores basados en el título del evento
function getColorForEvent(title) {
  const colors = {
    'cálculo': '#4CAF50',
    'física': '#2196F3',
    'matemáticas': '#FF9800',
    'programación': '#9C27B0',
    'química': '#E91E63',
    'biología': '#00BCD4',
    'historia': '#795548',
    'inglés': '#607D8B',
    'default': '#666666'
  };

  const titleLower = title.toLowerCase();
  
  for (const [subject, color] of Object.entries(colors)) {
    if (titleLower.includes(subject)) {
      return color;
    }
  }
  
  return colors.default;
} 