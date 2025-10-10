import { NextResponse } from 'next/server';
import { CalicoCalendarService } from '../../../services/CalicoCalendarService';

export async function POST(request) {
  try {
    console.log('🔄 Starting tutoring session event creation API...');
    
    // Validar que el usuario esté autenticado (si es necesario)
    // Nota: Puedes ajustar esta lógica según tu sistema de autenticación
    
    const body = await request.json();
    console.log('📋 Received request body:', body);
    const { 
      summary,
      description,
      startDateTime,
      endDateTime,
      studentEmail,
      studentName,
      tutorEmail,
      tutorName,
      location,
      subject,
      notes
    } = body;

    // Validaciones básicas
    if (!summary || !startDateTime || !endDateTime) {
      return NextResponse.json({
        error: 'summary, startDateTime, and endDateTime are required'
      }, { status: 400 });
    }

    if (!studentEmail || !tutorEmail) {
      return NextResponse.json({
        error: 'Both studentEmail and tutorEmail are required'
      }, { status: 400 });
    }

    // Validar formato de fechas
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({
        error: 'Invalid date format for startDateTime or endDateTime'
      }, { status: 400 });
    }

    if (end <= start) {
      return NextResponse.json({
        error: 'endDateTime must be after startDateTime'
      }, { status: 400 });
    }

    // Preparar datos del evento
    const sessionData = {
      summary: summary,
      description: description || `Sesión de tutoría de ${subject || 'materia'}\n\nNotas: ${notes || 'Sin notas adicionales'}\n\nCreado desde Calico - Sistema de Monitorías`,
      startDateTime: start,
      endDateTime: end,
      location: location || 'Por definir',
      tutorEmail: tutorEmail,
      tutorName: tutorName || tutorEmail,
      attendees: [
        {
          email: studentEmail,
          displayName: studentName || studentEmail,
          responseStatus: 'needsAction'
        },
        {
          email: tutorEmail,
          displayName: tutorName || tutorEmail,
          responseStatus: 'accepted'
        }
      ]
    };

    console.log('🚀 Creating tutoring session event with data:', {
      summary: sessionData.summary,
      start: sessionData.startDateTime,
      end: sessionData.endDateTime,
      attendees: Array.isArray(sessionData.attendees) ? sessionData.attendees.map(a => a.email) : 'Invalid attendees array',
      attendeesType: typeof sessionData.attendees,
      attendeesIsArray: Array.isArray(sessionData.attendees)
    });

    // Verificar variables de entorno críticas
    console.log('🔧 Environment check:', {
      hasServiceAccountKey: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
      hasCalendarId: !!process.env.CALICO_CALENDAR_ID,
      calendarIdValue: process.env.CALICO_CALENDAR_ID ? 'SET' : 'NOT SET'
    });

    // Crear el evento en el calendario central de Calico
    console.log('📞 Calling CalicoCalendarService.createTutoringSessionEvent...');
    const result = await CalicoCalendarService.createTutoringSessionEvent(sessionData);
    console.log('📞 CalicoCalendarService responded with:', result);

    if (!result.success) {
      throw new Error('Failed to create event in Calico calendar');
    }

    console.log('✅ Tutoring session event created successfully:', result.eventId);

    return NextResponse.json({
      success: true,
      message: 'Evento de sesión de tutoría creado exitosamente en el calendario central de Calico',
      eventId: result.eventId,
      htmlLink: result.htmlLink,
      hangoutLink: result.hangoutLink,
      calendarEvent: {
        id: result.eventId,
        summary: sessionData.summary,
        start: sessionData.startDateTime,
        end: sessionData.endDateTime,
        attendees: sessionData.attendees,
        location: sessionData.location
      }
    });

  } catch (error) {
    console.error('❌ Error in tutoring session event creation API:', error);

    // Manejar diferentes tipos de errores
    if (error.message.includes('GOOGLE_SERVICE_ACCOUNT_KEY')) {
      return NextResponse.json({
        error: 'Configuración de Service Account incorrecta',
        details: 'Verifica la variable de entorno GOOGLE_SERVICE_ACCOUNT_KEY'
      }, { status: 500 });
    }

    if (error.message.includes('CALICO_CALENDAR_ID')) {
      return NextResponse.json({
        error: 'Configuración de calendario incorrecta',
        details: 'Verifica la variable de entorno CALICO_CALENDAR_ID'
      }, { status: 500 });
    }

    if (error.message.includes('permisos')) {
      return NextResponse.json({
        error: 'Error de permisos',
        details: 'La Service Account no tiene permisos para crear eventos en el calendario central'
      }, { status: 403 });
    }

    return NextResponse.json({
      error: 'Error interno del servidor',
      message: error.message
    }, { status: 500 });
  }
}

// Endpoint para actualizar un evento existente
export async function PATCH(request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({
        error: 'eventId parameter is required'
      }, { status: 400 });
    }

    const updateData = await request.json();

    console.log('🔄 Updating tutoring session event:', eventId);

    const result = await CalicoCalendarService.updateTutoringSessionEvent(eventId, updateData);

    return NextResponse.json({
      success: true,
      message: 'Evento actualizado exitosamente',
      eventId: result.eventId
    });

  } catch (error) {
    console.error('❌ Error updating tutoring session event:', error);
    return NextResponse.json({
      error: 'Error actualizando evento',
      message: error.message
    }, { status: 500 });
  }
}

// Endpoint para cancelar un evento
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const action = searchParams.get('action') || 'cancel'; // 'cancel' o 'delete'

    if (!eventId) {
      return NextResponse.json({
        error: 'eventId parameter is required'
      }, { status: 400 });
    }

    console.log(`🗑️ ${action === 'delete' ? 'Deleting' : 'Cancelling'} tutoring session event:`, eventId);

    let result;
    if (action === 'delete') {
      result = await CalicoCalendarService.deleteTutoringSessionEvent(eventId);
    } else {
      result = await CalicoCalendarService.cancelTutoringSessionEvent(eventId);
    }

    return NextResponse.json({
      success: true,
      message: action === 'delete' ? 'Evento eliminado exitosamente' : 'Evento cancelado exitosamente',
      eventId: result.eventId,
      action: action
    });

  } catch (error) {
    console.error('❌ Error in delete/cancel operation:', error);
    return NextResponse.json({
      error: 'Error en la operación',
      message: error.message
    }, { status: 500 });
  }
}
