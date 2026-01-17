/**
 * Review Repository
 * Handles all database operations for tutor reviews
 * Reviews are stored in a separate 'reviews' collection for better querying and scalability
 */

import { getFirestore, getTimestamp, parseDate } from '../firebase/admin';

const COLLECTION = 'reviews';

/**
 * Find review by ID
 * @param {string} reviewId - Review ID
 * @returns {Promise<Object|null>}
 */
export async function findById(reviewId) {
  try {
    const db = getFirestore();
    const docRef = db.collection(COLLECTION).doc(reviewId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: parseDate(data.createdAt),
      updatedAt: parseDate(data.updatedAt),
    };
  } catch (error) {
    console.error('Error finding review by ID:', error);
    throw error;
  }
}

/**
 * Find review by session ID and reviewer email
 * Used to check if a user has already reviewed a session
 * @param {string} sessionId - Session ID
 * @param {string} reviewerEmail - Reviewer's email
 * @returns {Promise<Object|null>}
 */
export async function findBySessionAndReviewer(sessionId, reviewerEmail) {
  try {
    const db = getFirestore();
    const snapshot = await db
      .collection(COLLECTION)
      .where('sessionId', '==', sessionId)
      .where('reviewerEmail', '==', reviewerEmail)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: parseDate(data.createdAt),
      updatedAt: parseDate(data.updatedAt),
    };
  } catch (error) {
    console.error('Error finding review by session and reviewer:', error);
    throw error;
  }
}

/**
 * Find all reviews for a tutor
 * @param {string} tutorId - Tutor ID
 * @param {number} limit - Maximum results
 * @returns {Promise<Array>}
 */
export async function findByTutor(tutorId, limit = 100) {
  try {
    const db = getFirestore();
    const snapshot = await db
      .collection(COLLECTION)
      .where('tutorId', '==', tutorId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const reviews = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      reviews.push({
        id: doc.id,
        ...data,
        createdAt: parseDate(data.createdAt),
        updatedAt: parseDate(data.updatedAt),
      });
    });

    return reviews;
  } catch (error) {
    // Si falla por falta de índice, hacer query sin ordenar
    if (error.code === 9) {
      console.warn('Index not found, fetching without order');
      const db = getFirestore();
      const snapshot = await db
        .collection(COLLECTION)
        .where('tutorId', '==', tutorId)
        .limit(limit)
        .get();

      const reviews = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        reviews.push({
          id: doc.id,
          ...data,
          createdAt: parseDate(data.createdAt),
          updatedAt: parseDate(data.updatedAt),
        });
      });

      // Ordenar en memoria
      reviews.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateB - dateA;
      });

      return reviews.slice(0, limit);
    }
    console.error('Error finding reviews by tutor:', error);
    throw error;
  }
}

/**
 * Find all reviews for a session
 * @param {string} sessionId - Session ID
 * @returns {Promise<Array>}
 */
export async function findBySession(sessionId) {
  try {
    const db = getFirestore();
    const snapshot = await db
      .collection(COLLECTION)
      .where('sessionId', '==', sessionId)
      .get();

    const reviews = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      reviews.push({
        id: doc.id,
        ...data,
        createdAt: parseDate(data.createdAt),
        updatedAt: parseDate(data.updatedAt),
      });
    });

    return reviews;
  } catch (error) {
    console.error('Error finding reviews by session:', error);
    throw error;
  }
}

/**
 * Find all reviews written by a student
 * @param {string} studentId - Student ID (reviewer)
 * @param {number} limit - Maximum results
 * @returns {Promise<Array>}
 */
export async function findByStudent(studentId, limit = 100) {
  try {
    const db = getFirestore();
    const snapshot = await db
      .collection(COLLECTION)
      .where('studentId', '==', studentId)
      .limit(limit)
      .get();

    const reviews = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      reviews.push({
        id: doc.id,
        ...data,
        createdAt: parseDate(data.createdAt),
        updatedAt: parseDate(data.updatedAt),
      });
    });

    return reviews;
  } catch (error) {
    console.error('Error finding reviews by student:', error);
    throw error;
  }
}

/**
 * Create or update a review
 * @param {string|undefined} reviewId - Review ID (undefined for new reviews)
 * @param {Object} reviewData - Review data
 * @returns {Promise<string>} Review ID
 */
export async function save(reviewId, reviewData) {
  try {
    const db = getFirestore();
    const firestoreData = {
      ...reviewData,
      updatedAt: getTimestamp(),
    };

    if (reviewId) {
      // Update existing review
      const docRef = db.collection(COLLECTION).doc(reviewId);
      await docRef.set(firestoreData, { merge: true });
      return reviewId;
    } else {
      // Create new review
      firestoreData.createdAt = getTimestamp();
      const colRef = db.collection(COLLECTION);
      const docRef = await colRef.add(firestoreData);
      return docRef.id;
    }
  } catch (error) {
    console.error('Error saving review:', error);
    throw error;
  }
}

/**
 * Delete a review
 * @param {string} reviewId - Review ID
 * @returns {Promise<void>}
 */
export async function deleteReview(reviewId) {
  try {
    const db = getFirestore();
    await db.collection(COLLECTION).doc(reviewId).delete();
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
}

/**
 * Calculate tutor statistics from reviews
 * @param {string} tutorId - Tutor ID
 * @returns {Promise<Object>} { averageRating, totalReviews }
 */
export async function calculateTutorStats(tutorId) {
  try {
    const reviews = await findByTutor(tutorId, 1000);

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
      };
    }

    const totalStars = reviews.reduce((sum, review) => sum + (review.rating || review.stars || 0), 0);
    const averageRating = parseFloat((totalStars / reviews.length).toFixed(2));

    return {
      averageRating,
      totalReviews: reviews.length,
    };
  } catch (error) {
    console.error('Error calculating tutor stats:', error);
    throw error;
  }
}

export default {
  findById,
  findBySessionAndReviewer,
  findByTutor,
  findBySession,
  findByStudent,
  save,
  deleteReview,
  calculateTutorStats,
};
