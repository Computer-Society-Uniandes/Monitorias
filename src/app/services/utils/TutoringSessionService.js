import { API_URL } from '../../../config/api';

export const TutoringSessionService = {
  getCourseId: async (course) => {
    try {
      const response = await fetch(`${API_URL}/courses/`);
      if (!response.ok) {
        console.error('Courses API response not OK:', response.status, response.statusText);
        return null;
      }
      const responseData = await response.json();
      
      // Handle different response formats
      let coursesArray = null;
      if (Array.isArray(responseData)) {
        coursesArray = responseData;
      } else if (responseData.data && Array.isArray(responseData.data)) {
        coursesArray = responseData.data;
      } else if (responseData.courses && Array.isArray(responseData.courses)) {
        coursesArray = responseData.courses;
      } else {
        console.error('Unexpected courses API response format:', responseData);
        return null;
      }
      
      if (!coursesArray || coursesArray.length === 0) {
        console.warn('No courses found in API response');
        return null;
      }
      
      const courseItem = coursesArray.find(item => item.course === course || item.name === course);
      if (!courseItem) {
        console.warn(`Course "${course}" not found in courses list. Available courses:`, coursesArray.map(c => c.course || c.name));
        return null;
      }
      
      return courseItem?.uid || courseItem?.id || null;
    } catch (error) {
      console.error('Error getting course id:', error);
      return null; 
    }
  },
  createSession: async (sessionData) => {
    try {
      console.log('Creating session:', sessionData);
      const response = await fetch(`${API_URL}/tutoring-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        throw new Error('Error creating session');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  },

  bookSpecificSlot: async (slot, studentEmail, studentName, notes, course, courseId) => {
    const sessionData = {
      tutorEmail: slot.tutorEmail || slot.tutorId,
      tutorId: slot.tutorId,
      tutorName: slot.tutorName,
      studentEmail: studentEmail,
      studentName: studentName,
      course: course || slot.course || 'Tutoring',
      courseId: courseId || slot.courseId || course || slot.course || 'Tutoring',
      scheduledDateTime: slot.startDateTime,
      endDateTime: slot.endDateTime,
      location: slot.location || 'Virtual',
      notes: notes,
      price: slot.price || 50000,
      parentAvailabilityId: slot.parentAvailabilityId || slot.id,
      slotId: slot.id,
      status: 'pending',
      paymentStatus: 'pending',
      requestedAt: new Date()
    };
    return await TutoringSessionService.createSession(sessionData);
  },

  getStudentSessions: async (studentId) => {
    try {
      const response = await fetch(`${API_URL}/tutoring-sessions/student/${studentId}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error getting student sessions:', error);
      return [];
    }
  },

  getTutorSessions: async (tutorId) => {
    try {
      const response = await fetch(`${API_URL}/tutoring-sessions/tutor/${tutorId}`);
      if (!response.ok) return [];
      const data = await response.json();
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.sessions)) return data.sessions;
      if (data && Array.isArray(data.data)) return data.data;
      return [];
    } catch (error) {
      console.error('Error getting tutor sessions:', error);
      return [];
    }
  },

  getHistory: async (studentId) => {
    try {
      const response = await fetch(`${API_URL}/tutoring-sessions/student/${studentId}/history`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error getting session history:', error);
      return [];
    }
  },

  getSessionById: async (sessionId) => {
    try {
      const response = await fetch(`${API_URL}/tutoring-sessions/${sessionId}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data?.session || data || null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  },

  updateSession: async (sessionId, updateData) => {
    try {
      const response = await fetch(`${API_URL}/tutoring-sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Error updating session');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  },

  // Métodos legacy o auxiliares que podrían necesitarse si el frontend los llama
  // Adaptados para usar los endpoints disponibles o devolver vacío si no hay equivalente directo
  getPendingSessionsForTutor: async (tutorId) => {
    // Podemos filtrar las sesiones del tutor por estado 'pending' en el frontend o backend
    try {
      const sessions = await TutoringSessionService.getTutorSessions(tutorId);
      return sessions.filter(s => s.status === 'pending');
    } catch (error) {
      return [];
    }
  },

  getSlotBookingsForAvailability: async (availabilityId) => {
    // No hay endpoint directo en la lista, pero quizás no sea necesario si las sesiones traen la info
    // Retornamos vacío por seguridad
    return [];
  },

  getSlotBooking: async (parentAvailabilityId, slotIndex) => {
    // Igual que arriba
    return null;
  },

  addReview: async (sessionId, reviewData) => {
    try {
      const response = await fetch(`${API_URL}/tutoring-sessions/${sessionId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });

      if (!response.ok) {
        throw new Error('Error adding review');
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding review:', error);
      throw error;
    }
  },

  getTutorWeeklyPerformance: async (tutorId) => {
    try {
      const sessions = await TutoringSessionService.getTutorSessions(tutorId);
      if (!Array.isArray(sessions)) return { weeklySessions: 0, weeklyEarnings: 0, studentRetention: 0 };

      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));

      const weeklySessions = sessions.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate >= startOfWeek && sessionDate <= endOfWeek;
      });

      const weeklyEarnings = weeklySessions.reduce((acc, session) => acc + (session.price || 0), 0);

      return {
        weeklySessions: weeklySessions.length,
        weeklyEarnings,
        studentRetention: 0 // Placeholder as logic is complex without more data
      };
    } catch (error) {
      console.error('Error calculating weekly performance:', error);
      return { weeklySessions: 0, weeklyEarnings: 0, studentRetention: 0 };
    }
  },

  getTutorSessionStats: async (tutorId) => {
    try {
      const sessions = await TutoringSessionService.getTutorSessions(tutorId);
      if (!Array.isArray(sessions)) return { total: 0, completed: 0, scheduled: 0, totalEarnings: 0, averageRating: 0 };

      const completed = sessions.filter(s => s.status === 'completed');
      const scheduled = sessions.filter(s => s.status === 'scheduled' || s.status === 'pending');
      const totalEarnings = completed.reduce((acc, s) => acc + (s.price || 0), 0);
      
      // Calculate average rating if reviews exist
      // Assuming session object might have a rating or review field, otherwise 0
      const ratedSessions = sessions.filter(s => s.rating);
      const averageRating = ratedSessions.length > 0 
        ? ratedSessions.reduce((acc, s) => acc + s.rating, 0) / ratedSessions.length 
        : 0;

      return {
        total: sessions.length,
        completed: completed.length,
        scheduled: scheduled.length,
        totalEarnings,
        averageRating
      };
    } catch (error) {
      console.error('Error calculating session stats:', error);
      return { total: 0, completed: 0, scheduled: 0, totalEarnings: 0, averageRating: 0 };
    }
  },

  canCancelSession: (session) => {
    console.log('Checking if session can be cancelled:', session);
    if (!session || !session.scheduledStart) return false;
    const now = new Date();
    const sessionDate = new Date(session.scheduledStart); 
    const diffInHours = (sessionDate - now) / (1000 * 60 * 60);
    if (diffInHours < 2) return false;
    return session.status !== 'cancelled' && session.status !== 'completed';
  }
};
