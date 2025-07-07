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

    // Mejorar validación del body
    let body;
    try {
      const requestText = await request.text();
      console.log('Request body text:', requestText);
      
      if (!requestText || requestText.trim() === '') {
        console.log('Empty request body received');
        return NextResponse.json({ 
          error: 'Request body is empty. Please provide tutorId and tutorEmail.'
        }, { status: 400 });
      }
      
      body = JSON.parse(requestText);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      return NextResponse.json({ 
        error: 'Invalid JSON in request body. Please check the request format.',
        details: parseError.message
      }, { status: 400 });
    }

    const { tutorId, tutorEmail, startDate, endDate, forceSync = false } = body;

    // Validar información del tutor
    if (!tutorId || !tutorEmail) {
      return NextResponse.json({ 
        error: 'Información del tutor es requerida (tutorId, tutorEmail)',
        received: { tutorId: !!tutorId, tutorEmail: !!tutorEmail }
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

    // Obtener eventos desde Google Calendar con manejo mejorado de errores
    let googleEvents;
    try {
      googleEvents = await listEvents(accessToken.value, timeMin, timeMax, 100);
    } catch (calendarError) {
      console.error('Google Calendar API error:', calendarError);
      
      // Manejar errores específicos de Google Calendar
      if (calendarError.code === 401 || calendarError.message.includes('authentication')) {
        return NextResponse.json({ 
          success: false,
          error: 'Token de acceso expirado. Por favor, vuelve a conectar tu calendario.',
          needsReconnection: true
        }, { status: 401 });
      }
      
      return NextResponse.json({ 
        success: false,
        error: `Error al acceder a Google Calendar: ${calendarError.message}`,
        syncResults: {
          created: 0,
          updated: 0,
          errors: [{ error: calendarError.message }],
          totalProcessed: 0
        }
      }, { status: 500 });
    }
    
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