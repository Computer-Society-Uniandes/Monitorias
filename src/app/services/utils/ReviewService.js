/**
 * Review Service (Frontend)
 * Client-side service for managing tutor reviews
 */

import { API_URL } from '../../../config/api';
import { AuthService } from './AuthService';

/**
 * Get authorization headers
 * @returns {Object}
 */
const getAuthHeaders = () => {
  const token = AuthService.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const ReviewService = {
  /**
   * Create or update a review for a tutoring session
   * @param {Object} reviewData - Review data
   * @param {string} reviewData.sessionId - Session ID
   * @param {string} reviewData.tutorId - Tutor ID
   * @param {number} reviewData.rating - Rating (1-5)
   * @param {string} reviewData.comment - Review comment
   * @param {string} reviewData.reviewerName - Reviewer's name
   * @param {string} reviewData.course - Course name (optional)
   * @returns {Promise<Object>}
   */
  createReview: async (reviewData) => {
    try {
      const response = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          sessionId: reviewData.sessionId,
          tutorId: reviewData.tutorId,
          rating: reviewData.rating || reviewData.stars,
          comment: reviewData.comment || '',
          reviewerName: reviewData.reviewerName,
          reviewerEmail: reviewData.reviewerEmail,
          course: reviewData.course || '',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  },

  /**
   * Get a specific review by ID
   * @param {string} reviewId - Review ID
   * @returns {Promise<Object>}
   */
  getReviewById: async (reviewId) => {
    try {
      const response = await fetch(`${API_URL}/reviews/${reviewId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting review:', error);
      throw error;
    }
  },

  /**
   * Delete a review
   * @param {string} reviewId - Review ID
   * @returns {Promise<Object>}
   */
  deleteReview: async (reviewId) => {
    try {
      const response = await fetch(`${API_URL}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  },

  /**
   * Get all reviews for a tutor
   * @param {string} tutorId - Tutor ID
   * @param {Object} options - Options
   * @param {number} options.limit - Maximum number of reviews
   * @returns {Promise<Object>}
   */
  getTutorReviews: async (tutorId, options = {}) => {
    try {
      const params = new URLSearchParams();
      if (options.limit) params.set('limit', options.limit.toString());

      const url = `${API_URL}/reviews/tutor/${tutorId}${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting tutor reviews:', error);
      throw error;
    }
  },

  /**
   * Get rating summary for a tutor
   * @param {string} tutorId - Tutor ID
   * @returns {Promise<Object>}
   */
  getTutorRatingSummary: async (tutorId) => {
    try {
      const response = await fetch(`${API_URL}/reviews/tutor/${tutorId}?summary=true`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting tutor rating summary:', error);
      throw error;
    }
  },

  /**
   * Get all reviews for a session
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>}
   */
  getSessionReviews: async (sessionId) => {
    try {
      const response = await fetch(`${API_URL}/reviews/session/${sessionId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting session reviews:', error);
      throw error;
    }
  },

  /**
   * Check if a user has already reviewed a session
   * @param {string} sessionId - Session ID
   * @param {string} email - User's email
   * @returns {Promise<Object>}
   */
  checkExistingReview: async (sessionId, email) => {
    try {
      const response = await fetch(`${API_URL}/reviews/session/${sessionId}?check=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking existing review:', error);
      throw error;
    }
  },

  /**
   * Check if a session can be reviewed
   * A session can be reviewed if:
   * - Status is 'completed' or 'scheduled'
   * - User hasn't already reviewed it (unless updating)
   * @param {Object} session - Session object
   * @param {string} userEmail - Current user's email
   * @returns {Promise<Object>}
   */
  canReviewSession: async (session, userEmail) => {
    try {
      // Check if session status allows reviews
      const allowedStatuses = ['completed', 'scheduled'];
      if (!allowedStatuses.includes(session.status)) {
        return {
          canReview: false,
          reason: 'La sesión debe estar completada para dejar una reseña',
        };
      }

      // Check if user is the student
      if (session.studentEmail !== userEmail && session.studentId !== userEmail) {
        return {
          canReview: false,
          reason: 'Solo el estudiante puede dejar una reseña',
        };
      }

      // Check for existing review
      const existingCheck = await ReviewService.checkExistingReview(session.id, userEmail);

      return {
        canReview: true,
        hasExistingReview: existingCheck.hasReview,
        existingReview: existingCheck.review,
        reason: existingCheck.hasReview ? 'Puedes actualizar tu reseña' : 'Puedes dejar una reseña',
      };
    } catch (error) {
      console.error('Error checking if can review:', error);
      return {
        canReview: false,
        reason: 'Error verificando el estado de la reseña',
      };
    }
  },
};

export default ReviewService;
