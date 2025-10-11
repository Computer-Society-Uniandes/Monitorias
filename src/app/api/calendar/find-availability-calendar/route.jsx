import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findAvailabilityCalendar } from '../../../services/GoogleCalendarService';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('calendar_access_token');

    if (!accessToken) {
      return NextResponse.json({ 
        error: 'No access token found. Please connect your Google Calendar first.',
        connected: false 
      }, { status: 401 });
    }

    console.log('Searching for Disponibilidad calendar...');

    const availabilityCalendar = await findAvailabilityCalendar(accessToken.value);

    if (!availabilityCalendar) {
      return NextResponse.json({
        success: false,
        error: 'No se encontró un calendario llamado "Disponibilidad". Por favor, crea un calendario con ese nombre en tu cuenta de Google.',
        found: false,
        message: 'Para usar esta funcionalidad, necesitas crear un calendario llamado "Disponibilidad" en tu cuenta de Google Calendar.'
      }, { status: 404 });
    }

    console.log('Found Disponibilidad calendar:', availabilityCalendar.summary);

    return NextResponse.json({
      success: true,
      found: true,
      calendar: availabilityCalendar,
      message: `Calendario "${availabilityCalendar.summary}" encontrado exitosamente.`
    });

  } catch (error) {
    console.error('Error finding availability calendar:', error);
    
    // Manejar errores específicos de Google Calendar
    if (error.code === 401 || error.message.includes('authentication')) {
      return NextResponse.json({ 
        success: false,
        error: 'Token de acceso expirado. Por favor, vuelve a conectar tu calendario.',
        needsReconnection: true
      }, { status: 401 });
    }
    
    return NextResponse.json({ 
      success: false,
      error: `Error al buscar calendario de disponibilidad: ${error.message}`,
      found: false
    }, { status: 500 });
  }
}
