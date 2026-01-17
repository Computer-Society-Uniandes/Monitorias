/**
 * Session Reviews API Route
 * GET /api/reviews/session/[sessionId] - Get all reviews for a session
 * GET /api/reviews/session/[sessionId]?check=email@example.com - Check if user has reviewed
 */

import { NextResponse } from 'next/server';
import * as reviewService from '@/lib/services/review.service';

/**
 * GET /api/reviews/session/[sessionId]
 * Get all reviews for a specific session
 */
export async function GET(request, { params }) {
  try {
    const { sessionId } = await params;
    const { searchParams } = new URL(request.url);
    const checkEmail = searchParams.get('check');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // If check parameter is provided, check if user has already reviewed
    if (checkEmail) {
      const result = await reviewService.checkExistingReview(sessionId, checkEmail);
      return NextResponse.json(result);
    }

    // Return all reviews for this session
    const result = await reviewService.getReviewsForSession(sessionId);

    return NextResponse.json(result);
  } catch (error) {
    console.error(`Error in GET /api/reviews/session/${params?.sessionId}:`, error);

    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
