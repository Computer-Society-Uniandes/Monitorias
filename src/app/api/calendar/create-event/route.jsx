import { cookies } from 'next/headers';
import { createEvent } from '../../../services/GoogleCalendarService.js';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('calendar_access_token');

    if (!accessToken) {
      return Response.json({ 
        error: 'No access token found', 
        connected: false 
      }, { status: 401 });
    }

    const body = await request.json();
    const { title, date, startTime, endTime, description, location, recurring } = body;

    // Validaciones básicas
    if (!date || !startTime || !endTime) {
      return Response.json({ 
        error: 'Fecha, hora de inicio y fin son requeridas'
      }, { status: 400 });
    }

    // Construir el evento para Google Calendar
    const startDateTime = new Date(`${date}T${startTime}:00`);
    const endDateTime = new Date(`${date}T${endTime}:00`);

    // Validar que la hora de fin sea después de la hora de inicio
    if (endDateTime <= startDateTime) {
      return Response.json({ 
        error: 'La hora de fin debe ser posterior a la hora de inicio'
      }, { status: 400 });
    }

    const event = {
      summary: title || 'Disponible para tutorías',
      description: description || `Horario disponible para tutorías creado desde Calico.\nHora: ${startTime} - ${endTime}`,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'America/Bogota', // Ajustar según la zona horaria
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'America/Bogota',
      },
      location: location || 'Virtual o Presencial',
      colorId: getColorIdForTitle(title),
    };

    // Agregar recurrencia si es necesario
    if (recurring) {
      event.recurrence = [
        'RRULE:FREQ=WEEKLY;BYDAY=' + getDayOfWeekAbbr(startDateTime)
      ];
    }

    console.log('Creating event in Google Calendar:', event);

    const createdEvent = await createEvent(accessToken.value, event);

    console.log('Event created successfully:', createdEvent.id);

    return Response.json({
      success: true,
      event: {
        id: createdEvent.id,
        title: createdEvent.summary,
        start: createdEvent.start.dateTime,
        end: createdEvent.end.dateTime,
        description: createdEvent.description,
        location: createdEvent.location,
        recurring: !!createdEvent.recurrence,
        googleEventId: createdEvent.id,
        htmlLink: createdEvent.htmlLink
      },
      message: 'Evento creado exitosamente en Google Calendar'
    });

  } catch (error) {
    console.error('Error creating event in Google Calendar:', error);
    
    // Manejar errores específicos de Google Calendar
    let errorMessage = 'Error al crear el evento en Google Calendar';
    
    if (error.code === 401) {
      errorMessage = 'Token de acceso expirado. Por favor, vuelve a conectar tu calendario.';
    } else if (error.code === 403) {
      errorMessage = 'No tienes permisos para crear eventos en el calendario.';
    } else if (error.code === 409) {
      errorMessage = 'Ya existe un evento en este horario.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return Response.json({ 
      error: errorMessage,
      connected: false 
    }, { status: 500 });
  }
}

// Función auxiliar para obtener el ID de color basado en el título
function getColorIdForTitle(title) {
  if (!title) return '1'; // Azul por defecto
  
  const titleLower = title.toLowerCase();
  
  // Google Calendar color IDs:
  // 1: Azul, 2: Verde, 3: Morado, 4: Rojo, 5: Amarillo, 
  // 6: Naranja, 7: Turquesa, 8: Gris, 9: Azul oscuro, 10: Verde oscuro, 11: Rojo oscuro
  
  if (titleLower.includes('cálculo') || titleLower.includes('calculo')) return '2'; // Verde
  if (titleLower.includes('física') || titleLower.includes('fisica')) return '1'; // Azul
  if (titleLower.includes('matemáticas') || titleLower.includes('matematicas')) return '6'; // Naranja
  if (titleLower.includes('programación') || titleLower.includes('programacion')) return '3'; // Morado
  if (titleLower.includes('química') || titleLower.includes('quimica')) return '4'; // Rojo
  if (titleLower.includes('biología') || titleLower.includes('biologia')) return '7'; // Turquesa
  if (titleLower.includes('historia')) return '8'; // Gris
  if (titleLower.includes('inglés') || titleLower.includes('ingles')) return '9'; // Azul oscuro
  
  return '1'; // Azul por defecto
}

// Función auxiliar para obtener la abreviación del día de la semana para recurrencia
function getDayOfWeekAbbr(date) {
  const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  return days[date.getDay()];
} 