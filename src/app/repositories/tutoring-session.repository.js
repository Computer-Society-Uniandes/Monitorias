import { db } from '../../firebaseConfig';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc,
  updateDoc,
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp
} from 'firebase/firestore';

/**
 * @typedef {import('../entities/tutoring_session.entity').TutoringSession} TutoringSession
 */

/**
 * TutoringSessionRepository - Data access layer for TutoringSession entity
 * Handles all Firebase operations for tutoring sessions
 */
export class TutoringSessionRepository {
  static COLLECTION = 'tutoring_sessions';

  /**
   * Find session by ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<TutoringSession|null>}
   */
  static async findById(sessionId) {
    try {
      const docRef = doc(db, this.COLLECTION, sessionId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        scheduledDateTime: data.scheduledDateTime?.toDate(),
        endDateTime: data.endDateTime?.toDate(),
        cancelledAt: data.cancelledAt?.toDate(),
        completedAt: data.completedAt?.toDate(),
        requestedAt: data.requestedAt?.toDate(),
        acceptedAt: data.acceptedAt?.toDate(),
        rejectedAt: data.rejectedAt?.toDate(),
        declinedAt: data.declinedAt?.toDate(),
        rescheduledAt: data.rescheduledAt?.toDate(),
      };
    } catch (error) {
      console.error('[TutoringSessionRepository] Error finding by ID:', error);
      throw error;
    }
  }

  /**
   * Create a new session
   * @param {Partial<TutoringSession>} sessionData - Session data
   * @returns {Promise<string>} Session ID
   */
  static async create(sessionData) {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTION), {
        ...sessionData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('[TutoringSessionRepository] Error creating session:', error);
      throw error;
    }
  }

  /**
   * Update session
   * @param {string} sessionId - Session ID
   * @param {Partial<TutoringSession>} updateData - Data to update
   * @returns {Promise<void>}
   */
  static async update(sessionId, updateData) {
    try {
      // Remove undefined and null values
      const cleanedData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined && value !== null)
      );

      const docRef = doc(db, this.COLLECTION, sessionId);
      await updateDoc(docRef, {
        ...cleanedData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('[TutoringSessionRepository] Error updating session:', error);
      throw error;
    }
  }

  /**
   * Delete session
   * @param {string} sessionId - Session ID
   * @returns {Promise<void>}
   */
  static async delete(sessionId) {
    try {
      const docRef = doc(db, this.COLLECTION, sessionId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('[TutoringSessionRepository] Error deleting session:', error);
      throw error;
    }
  }

  /**
   * Find sessions by student
   * @param {string} studentEmail - Student email
   * @returns {Promise<TutoringSession[]>}
   */
  static async findByStudent(studentEmail) {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('studentEmail', '==', studentEmail),
        orderBy('scheduledDateTime', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const sessions = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sessions.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          scheduledDateTime: data.scheduledDateTime?.toDate(),
          endDateTime: data.endDateTime?.toDate(),
          cancelledAt: data.cancelledAt?.toDate(),
          completedAt: data.completedAt?.toDate(),
          requestedAt: data.requestedAt?.toDate(),
        });
      });

      return sessions;
    } catch (error) {
      console.error('[TutoringSessionRepository] Error finding by student:', error);
      throw error;
    }
  }

  /**
   * Find sessions by tutor
   * @param {string} tutorEmail - Tutor email
   * @returns {Promise<TutoringSession[]>}
   */
  static async findByTutor(tutorEmail) {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('tutorEmail', '==', tutorEmail),
        orderBy('scheduledDateTime', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const sessions = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sessions.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          scheduledDateTime: data.scheduledDateTime?.toDate(),
          endDateTime: data.endDateTime?.toDate(),
          cancelledAt: data.cancelledAt?.toDate(),
          completedAt: data.completedAt?.toDate(),
          requestedAt: data.requestedAt?.toDate(),
        });
      });

      return sessions;
    } catch (error) {
      console.error('[TutoringSessionRepository] Error finding by tutor:', error);
      throw error;
    }
  }

  /**
   * Find pending sessions by tutor
   * @param {string} tutorEmail - Tutor email
   * @returns {Promise<TutoringSession[]>}
   */
  static async findPendingByTutor(tutorEmail) {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('tutorEmail', '==', tutorEmail),
        where('status', '==', 'pending'),
        orderBy('requestedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const sessions = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Only include sessions that are truly pending approval
        if (data.tutorApprovalStatus === 'pending') {
          sessions.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            scheduledDateTime: data.scheduledDateTime?.toDate(),
            endDateTime: data.endDateTime?.toDate(),
            requestedAt: data.requestedAt?.toDate(),
          });
        }
      });

      return sessions;
    } catch (error) {
      console.error('[TutoringSessionRepository] Error finding pending sessions:', error);
      throw error;
    }
  }

  /**
   * Find sessions by status
   * @param {string} status - Session status
   * @returns {Promise<TutoringSession[]>}
   */
  static async findByStatus(status) {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('status', '==', status),
        orderBy('scheduledDateTime', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const sessions = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sessions.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          scheduledDateTime: data.scheduledDateTime?.toDate(),
          endDateTime: data.endDateTime?.toDate(),
        });
      });

      return sessions;
    } catch (error) {
      console.error('[TutoringSessionRepository] Error finding by status:', error);
      throw error;
    }
  }

  /**
   * Find sessions by tutor and status
   * @param {string} tutorEmail - Tutor email
   * @param {string} status - Session status
   * @returns {Promise<TutoringSession[]>}
   */
  static async findByTutorAndStatus(tutorEmail, status) {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('tutorEmail', '==', tutorEmail),
        where('status', '==', status),
        orderBy('scheduledDateTime', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const sessions = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sessions.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          scheduledDateTime: data.scheduledDateTime?.toDate(),
          endDateTime: data.endDateTime?.toDate(),
        });
      });

      return sessions;
    } catch (error) {
      console.error('[TutoringSessionRepository] Error finding by tutor and status:', error);
      throw error;
    }
  }
}
