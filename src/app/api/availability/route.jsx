import { NextResponse } from 'next/server';
import { FirebaseAvailabilityService } from '../../services/FirebaseAvailabilityService';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tutorId = searchParams.get('tutorId');
    const tutorEmail = searchParams.get('tutorEmail');
    const subject = searchParams.get('subject');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit')) || 50;

    let availabilities = [];

    // Manejar tutorId o tutorEmail como sinónimos
    const tutorIdentifier = tutorId || tutorEmail;

    if (tutorIdentifier && startDate && endDate) {
      // Obtener disponibilidades de un tutor específico en un rango de fechas
      const start = new Date(startDate);
      const end = new Date(endDate);
      const allTutorAvailabilities = await FirebaseAvailabilityService.getAvailabilitiesByTutor(tutorIdentifier, 200);
      
      // Filtrar por rango de fechas
      availabilities = allTutorAvailabilities.filter(availability => {
        const availStart = availability.startDateTime;
        return availStart >= start && availStart <= end;
      });
    } else if (tutorIdentifier) {
      // Obtener disponibilidades de un tutor específico
      availabilities = await FirebaseAvailabilityService.getAvailabilitiesByTutor(tutorIdentifier, limit);
    } else if (subject) {
      // Obtener disponibilidades por materia
      availabilities = await FirebaseAvailabilityService.getAvailabilitiesBySubject(subject, limit);
    } else if (startDate && endDate) {
      // Obtener disponibilidades en un rango de fechas
      const start = new Date(startDate);
      const end = new Date(endDate);
      availabilities = await FirebaseAvailabilityService.getAvailabilitiesInDateRange(start, end, limit);
    } else {
      // Obtener disponibilidades de la próxima semana por defecto
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      availabilities = await FirebaseAvailabilityService.getAvailabilitiesInDateRange(now, nextWeek, limit);
    }

    // Transformar datos para el frontend
    const formattedAvailabilities = availabilities.map(availability => ({
      id: availability.id,
      googleEventId: availability.googleEventId,
      tutorId: availability.tutorId,
      tutorEmail: availability.tutorEmail,
      title: availability.title,
      description: availability.description,
      startDateTime: availability.startDateTime,
      endDateTime: availability.endDateTime,
      location: availability.location,
      recurring: availability.recurring,
      subject: availability.subject,
      color: availability.color,
      // Formatear para compatibilidad con el componente existente
      day: availability.startDateTime ? 
        ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][availability.startDateTime.getDay()] : 
        '',
      startTime: availability.startDateTime ? 
        availability.startDateTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 
        '',
      endTime: availability.endDateTime ? 
        availability.endDateTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 
        '',
      date: availability.startDateTime ? 
        availability.startDateTime.toISOString().split('T')[0] : 
        '',
      created_at: availability.created_at,
      updatedAt: availability.updatedAt
    }));

    return NextResponse.json({
      success: true,
      availabilities: formattedAvailabilities,
      totalCount: formattedAvailabilities.length,
      source: 'firebase'
    });

  } catch (error) {
    console.error('Error fetching availabilities from Firebase:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al obtener disponibilidades',
      availabilities: [],
      totalCount: 0
    }, { status: 500 });
  }
} 