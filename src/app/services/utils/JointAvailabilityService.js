import { API_URL } from '../../../config/api';

export const JointAvailabilityService = {
  getJointAvailability: async (course) => {
    try {
      const response = await fetch(`${API_URL}/availability/joint/${course}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error getting joint availability:', error);
      return [];
    }
  }
};
