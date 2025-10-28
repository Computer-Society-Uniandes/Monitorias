import { db } from '../firebaseConfig';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';

/**
 * @typedef {import('../entities/user.entity').User} User
 */

/**
 * UserRepository - Data access layer for User entity
 * Handles all Firebase operations for users
 */
export class UserRepository {
  static COLLECTION = 'user';
  static TUTOR_SUBJECTS_COLLECTION = 'tutor_subjects';

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<User|null>}
   */
  static async findByEmail(email) {
    try {
      const docRef = doc(db, this.COLLECTION, email);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        ...data,
        email,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      };
    } catch (error) {
      console.error('[UserRepository] Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Create a new user
   * @param {string} email - User email
   * @param {Partial<User>} userData - User data
   * @returns {Promise<void>}
   */
  static async create(email, userData) {
    try {
      const docRef = doc(db, this.COLLECTION, email);
      await setDoc(docRef, {
        ...userData,
        email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('[UserRepository] Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update user data
   * @param {string} email - User email
   * @param {Partial<User>} updateData - Data to update
   * @returns {Promise<void>}
   */
  static async update(email, updateData) {
    try {
      const docRef = doc(db, this.COLLECTION, email);
      
      // Remove undefined, null, and empty string values
      const cleanedData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => 
          value !== undefined && value !== null && value !== ''
        )
      );

      await updateDoc(docRef, {
        ...cleanedData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('[UserRepository] Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete user
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  static async delete(email) {
    try {
      const docRef = doc(db, this.COLLECTION, email);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('[UserRepository] Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Check if user exists
   * @param {string} email - User email
   * @returns {Promise<boolean>}
   */
  static async exists(email) {
    try {
      const docRef = doc(db, this.COLLECTION, email);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      console.error('[UserRepository] Error checking user existence:', error);
      throw error;
    }
  }

  /**
   * Find all tutors
   * @returns {Promise<User[]>}
   */
  static async findAllTutors() {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('isTutor', '==', true)
      );

      const querySnapshot = await getDocs(q);
      const tutors = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tutors.push({
          ...data,
          email: doc.id,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        });
      });

      return tutors;
    } catch (error) {
      console.error('[UserRepository] Error finding all tutors:', error);
      throw error;
    }
  }

  /**
   * Find tutors by subject
   * @param {string} subject - Subject name
   * @returns {Promise<User[]>}
   */
  static async findTutorsBySubject(subject) {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('isTutor', '==', true),
        where('subjects', 'array-contains', subject)
      );

      const querySnapshot = await getDocs(q);
      const tutors = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tutors.push({
          ...data,
          email: doc.id,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        });
      });

      return tutors;
    } catch (error) {
      console.error('[UserRepository] Error finding tutors by subject:', error);
      throw error;
    }
  }

  // --- Tutor Subjects Methods ---

  /**
   * Find tutor subjects
   * @param {string} tutorEmail - Tutor email
   * @returns {Promise<Array>}
   */
  static async findTutorSubjects(tutorEmail) {
    try {
      const q = query(
        collection(db, this.TUTOR_SUBJECTS_COLLECTION),
        where('tutorEmail', '==', tutorEmail)
      );

      const querySnapshot = await getDocs(q);
      const subjects = [];

      querySnapshot.forEach((doc) => {
        subjects.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return subjects;
    } catch (error) {
      console.error('[UserRepository] Error finding tutor subjects:', error);
      throw error;
    }
  }

  /**
   * Add tutor subject
   * @param {string} tutorEmail - Tutor email
   * @param {object} subjectData - Subject data
   * @returns {Promise<string>} Subject ID
   */
  static async addTutorSubject(tutorEmail, subjectData) {
    try {
      const docRef = doc(collection(db, this.TUTOR_SUBJECTS_COLLECTION));
      
      await setDoc(docRef, {
        tutorEmail,
        ...subjectData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error('[UserRepository] Error adding tutor subject:', error);
      throw error;
    }
  }

  /**
   * Remove tutor subject
   * @param {string} subjectId - Subject ID
   * @returns {Promise<void>}
   */
  static async removeTutorSubject(subjectId) {
    try {
      const docRef = doc(db, this.TUTOR_SUBJECTS_COLLECTION, subjectId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('[UserRepository] Error removing tutor subject:', error);
      throw error;
    }
  }
}

