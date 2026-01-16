/**
 * Tutoring Session Service
 * Business logic for tutoring session management
 */

import * as tutoringSessionRepository from '../repositories/tutoring-session.repository';

/**
 * Get session by ID
 * @param {string} id - Session ID
 * @returns {Promise<Object|null>}
 */
export async function getSessionById(id) {
  try {
    return await tutoringSessionRepository.findById(id);
  } catch (error) {
    console.error(`Error getting session by ID ${id}:`, error);
    throw error;
  }
}

/**
 * Get sessions by tutor
 * @param {string} tutorId - Tutor ID
 * @param {number} limit - Maximum results
 * @returns {Promise<Array>}
 */
export async function getSessionsByTutor(tutorId, limit = 100) {
  try {
    return await tutoringSessionRepository.findByTutor(tutorId, limit);
  } catch (error) {
    console.error('Error getting sessions by tutor:', error);
    throw error;
  }
}

/**
 * Get sessions by student
 * @param {string} studentId - Student ID
 * @param {number} limit - Maximum results
 * @returns {Promise<Array>}
 */
export async function getSessionsByStudent(studentId, limit = 100) {
  try {
    return await tutoringSessionRepository.findByStudent(studentId, limit);
  } catch (error) {
    console.error('Error getting sessions by student:', error);
    throw error;
  }
}

/**
 * Create or update tutoring session
 * @param {string|undefined} id - Session ID
 * @param {Object} sessionData - Session data
 * @returns {Promise<string>} Session ID
 */
export async function saveSession(id, sessionData) {
  try {
    return await tutoringSessionRepository.save(id, sessionData);
  } catch (error) {
    console.error('Error saving tutoring session:', error);
    throw error;
  }
}

/**
 * Delete tutoring session
 * @param {string} id - Session ID
 * @returns {Promise<void>}
 */
export async function deleteSession(id) {
  try {
    await tutoringSessionRepository.deleteSession(id);
    console.log(`Tutoring session deleted: ${id}`);
  } catch (error) {
    console.error('Error deleting tutoring session:', error);
    throw error;
  }
}

export default {
  getSessionById,
  getSessionsByTutor,
  getSessionsByStudent,
  saveSession,
  deleteSession,
};

