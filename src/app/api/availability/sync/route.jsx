import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { listEvents } from '../../../services/GoogleCalendarService';
import { FirebaseAvailabilityService } from '../../../services/FirebaseAvailabilityService';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('calendar_access_token');

    if (!accessToken) {
      return NextResponse.json({ 
        error: 'No access token found. Please connect your Google Calendar first.',
        connected: false 
      }, { status: 401 });
    }

    const body = await request.json();
    const { tutorId, tutorEmail, startDate, endDate, forceSync = false } = body;

    // Validar información del tutor
    if (!tutorId || !tutorEmail) {
      return NextResponse.json({ 
        error: 'Información del tutor es requerida (tutorId, tutorEmail)'
      }, { status: 400 });
    }

    // Calcular fechas por defecto (próximos 30 días)
    const now = new Date();
    const timeMin = startDate ? new Date(startDate).toISOString() : now.toISOString();
    const timeMax = endDate ? new Date(endDate).toISOString() : 
      new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    console.log('Syncing availability events from Google Calendar to Firebase...');
    console.log('Time range:', timeMin, 'to', timeMax);
    console.log('Tutor:', tutorId, tutorEmail);

    // Obtener eventos desde Google Calendar
    const googleEvents = await listEvents(accessToken.value, timeMin, timeMax, 100);
    
    console.log(`Found ${googleEvents.length} events in Google Calendar`);

    // Filtrar eventos que parecen ser de disponibilidad
    const availabilityKeywords = [
      'disponible', 'libre', 'tutoria', 'tutoría', 'sesión', 'sesion',
      'clase', 'enseñanza', 'apoyo', 'ayuda', 'consulta', 'available',
      'free', 'teaching', 'support', 'help', 'consultation'
    ];

    const availabilityEvents = googleEvents.filter(event => {
      if (!event.summary) return false;
      
      const summary = event.summary.toLowerCase();
      return availabilityKeywords.some(keyword => 
        summary.includes(keyword.toLowerCase())
      );
    });

    console.log(`Found ${availabilityEvents.length} availability events`);

    if (availabilityEvents.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No se encontraron eventos de disponibilidad para sincronizar',
        syncResults: {
          created: 0,
          updated: 0,
          errors: [],
          totalProcessed: 0
        }
      });
    }

    // Sincronizar eventos con Firebase
    const syncResults = await FirebaseAvailabilityService.syncGoogleEventsToFirebase(
      availabilityEvents,
      tutorId,
      tutorEmail
    );

    console.log('Sync completed:', syncResults);

    return NextResponse.json({
      success: true,
      message: `Sincronización completada: ${syncResults.created} creados, ${syncResults.updated} actualizados`,
      syncResults: {
        ...syncResults,
        totalProcessed: availabilityEvents.length
      }
    });

  } catch (error) {
    console.error('Error syncing availabilities:', error);
    
    // Manejar errores específicos de Google Calendar
    let errorMessage = 'Error al sincronizar disponibilidades';
    
    if (error.code === 401) {
      errorMessage = 'Token de acceso expirado. Por favor, vuelve a conectar tu calendario.';
    } else if (error.code === 403) {
      errorMessage = 'No tienes permisos para acceder al calendario.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ 
      success: false,
      error: errorMessage,
      syncResults: {
        created: 0,
        updated: 0,
        errors: [{ error: errorMessage }],
        totalProcessed: 0
      }
    }, { status: 500 });
  }
} 