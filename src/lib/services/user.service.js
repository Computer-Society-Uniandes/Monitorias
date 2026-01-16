/**
 * User Service
 * Business logic for user management
 */

import * as userRepository from '../repositories/user.repository';

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>}
 */
export async function getUserById(userId) {
  try {
    return await userRepository.findById(userId);
  } catch (error) {
    console.error(`Error getting user by ID ${userId}:`, error);
    throw error;
  }
}

/**
 * Get user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>}
 */
export async function getUserByEmail(email) {
  try {
    return await userRepository.findByEmail(email);
  } catch (error) {
    console.error(`Error getting user by email ${email}:`, error);
    throw error;
  }
}

/**
 * Create or update user
 * @param {string} userId - User ID
 * @param {Object} userData - User data
 * @returns {Promise<string>} User ID
 */
export async function saveUser(userId, userData) {
  try {
    return await userRepository.save(userId, userData);
  } catch (error) {
    console.error('Error saving user:', error);
    throw error;
  }
}

/**
 * Get tutors by course
 * @param {string} course - Course name
 * @param {number} limit - Maximum results
 * @returns {Promise<Object>} Tutors data
 */
export async function getTutorsByCourse(course, limit = 50) {
  try {
    const tutors = await userRepository.findTutorsByCourse(course, limit);
    return {
      success: true,
      tutors,
      count: tutors.length,
    };
  } catch (error) {
    console.error('Error getting tutors by course:', error);
    throw error;
  }
}

/**
 * Get all tutors
 * @param {number} limit - Maximum results
 * @returns {Promise<Object>} Tutors data
 */
export async function getAllTutors(limit = 100) {
  try {
    const tutors = await userRepository.findAllTutors(limit);
    return {
      success: true,
      tutors,
      count: tutors.length,
    };
  } catch (error) {
    console.error('Error getting all tutors:', error);
    throw error;
  }
}

/**
 * Delete user
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function deleteUser(userId) {
  try {
    await userRepository.deleteUser(userId);
    console.log(`User deleted: ${userId}`);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

export default {
  getUserById,
  getUserByEmail,
  saveUser,
  getTutorsByCourse,
  getAllTutors,
  deleteUser,
};

