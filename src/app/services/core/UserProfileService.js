import { db } from '../../../firebaseConfig';
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
 * @typedef {import('../models/user.model').User} User
 * @typedef {import('../models/user.model').UserProfile} UserProfile
 */

export class UserProfileService {
  static USER_COLLECTION = 'user';
  static TUTOR_SUBJECTS_COLLECTION = 'tutor_subjects';

  /**
   * Get user profile data
   * @param {string} userEmail - User's email address
   * @returns {Promise<{success: boolean, data?: User, error?: string}>}
   */
  static async getUserProfile(userEmail) {
    try {
      const userDocRef = doc(db, this.USER_COLLECTION, userEmail);
      const userSnap = await getDoc(userDocRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        return {
          success: true,
          data: {
            ...data,
            email: userEmail
          }
        };
      } else {
        return {
          success: false,
          error: 'User profile not found'
        };
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update user profile data
   * @param {string} userEmail - User's email address
   * @param {Partial<User>} updateData - Data to update
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  static async updateUserProfile(userEmail, updateData) {
    try {
      const userDocRef = doc(db, this.USER_COLLECTION, userEmail);
      
      // Clean the data to remove undefined values
      const cleanedData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined && value !== null && value !== '')
      );

      await updateDoc(userDocRef, {
        ...cleanedData,
        updatedAt: serverTimestamp()
      });

      console.log('User profile updated successfully');
      return { success: true };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get tutor subjects for a specific tutor
  static async getTutorSubjects(tutorEmail) {
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

      return {
        success: true,
        data: subjects
      };
    } catch (error) {
      console.error('Error getting tutor subjects:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Add a subject for a tutor
  static async addTutorSubject(tutorEmail, subjectData) {
    try {
      const docRef = doc(collection(db, this.TUTOR_SUBJECTS_COLLECTION));
      
      await setDoc(docRef, {
        tutorEmail,
        ...subjectData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log('Tutor subject added successfully');
      return { 
        success: true, 
        id: docRef.id 
      };
    } catch (error) {
      console.error('Error adding tutor subject:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Remove a subject for a tutor
  static async removeTutorSubject(subjectId) {
    try {
      const subjectRef = doc(db, this.TUTOR_SUBJECTS_COLLECTION, subjectId);
      await deleteDoc(subjectRef);

      console.log('Tutor subject removed successfully');
      return { success: true };
    } catch (error) {
      console.error('Error removing tutor subject:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get tutor statistics (rating, sessions count, etc.)
  static async getTutorStats(tutorEmail) {
    try {
      // This would typically aggregate data from tutoring sessions
      // For now, return mock data that can be replaced with real calculations
      const stats = {
        rating: 4.9,
        totalSessions: 0,
        completedSessions: 0,
        totalStudents: 0
      };

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Error getting tutor stats:', error);
      return {
        success: false,
        error: error.message,
        data: {
          rating: 0,
          totalSessions: 0,
          completedSessions: 0,
          totalStudents: 0
        }
      };
    }
  }

  // Create or update user profile if it doesn't exist
  static async createOrUpdateUserProfile(userEmail, userData) {
    try {
      const userDocRef = doc(db, this.USER_COLLECTION, userEmail);
      const userSnap = await getDoc(userDocRef);
      
      if (userSnap.exists()) {
        // Update existing profile
        return await this.updateUserProfile(userEmail, userData);
      } else {
        // Create new profile
        await setDoc(userDocRef, {
          ...userData,
          email: userEmail,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        console.log('User profile created successfully');
        return { success: true };
      }
    } catch (error) {
      console.error('Error creating/updating user profile:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
