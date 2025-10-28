/**
 * AvailabilityController - SIMPLE
 * Maneja requests de disponibilidades
 */

import { NextResponse } from 'next/server';
import { AvailabilityDTO } from '../dto/availability.dto';
import { FirebaseAvailabilityService } from '../services/utils/FirebaseAvailabilityService';

export class AvailabilityController {
  /**
   * GET /api/availability
   * Obtiene disponibilidades con filtros
   */
  static async getAvailabilities(request) {
    try {
      const { searchParams } = new URL(request.url);
      
      const tutorId = searchParams.get('tutorId') || searchParams.get('tutorEmail');
      const subject = searchParams.get('subject');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      const limit = parseInt(searchParams.get('limit')) || 50;

      let availabilities = [];

      // Obtener según filtros
      if (tutorId && startDate && endDate) {
        const all = await FirebaseAvailabilityService.getAvailabilitiesByTutor(tutorId, 200);
        const start = new Date(startDate);
        const end = new Date(endDate);
        availabilities = all.filter(a => a.startDateTime >= start && a.startDateTime <= end);
      } else if (tutorId) {
        availabilities = await FirebaseAvailabilityService.getAvailabilitiesByTutor(tutorId, limit);
      } else if (subject) {
        availabilities = await FirebaseAvailabilityService.getAvailabilitiesBySubject(subject, limit);
      } else if (startDate && endDate) {
        availabilities = await FirebaseAvailabilityService.getAvailabilitiesInDateRange(
          new Date(startDate),
          new Date(endDate),
          limit
        );
      } else {
        // Default: próxima semana
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        availabilities = await FirebaseAvailabilityService.getAvailabilitiesInDateRange(now, nextWeek, limit);
      }

      return NextResponse.json({
        success: true,
        availabilities: AvailabilityDTO.fromEntities(availabilities),
        totalCount: availabilities.length,
        source: 'firebase'
      });

    } catch (error) {
      console.error('[AvailabilityController] Error:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }
  }
}
