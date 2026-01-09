import { API_URL } from '../../../config/api';

const TutoringHistoryService = {

  getStudentTutoringHistory: async (userId) => {
    try {
      const response = await fetch(`${API_URL}/tutoring-sessions/student/${userId}/history`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error getting tutoring history:', error);
      return [];
    }
  },

  getUniqueCourses: (sessions) => {
    if (!Array.isArray(sessions)) return [];
    const courses = sessions.map(s => s.course).filter(Boolean);
    return [...new Set(courses)];
  },

  filterByDate: (sessions, startDate, endDate) => {
    if (!Array.isArray(sessions)) return [];
    return sessions.filter(session => {
      if (!session.scheduledDateTime) return false;
      const sessionDate = new Date(session.scheduledDateTime);
      
      if (startDate && sessionDate < startDate) return false;
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (sessionDate > endOfDay) return false;
      }
      
      return true;
    });
  },

  formatDate: (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};
export default TutoringHistoryService;
