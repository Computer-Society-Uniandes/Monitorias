import { UserRepository } from '../../repositories/user.repository';
import { UserDTO, UpdateUserDTO } from '../../dto/user.dto';

/**
 * UserService - Business logic for user operations
 * Uses UserRepository for data access
 */
export class UserService {
  /**
   * Get user profile by email
   * @param {string} email - User email
   * @returns {Promise<UserDTO>}
   */
  static async getUserProfile(email) {
    try {
      if (!email) {
        throw new Error('Email is required');
      }

      const user = await UserRepository.findByEmail(email);
      
      if (!user) {
        throw new Error('User not found');
      }

      // If tutor, enrich with subjects
      if (user.isTutor) {
        const subjects = await UserRepository.findTutorSubjects(email);
        user.subjects = subjects.map(s => s.subject || s.name);
      }

      return UserDTO.fromEntity(user);
    } catch (error) {
      console.error('[UserService] Error getting profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {string} email - User email
   * @param {Partial<User>} updateData - Data to update
   * @returns {Promise<void>}
   */
  static async updateUserProfile(email, updateData) {
    try {
      if (!email) {
        throw new Error('Email is required');
      }

      // Validate and clean data
      const validatedData = UpdateUserDTO.validate(updateData);
      
      await UserRepository.update(email, validatedData);
      
      console.log('[UserService] Profile updated successfully');
    } catch (error) {
      console.error('[UserService] Error updating profile:', error);
      throw error;
    }
  }

  /**
   * Check if user exists
   * @param {string} email - User email
   * @returns {Promise<boolean>}
   */
  static async userExists(email) {
    try {
      return await UserRepository.exists(email);
    } catch (error) {
      console.error('[UserService] Error checking user existence:', error);
      throw error;
    }
  }

  /**
   * Create new user
   * @param {string} email - User email
   * @param {Partial<User>} userData - User data
   * @returns {Promise<void>}
   */
  static async createUser(email, userData) {
    try {
      if (!email) {
        throw new Error('Email is required');
      }

      // Check if user already exists
      const exists = await UserRepository.exists(email);
      if (exists) {
        throw new Error('User already exists');
      }

      await UserRepository.create(email, userData);
      
      console.log('[UserService] User created successfully');
    } catch (error) {
      console.error('[UserService] Error creating user:', error);
      throw error;
    }
  }

  /**
   * Get all tutors
   * @returns {Promise<UserDTO[]>}
   */
  static async getAllTutors() {
    try {
      const tutors = await UserRepository.findAllTutors();
      return tutors.map(tutor => UserDTO.fromEntity(tutor));
    } catch (error) {
      console.error('[UserService] Error getting tutors:', error);
      throw error;
    }
  }

  /**
   * Find tutors by subject
   * @param {string} subject - Subject name
   * @returns {Promise<UserDTO[]>}
   */
  static async findTutorsBySubject(subject) {
    try {
      if (!subject) {
        throw new Error('Subject is required');
      }

      const tutors = await UserRepository.findTutorsBySubject(subject);
      return tutors.map(tutor => UserDTO.fromEntity(tutor));
    } catch (error) {
      console.error('[UserService] Error finding tutors by subject:', error);
      throw error;
    }
  }

  /**
   * Add subject to tutor
   * @param {string} tutorEmail - Tutor email
   * @param {object} subjectData - Subject data
   * @returns {Promise<string>} Subject ID
   */
  static async addTutorSubject(tutorEmail, subjectData) {
    try {
      if (!tutorEmail) {
        throw new Error('Tutor email is required');
      }

      const subjectId = await UserRepository.addTutorSubject(tutorEmail, subjectData);
      
      console.log('[UserService] Subject added successfully');
      return subjectId;
    } catch (error) {
      console.error('[UserService] Error adding tutor subject:', error);
      throw error;
    }
  }

  /**
   * Remove subject from tutor
   * @param {string} subjectId - Subject ID
   * @returns {Promise<void>}
   */
  static async removeTutorSubject(subjectId) {
    try {
      if (!subjectId) {
        throw new Error('Subject ID is required');
      }

      await UserRepository.removeTutorSubject(subjectId);
      
      console.log('[UserService] Subject removed successfully');
    } catch (error) {
      console.error('[UserService] Error removing tutor subject:', error);
      throw error;
    }
  }

  /**
   * Delete user
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  static async deleteUser(email) {
    try {
      if (!email) {
        throw new Error('Email is required');
      }

      await UserRepository.delete(email);
      
      console.log('[UserService] User deleted successfully');
    } catch (error) {
      console.error('[UserService] Error deleting user:', error);
      throw error;
    }
  }
}

