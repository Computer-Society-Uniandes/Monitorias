/**
 * Single Review API Route
 * GET /api/reviews/[reviewId] - Get a specific review
 * DELETE /api/reviews/[reviewId] - Delete a review
 */

import { NextResponse } from 'next/server';
import * as reviewService from '@/lib/services/review.service';
import { verifyAuthToken } from '@/lib/middleware/auth.middleware';

/**
 * GET /api/reviews/[reviewId]
 * Get a specific review by ID
 */
export async function GET(request, { params }) {
  try {
    const { reviewId } = await params;

    if (!reviewId) {
      return NextResponse.json(
        { success: false, error: 'Review ID is required' },
        { status: 400 }
      );
    }

    const result = await reviewService.getReviewById(reviewId);

    return NextResponse.json(result);
  } catch (error) {
    console.error(`Error in GET /api/reviews/${params?.reviewId}:`, error);

    if (error.message.includes('not found')) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reviews/[reviewId]
 * Delete a review (only by the reviewer)
 */
export async function DELETE(request, { params }) {
  try {
    // Verify authentication
    const authResult = await verifyAuthToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { reviewId } = await params;

    if (!reviewId) {
      return NextResponse.json(
        { success: false, error: 'Review ID is required' },
        { status: 400 }
      );
    }

    // Pass both uid and email for authorization check
    const requesterId = authResult.uid || authResult.email;
    const result = await reviewService.deleteReview(reviewId, requesterId);

    return NextResponse.json(result);
  } catch (error) {
    console.error(`Error in DELETE /api/reviews/${params?.reviewId}:`, error);

    if (error.message.includes('not found')) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }

    if (error.message.includes('Not authorized')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
