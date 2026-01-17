/**
 * Tutor Reviews API Route
 * GET /api/reviews/tutor/[tutorId] - Get all reviews for a tutor
 * GET /api/reviews/tutor/[tutorId]?summary=true - Get rating summary
 */

import { NextResponse } from 'next/server';
import * as reviewService from '@/lib/services/review.service';

/**
 * GET /api/reviews/tutor/[tutorId]
 * Get all reviews for a specific tutor
 */
export async function GET(request, { params }) {
  try {
    const { tutorId } = await params;
    const { searchParams } = new URL(request.url);
    const summary = searchParams.get('summary') === 'true';
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    if (!tutorId) {
      return NextResponse.json(
        { success: false, error: 'Tutor ID is required' },
        { status: 400 }
      );
    }

    if (summary) {
      // Return only the rating summary
      const result = await reviewService.getTutorRatingSummary(tutorId);
      return NextResponse.json(result);
    }

    // Return full reviews list with stats
    const result = await reviewService.getReviewsForTutor(tutorId, limit);

    return NextResponse.json(result);
  } catch (error) {
    console.error(`Error in GET /api/reviews/tutor/${params?.tutorId}:`, error);

    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
