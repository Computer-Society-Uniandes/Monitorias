import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findAvailabilityCalendar, deleteEventFromCalendar } from '../../../services/integrations/GoogleCalendarService';
import { FirebaseAvailabilityService } from '../../../services/utils/FirebaseAvailabilityService';

export async function DELETE(request) {
  try {
    // Obtener el ID del evento desde los parámetros de la URL
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    console.log('Deleting event with ID:', eventId);

    // Obtener el token de acceso desde cookies (igual que otros endpoints)
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('calendar_access_token');
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token found. Please connect your Google Calendar.' },
        { status: 401 }
      );
    }

    // Primero buscar el calendario "Disponibilidad"
    const availabilityCalendar = await findAvailabilityCalendar(accessToken.value);
    
    if (!availabilityCalendar) {
      return NextResponse.json({ 
        error: 'No se encontró un calendario llamado "Disponibilidad". El evento puede estar en otro calendario.',
        calendarFound: false
      }, { status: 404 });
    }

    console.log(`Deleting event from calendar: "${availabilityCalendar.summary}" (ID: ${availabilityCalendar.id})`);

    // Eliminar el evento del calendario "Disponibilidad" específico
    await deleteEventFromCalendar(accessToken.value, availabilityCalendar.id, eventId);
    
    // Eliminar también de Firebase
    try {
      await FirebaseAvailabilityService.deleteAvailability(eventId);
      console.log('Event also deleted from Firebase:', eventId);
    } catch (firebaseError) {
      console.error('Error deleting from Firebase (but Google Calendar event was deleted):', firebaseError);
      // No fallar la petición por error de Firebase, pero logearlo
    }
    
    return NextResponse.json({
      success: true,
      message: 'Evento eliminado exitosamente del Google Calendar y Firebase',
      eventId: eventId
    });

  } catch (error) {
    console.error('Error deleting event:', error);
    
    // Manejar errores específicos de la API de Google
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.error?.message || 'Error de la API de Google Calendar';
      
      if (status === 401) {
        return NextResponse.json(
          { error: 'Token de acceso expirado. Por favor, reconecta tu Google Calendar.' },
          { status: 401 }
        );
      } else if (status === 404) {
        return NextResponse.json(
          { error: 'Evento no encontrado. Puede que ya haya sido eliminado.' },
          { status: 404 }
        );
      } else if (status === 403) {
        return NextResponse.json(
          { error: 'No tienes permisos para eliminar este evento.' },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: `Error de Google Calendar: ${message}` },
        { status: status }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 