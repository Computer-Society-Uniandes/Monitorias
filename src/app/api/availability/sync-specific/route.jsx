import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
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

    // Validar y parsear el body
    let body;
    try {
      const requestText = await request.text();
      
      if (!requestText || requestText.trim() === '') {
        return NextResponse.json({ 
          error: 'Request body is empty. Please provide tutorId, tutorEmail, and events.'
        }, { status: 400 });
      }
      
      body = JSON.parse(requestText);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      return NextResponse.json({ 
        error: 'Invalid JSON in request body.',
        details: parseError.message
      }, { status: 400 });
    }

    const { tutorId, tutorEmail, events } = body;

    // Validar parámetros
    if (!tutorId || !tutorEmail) {
      return NextResponse.json({ 
        error: 'tutorId and tutorEmail are required',
        received: { tutorId: !!tutorId, tutorEmail: !!tutorEmail, eventsCount: events?.length || 0 }
      }, { status: 400 });
    }

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ 
        error: 'events array is required and must contain at least one event',
        received: { eventsCount: events?.length || 0 }
      }, { status: 400 });
    }

    console.log('Syncing specific events to Firebase...');
    console.log('Tutor:', tutorEmail);
    console.log('Events to sync:', events.length);

    // Sincronizar eventos específicos con Firebase
    const syncResults = await FirebaseAvailabilityService.syncGoogleEventsToFirebase(
      events,
      tutorId,
      tutorEmail
    );

    console.log('Specific sync completed:', syncResults);

    return NextResponse.json({
      success: true,
      message: `Sincronización específica completada: ${syncResults.created} creados, ${syncResults.updated} actualizados`,
      syncResults: {
        ...syncResults,
        totalProcessed: events.length
      }
    });

  } catch (error) {
    console.error('Error syncing specific events:', error);
    
    let errorMessage = 'Error al sincronizar eventos específicos';
    
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