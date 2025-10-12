import { NextResponse } from 'next/server';
import { db } from '../../../../firebaseServerConfig';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  updateDoc,
  deleteDoc,
  addDoc,
  query, 
  where,
  serverTimestamp
} from 'firebase/firestore';

// Import services that work on server side
import { CalicoCalendarService } from '../../../services/CalicoCalendarService';

// Helper function to reschedule a session
async function rescheduleSessionLogic(sessionId, newSlot, reason) {
  const COLLECTION_NAME = 'tutoring_sessions';
  const SLOT_BOOKINGS_COLLECTION = 'slot_bookings';

  // Obtener la sesión actual
  const sessionRef = doc(db, COLLECTION_NAME, sessionId);
  const sessionDoc = await getDoc(sessionRef);

  if (!sessionDoc.exists()) {
    throw new Error('Sesión no encontrada');
  }

  const session = {
    id: sessionDoc.id,
    ...sessionDoc.data(),
    scheduledDateTime: sessionDoc.data().scheduledDateTime?.toDate(),
    endDateTime: sessionDoc.data().endDateTime?.toDate(),
  };

  // Verificar que la sesión no esté cancelada o completada
  if (session.status === 'cancelled') {
    throw new Error('No puedes reprogramar una sesión cancelada');
  }
  if (session.status === 'completed') {
    throw new Error('No puedes reprogramar una sesión completada');
  }

  // Verificar que el nuevo slot esté disponible
  if (newSlot.isBooked) {
    throw new Error('Este horario ya no está disponible');
  }

  // Verificar si el slot ya está reservado
  const slotBookingQuery = query(
    collection(db, SLOT_BOOKINGS_COLLECTION),
    where('parentAvailabilityId', '==', newSlot.parentAvailabilityId),
    where('slotIndex', '==', newSlot.slotIndex)
  );
  const existingBookingSnapshot = await getDocs(slotBookingQuery);
  if (!existingBookingSnapshot.empty) {
    throw new Error('Este horario ya fue reservado por otro estudiante');
  }

  // Verificar que el tutor sea el mismo
  if (newSlot.tutorEmail !== session.tutorEmail) {
    throw new Error('Solo puedes reprogramar con el mismo tutor');
  }

  // Liberar el slot anterior si existe
  if (session.parentAvailabilityId && session.slotIndex !== undefined) {
    const oldSlotBookingQuery = query(
      collection(db, SLOT_BOOKINGS_COLLECTION),
      where('parentAvailabilityId', '==', session.parentAvailabilityId),
      where('slotIndex', '==', session.slotIndex),
      where('sessionId', '==', sessionId)
    );

    const oldSlotBookingSnapshot = await getDocs(oldSlotBookingQuery);
    
    for (const docSnap of oldSlotBookingSnapshot.docs) {
      await deleteDoc(docSnap.ref);
      console.log(`Old slot booking ${docSnap.id} deleted for rescheduling`);
    }
  }

  // Cancelar el evento anterior en el calendario de Calico
  if (session.calicoCalendarEventId) {
    try {
      await CalicoCalendarService.deleteEvent(session.calicoCalendarEventId);
      console.log('✅ Old calendar event cancelled');
    } catch (error) {
      console.warn('⚠️ Could not cancel old calendar event:', error);
    }
  }

  // Crear nuevo evento en el calendario de Calico
  let newCalendarEventId = null;
  let newCalendarHtmlLink = null;
  
  try {
    const calendarEventResult = await CalicoCalendarService.createTutoringSessionEvent({
      summary: `Tutoria ${session.subject || 'General'}`,
      description: `${session.notes}\n\n[REPROGRAMADA] ${reason}`,
      startDateTime: new Date(newSlot.startDateTime),
      endDateTime: new Date(newSlot.endDateTime),
      location: newSlot.location || session.location,
      tutorEmail: session.tutorEmail,
      tutorName: session.tutorName || session.tutorEmail,
      attendees: [
        {
          email: session.studentEmail,
          displayName: session.studentName || session.studentEmail,
          responseStatus: 'needsAction'
        },
        {
          email: session.tutorEmail,
          displayName: session.tutorName || session.tutorEmail,
          responseStatus: 'accepted'
        }
      ]
    });

    if (calendarEventResult?.success) {
      newCalendarEventId = calendarEventResult.calendarEvent?.id;
      newCalendarHtmlLink = calendarEventResult.calendarEvent?.htmlLink;
    }
  } catch (error) {
    console.warn('Warning: Could not create calendar event for rescheduled session:', error);
  }

  // Actualizar la sesión con los nuevos datos
  await updateDoc(sessionRef, {
    scheduledDateTime: new Date(newSlot.startDateTime),
    endDateTime: new Date(newSlot.endDateTime),
    location: newSlot.location || session.location,
    parentAvailabilityId: newSlot.parentAvailabilityId,
    slotIndex: newSlot.slotIndex,
    slotId: newSlot.id,
    googleEventId: newSlot.googleEventId || session.googleEventId,
    calicoCalendarEventId: newCalendarEventId || session.calicoCalendarEventId,
    calicoCalendarHtmlLink: newCalendarHtmlLink || session.calicoCalendarHtmlLink,
    rescheduledAt: serverTimestamp(),
    rescheduledReason: reason,
    updatedAt: serverTimestamp()
  });

  // Crear el nuevo slot booking
  const newSlotBookingData = {
    parentAvailabilityId: newSlot.parentAvailabilityId,
    slotIndex: newSlot.slotIndex,
    slotId: newSlot.id,
    tutorEmail: session.tutorEmail,
    studentEmail: session.studentEmail,
    sessionId: sessionId,
    bookedAt: serverTimestamp(),
    slotStartTime: new Date(newSlot.startDateTime),
    slotEndTime: new Date(newSlot.endDateTime),
    subject: session.subject,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await addDoc(collection(db, SLOT_BOOKINGS_COLLECTION), newSlotBookingData);

  // Crear notificación para el tutor
  try {
    const notificationData = {
      tutorEmail: session.tutorEmail,
      studentEmail: session.studentEmail,
      studentName: session.studentName,
      sessionId: sessionId,
      subject: session.subject,
      oldDateTime: session.scheduledDateTime,
      newDateTime: new Date(newSlot.startDateTime),
      reason: reason,
      type: 'session_rescheduled',
      title: 'Sesión Reprogramada',
      message: `${session.studentName} ha reprogramado la tutoría de ${session.subject}. Motivo: ${reason}`,
      isRead: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await addDoc(collection(db, 'notifications'), notificationData);
    console.log('✅ Notification created for tutor');
  } catch (error) {
    console.warn('⚠️ Could not create notification:', error);
  }

  console.log('✅ Session rescheduled successfully:', sessionId);
  return { 
    success: true, 
    message: 'Sesión reprogramada exitosamente',
    id: sessionId,
    newDateTime: new Date(newSlot.startDateTime)
  };
}

export async function POST(request) {
  try {
    console.log('🔄 Starting tutoring session reschedule API...');
    
    const body = await request.json();
    console.log('📋 Received reschedule request:', body);
    
    const { 
      sessionId,
      newSlot,
      reason
    } = body;

    // Validaciones básicas
    if (!sessionId) {
      return NextResponse.json({
        error: 'sessionId is required'
      }, { status: 400 });
    }

    if (!newSlot) {
      return NextResponse.json({
        error: 'newSlot is required'
      }, { status: 400 });
    }

    // Validar que el newSlot tenga los campos necesarios
    if (!newSlot.id || !newSlot.startDateTime || !newSlot.endDateTime || !newSlot.tutorEmail) {
      return NextResponse.json({
        error: 'newSlot must contain id, startDateTime, endDateTime, and tutorEmail'
      }, { status: 400 });
    }

    // Validar formato de fechas
    const start = new Date(newSlot.startDateTime);
    const end = new Date(newSlot.endDateTime);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({
        error: 'Invalid date format for newSlot startDateTime or endDateTime'
      }, { status: 400 });
    }

    if (end <= start) {
      return NextResponse.json({
        error: 'endDateTime must be after startDateTime'
      }, { status: 400 });
    }

    // Validar que la nueva fecha sea en el futuro
    const now = new Date();
    if (start <= now) {
      return NextResponse.json({
        error: 'Cannot reschedule to a past date'
      }, { status: 400 });
    }

    console.log('🚀 Rescheduling session:', {
      sessionId,
      newStartTime: start,
      newEndTime: end,
      reason: reason || 'No reason provided'
    });

    // Reprogramar la sesión usando lógica directa de Firebase
    const result = await rescheduleSessionLogic(sessionId, newSlot, reason || 'Sesión reprogramada');

    console.log('✅ Session rescheduled successfully:', result);

    return NextResponse.json({
      success: true,
      message: result.message || 'Sesión reprogramada exitosamente',
      sessionId: result.id,
      newDateTime: result.newDateTime
    });

  } catch (error) {
    console.error('❌ Error in tutoring session reschedule API:', error);

    // Manejar diferentes tipos de errores
    if (error.message.includes('no encontrada')) {
      return NextResponse.json({
        error: 'Sesión no encontrada',
        message: error.message
      }, { status: 404 });
    }

    if (error.message.includes('cancelada') || error.message.includes('completada')) {
      return NextResponse.json({
        error: 'No se puede reprogramar',
        message: error.message
      }, { status: 400 });
    }

    if (error.message.includes('disponible') || error.message.includes('reservado')) {
      return NextResponse.json({
        error: 'Horario no disponible',
        message: error.message
      }, { status: 409 });
    }

    if (error.message.includes('tutor')) {
      return NextResponse.json({
        error: 'Tutor inválido',
        message: error.message
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Error interno del servidor',
      message: error.message
    }, { status: 500 });
  }
}
