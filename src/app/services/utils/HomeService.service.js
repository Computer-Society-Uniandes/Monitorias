import { API_URL } from '../../../config/api';

export const getMaterias = async () => {
  try {
    const response = await fetch(`${API_URL}/courses`);
    if (!response.ok) {
      throw new Error('Failed to fetch courses');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
};
