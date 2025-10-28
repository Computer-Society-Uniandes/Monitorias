/**
 * TutoringSessionController - SIMPLE
 * Maneja requests de sesiones de tutoría
 */

import { NextResponse } from 'next/server';
import { CreateSessionDTO, SessionDTO } from '../dto/tutoring-session.dto';
import { TutoringSessionService } from '../services/core/TutoringSessionService';

export class TutoringSessionController {
  /**
   * POST /api/tutoring-sessions
   * Crear nueva sesión
   */
  static async createSession(request) {
    try {
      const body = await request.json();
      const dto = CreateSessionDTO.validate(body);

      // Crear sesión usando el servicio existente
      const result = await TutoringSessionService.bookSpecificSlot(
        {
          id: dto.slotId,
          parentAvailabilityId: dto.parentAvailabilityId,
          slotIndex: dto.slotIndex,
          tutorEmail: dto.tutorEmail,
          startDateTime: new Date(dto.scheduledDateTime),
          endDateTime: new Date(dto.endDateTime),
          location: dto.location,
          subject: dto.subject,
          isBooked: false
        },
        dto.studentEmail,
        dto.studentName,
        dto.notes,
        dto.subject
      );

      return NextResponse.json({
        success: true,
        id: result.id
      }, { status: 201 });

    } catch (error) {
      console.error('[TutoringSessionController] Error:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 400 });
    }
  }

  /**
   * GET /api/tutoring-sessions/tutor/[email]
   * Sesiones del tutor
   */
  static async getTutorSessions(tutorEmail) {
    try {
      if (!tutorEmail) throw new Error('tutorEmail requerido');

      const sessions = await TutoringSessionService.getTutorSessions(tutorEmail);

      return NextResponse.json({
        success: true,
        sessions: SessionDTO.fromEntities(sessions),
        totalCount: sessions.length
      });

    } catch (error) {
      console.error('[TutoringSessionController] Error:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }
  }

  /**
   * GET /api/tutoring-sessions/student/[email]
   * Sesiones del estudiante
   */
  static async getStudentSessions(studentEmail) {
    try {
      if (!studentEmail) throw new Error('studentEmail requerido');

      const sessions = await TutoringSessionService.getStudentSessions(studentEmail);

      return NextResponse.json({
        success: true,
        sessions: SessionDTO.fromEntities(sessions),
        totalCount: sessions.length
      });

    } catch (error) {
      console.error('[TutoringSessionController] Error:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }
  }
}
