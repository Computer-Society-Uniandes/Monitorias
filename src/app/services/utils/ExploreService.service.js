import { API_URL } from '../../../config/api';

export const ExploreService = {
  getFeaturedTutors: async () => {
    try {
      // Usamos /user/tutors/all como base, el backend podría filtrar por rating si se implementa
      // Por ahora traemos todos y el frontend puede filtrar o mostrar los primeros
      const response = await fetch(`${API_URL}/user/tutors/all`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error getting featured tutors:', error);
      return [];
    }
  },
  getCourses: async () => {
    try {
      const response = await fetch(`${API_URL}/courses`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error getting courses:', error);
      return [];
    }
  },
  getMajors: async () => {
    try {
      const response = await fetch(`${API_URL}/majors`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error getting majors:', error);
      return [];
    }
  },
  getFacultades: async () => {
    try {
      const response = await fetch(`${API_URL}/majors`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error getting facultades:', error);
      return [];
    }
  }
};
