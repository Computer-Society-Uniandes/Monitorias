/**
 * Reviews API Route
 * POST /api/reviews - Create or update a review
 */

import { NextResponse } from 'next/server';
import * as reviewService from '@/lib/services/review.service';
import { verifyAuthToken } from '@/lib/middleware/auth.middleware';

/**
 * POST /api/reviews
 * Create or update a review for a tutoring session
 */
export async function POST(request) {
  try {
    // Verify authentication
    const authResult = await verifyAuthToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.sessionId) {
      return NextResponse.json(
        { success: false, error: 'sessionId is required' },
        { status: 400 }
      );
    }

    if (!body.tutorId) {
      return NextResponse.json(
        { success: false, error: 'tutorId is required' },
        { status: 400 }
      );
    }

    const rating = body.rating || body.stars;
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Build review data
    const reviewData = {
      sessionId: body.sessionId,
      tutorId: body.tutorId,
      studentId: authResult.uid,
      reviewerEmail: authResult.email || body.reviewerEmail,
      reviewerName: body.reviewerName || authResult.name || authResult.email,
      rating: rating,
      comment: body.comment || '',
      course: body.course || '',
    };

    const result = await reviewService.createOrUpdateReview(reviewData);

    return NextResponse.json(result, { status: result.isUpdate ? 200 : 201 });
  } catch (error) {
    console.error('Error in POST /api/reviews:', error);

    // Handle specific errors
    if (error.message.includes('Only the student')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }

    if (error.message.includes('not found')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
