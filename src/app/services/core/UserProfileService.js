import { UserRepository } from '../../repositories/user.repository';

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
      const user = await UserRepository.findByEmail(userEmail);
      
      if (user) {
        return {
          success: true,
          data: user
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
      await UserRepository.update(userEmail, updateData);

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
      const subjects = await UserRepository.findTutorSubjects(tutorEmail);

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
      const id = await UserRepository.addTutorSubject(tutorEmail, subjectData);

      console.log('Tutor subject added successfully');
      return { 
        success: true, 
        id 
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
      await UserRepository.removeTutorSubject(subjectId);

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
      const exists = await UserRepository.exists(userEmail);
      
      if (exists) {
        // Update existing profile
        return await this.updateUserProfile(userEmail, userData);
      } else {
        // Create new profile
        await UserRepository.create(userEmail, userData);

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
