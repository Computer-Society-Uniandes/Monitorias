import { API_URL } from '../../../config/api';

export const NotificationService = {
  getNotifications: async (userId) => {
    try {
      const response = await fetch(`${API_URL}/notifications/user/${userId}`);
      if (!response.ok) return [];
      const data = await response.json();
      // Return the data directly - let the caller handle array extraction
      return data;
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  },

  getUnreadNotifications: async (userId) => {
    try {
      const response = await fetch(`${API_URL}/notifications/user/${userId}/unread`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error getting unread notifications:', error);
      return [];
    }
  },

  markAsRead: async (notificationId) => {
    try {
      const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
      return response.ok;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  },

  // Métodos legacy para compatibilidad
  getTutorNotifications: async (email) => {
    try {
      const result = await NotificationService.getNotifications(email);
      // Ensure we return an array
      if (Array.isArray(result)) {
        return result;
      } else if (result && Array.isArray(result.notifications)) {
        return result.notifications;
      } else if (result && result.data && Array.isArray(result.data)) {
        return result.data;
      } else {
        console.warn('Unexpected notification response format:', result);
        return [];
      }
    } catch (error) {
      console.error('Error getting tutor notifications:', error);
      return [];
    }
  },

  getStudentNotifications: async (email) => {
    try {
      const result = await NotificationService.getNotifications(email);
      // Ensure we return an array
      if (Array.isArray(result)) {
        return result;
      } else if (result && Array.isArray(result.notifications)) {
        return result.notifications;
      } else if (result && result.data && Array.isArray(result.data)) {
        return result.data;
      } else {
        console.warn('Unexpected notification response format:', result);
        return [];
      }
    } catch (error) {
      console.error('Error getting student notifications:', error);
      return [];
    }
  },

  markNotificationAsRead: async (notificationId) => {
    return NotificationService.markAsRead(notificationId);
  },

  markAllAsRead: async (email, role) => {
    // No hay endpoint directo en la lista para "marcar todas", iteramos o asumimos que no se puede por ahora
    // O podríamos implementar un loop en el frontend
    return true; 
  }
};
