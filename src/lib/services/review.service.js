/**
 * Review Service
 * Business logic for tutor review management
 * Handles creation, updates, and tutor rating calculations
 */

import * as reviewRepository from '../repositories/review.repository';
import * as userRepository from '../repositories/user.repository';
import * as tutoringSessionRepository from '../repositories/tutoring-session.repository';

/**
 * Create or update a review for a tutoring session
 * Also updates the tutor's average rating and total reviews count
 * @param {Object} reviewData - Review data
 * @returns {Promise<Object>}
 */
export async function createOrUpdateReview(reviewData) {
  try {
    // Validate required fields
    if (!reviewData.sessionId) {
      throw new Error('sessionId is required');
    }
    if (!reviewData.tutorId) {
      throw new Error('tutorId is required');
    }
    if (!reviewData.studentId && !reviewData.reviewerEmail) {
      throw new Error('studentId or reviewerEmail is required');
    }
    if (!reviewData.rating && !reviewData.stars) {
      throw new Error('rating is required');
    }

    const rating = reviewData.rating || reviewData.stars;
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Verify the session exists
    const session = await tutoringSessionRepository.findById(reviewData.sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Check if session is completed or at least scheduled
    if (!['completed', 'scheduled'].includes(session.status)) {
      throw new Error('Cannot review a session that is not completed or scheduled');
    }

    // Check if reviewer is the student of this session
    const reviewerEmail = reviewData.reviewerEmail || '';
    const studentId = reviewData.studentId || session.studentId;

    if (session.studentEmail !== reviewerEmail && session.studentId !== studentId) {
      throw new Error('Only the student of this session can leave a review');
    }

    // Check if a review already exists for this session and reviewer
    const existingReview = await reviewRepository.findBySessionAndReviewer(
      reviewData.sessionId,
      reviewerEmail
    );

    const normalizedReview = {
      sessionId: reviewData.sessionId,
      tutorId: reviewData.tutorId,
      studentId: studentId,
      reviewerEmail: reviewerEmail,
      reviewerName: reviewData.reviewerName || reviewerEmail,
      rating: rating,
      stars: rating, // Mantener compatibilidad
      comment: reviewData.comment || '',
      course: reviewData.course || session.course || '',
    };

    let reviewId;
    let isUpdate = false;

    if (existingReview) {
      // Update existing review
      reviewId = existingReview.id;
      isUpdate = true;
      await reviewRepository.save(reviewId, normalizedReview);
      console.log(`Review updated: ${reviewId}`);
    } else {
      // Create new review
      reviewId = await reviewRepository.save(undefined, normalizedReview);
      console.log(`Review created: ${reviewId}`);
    }

    // Update tutor's average rating and total reviews
    await updateTutorRatingStats(reviewData.tutorId);

    // Also update the session document for backwards compatibility
    await updateSessionWithReview(reviewData.sessionId, normalizedReview);

    const savedReview = await reviewRepository.findById(reviewId);

    return {
      success: true,
      review: savedReview,
      isUpdate,
      message: isUpdate ? 'Review updated successfully' : 'Review created successfully',
    };
  } catch (error) {
    console.error('Error creating/updating review:', error);
    throw error;
  }
}

/**
 * Update tutor's rating statistics in their user profile
 * @param {string} tutorId - Tutor ID
 * @returns {Promise<Object>}
 */
export async function updateTutorRatingStats(tutorId) {
  try {
    const stats = await reviewRepository.calculateTutorStats(tutorId);

    // Update the tutor's user document with the new stats
    await userRepository.save(tutorId, {
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
      ratingUpdatedAt: new Date(),
    });

    console.log(`Tutor ${tutorId} stats updated: avgRating=${stats.averageRating}, totalReviews=${stats.totalReviews}`);

    return stats;
  } catch (error) {
    console.error('Error updating tutor rating stats:', error);
    throw error;
  }
}

/**
 * Update session document with review data for backwards compatibility
 * @param {string} sessionId - Session ID
 * @param {Object} review - Review data
 * @returns {Promise<void>}
 */
async function updateSessionWithReview(sessionId, review) {
  try {
    // Use the existing addOrUpdateReview from tutoring-session repository
    await tutoringSessionRepository.addOrUpdateReview(sessionId, {
      reviewerEmail: review.reviewerEmail,
      reviewerName: review.reviewerName,
      stars: review.rating,
      comment: review.comment,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (error) {
    console.warn('Error updating session with review (non-critical):', error);
  }
}

/**
 * Get a review by ID
 * @param {string} reviewId - Review ID
 * @returns {Promise<Object>}
 */
export async function getReviewById(reviewId) {
  try {
    const review = await reviewRepository.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }
    return {
      success: true,
      review,
    };
  } catch (error) {
    console.error('Error getting review:', error);
    throw error;
  }
}

/**
 * Get all reviews for a tutor
 * @param {string} tutorId - Tutor ID
 * @param {number} limit - Maximum results
 * @returns {Promise<Object>}
 */
export async function getReviewsForTutor(tutorId, limit = 100) {
  try {
    const reviews = await reviewRepository.findByTutor(tutorId, limit);
    const stats = await reviewRepository.calculateTutorStats(tutorId);

    return {
      success: true,
      reviews,
      count: reviews.length,
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
    };
  } catch (error) {
    console.error('Error getting reviews for tutor:', error);
    throw error;
  }
}

/**
 * Get all reviews for a session
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>}
 */
export async function getReviewsForSession(sessionId) {
  try {
    const reviews = await reviewRepository.findBySession(sessionId);

    // Calculate average for this session
    let averageRating = 0;
    if (reviews.length > 0) {
      const totalStars = reviews.reduce((sum, r) => sum + (r.rating || r.stars || 0), 0);
      averageRating = parseFloat((totalStars / reviews.length).toFixed(2));
    }

    return {
      success: true,
      reviews,
      count: reviews.length,
      averageRating,
    };
  } catch (error) {
    console.error('Error getting reviews for session:', error);
    throw error;
  }
}

/**
 * Get all reviews written by a student
 * @param {string} studentId - Student ID
 * @param {number} limit - Maximum results
 * @returns {Promise<Object>}
 */
export async function getReviewsByStudent(studentId, limit = 100) {
  try {
    const reviews = await reviewRepository.findByStudent(studentId, limit);

    return {
      success: true,
      reviews,
      count: reviews.length,
    };
  } catch (error) {
    console.error('Error getting reviews by student:', error);
    throw error;
  }
}

/**
 * Check if a session already has a review from a specific user
 * @param {string} sessionId - Session ID
 * @param {string} reviewerEmail - Reviewer's email
 * @returns {Promise<Object>}
 */
export async function checkExistingReview(sessionId, reviewerEmail) {
  try {
    const review = await reviewRepository.findBySessionAndReviewer(sessionId, reviewerEmail);

    return {
      success: true,
      hasReview: !!review,
      review: review || null,
    };
  } catch (error) {
    console.error('Error checking existing review:', error);
    throw error;
  }
}

/**
 * Delete a review (admin only or by the reviewer)
 * @param {string} reviewId - Review ID
 * @param {string} requesterId - ID of the user requesting deletion
 * @returns {Promise<Object>}
 */
export async function deleteReview(reviewId, requesterId) {
  try {
    const review = await reviewRepository.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    // Check if requester is the reviewer (by studentId or email matching)
    if (review.studentId !== requesterId && review.reviewerEmail !== requesterId) {
      throw new Error('Not authorized to delete this review');
    }

    const tutorId = review.tutorId;

    await reviewRepository.deleteReview(reviewId);

    // Recalculate tutor stats after deletion
    await updateTutorRatingStats(tutorId);

    return {
      success: true,
      message: 'Review deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
}

/**
 * Get tutor rating summary
 * @param {string} tutorId - Tutor ID
 * @returns {Promise<Object>}
 */
export async function getTutorRatingSummary(tutorId) {
  try {
    const reviews = await reviewRepository.findByTutor(tutorId, 1000);

    if (reviews.length === 0) {
      return {
        success: true,
        tutorId,
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    // Calculate rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalStars = 0;

    reviews.forEach((review) => {
      const rating = review.rating || review.stars || 0;
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating]++;
        totalStars += rating;
      }
    });

    const averageRating = parseFloat((totalStars / reviews.length).toFixed(2));

    return {
      success: true,
      tutorId,
      averageRating,
      totalReviews: reviews.length,
      ratingDistribution,
    };
  } catch (error) {
    console.error('Error getting tutor rating summary:', error);
    throw error;
  }
}

export default {
  createOrUpdateReview,
  updateTutorRatingStats,
  getReviewById,
  getReviewsForTutor,
  getReviewsForSession,
  getReviewsByStudent,
  checkExistingReview,
  deleteReview,
  getTutorRatingSummary,
};
