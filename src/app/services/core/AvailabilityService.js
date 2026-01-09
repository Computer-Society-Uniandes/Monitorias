/**
 * AvailabilityService
 * 
 * Service to manage tutor availability by communicating with the backend API
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class AvailabilityServiceClass {
  constructor() {
    this.autoSyncInterval = null;
  }

  /**
   * Helper to get access token from cookies
   * @returns {string|null} Access token or null
   */

  /**
   * Get all availabilities with optional filtering by tutor ID
   * @param {string} tutorId - Optional tutor ID (email) to filter by
   * @param {string} course - Optional course to filter by
   * @param {string} startDate - Optional start date (ISO string)
   * @param {string} endDate - Optional end date (ISO string)
   * @param {number} limit - Optional limit
   * @returns {Promise<Array>} Array of availability slots
   */
  async getAvailabilities(tutorId = null, course = null, startDate = null, endDate = null, limit = null) {
    try {
      // Construct URL properly
      const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      const endpoint = `${baseUrl}/availability`;
      const url = new URL(endpoint);
      
      if (tutorId) url.searchParams.append('tutorId', tutorId);
      if (course) url.searchParams.append('course', course);
      if (startDate) url.searchParams.append('startDate', startDate);
      if (endDate) url.searchParams.append('endDate', endDate);
      if (limit) url.searchParams.append('limit', limit.toString());

      const requestUrl = url.toString();
      console.log('Fetching availabilities from:', requestUrl);

      const response = await fetch(requestUrl, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }).catch(fetchError => {
        // Handle network errors (CORS, connection refused, etc.)
        console.error('Network error fetching availabilities:', fetchError);
        throw new Error(`Failed to connect to backend: ${fetchError.message}. Please check if the backend is running at ${API_BASE_URL}`);
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
        console.error('Backend returned error:', response.status, errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (data.success !== false) {
        return data.availabilities || data.data || [];
      } else {
        console.error('Failed to fetch availabilities:', data.error);
        return [];
      }
    } catch (error) {
      console.error('Error fetching availabilities:', error);
      // Re-throw with more context if it's not already an Error with message
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to fetch availabilities: ${error}`);
    }
  }

  /**
   * Get availability with fallback to handle errors gracefully
   * @param {string} tutorId - Optional tutor ID (uid/id, not email)
   * @returns {Promise<Object>} Object with availabilitySlots, connected status, etc.
   */
  async getAvailabilityWithFallback(tutorId = null) {
    try {
      const availabilities = await this.getAvailabilities(tutorId);
      
      // Transform backend data to frontend format
      const availabilitySlots = availabilities.map(avail => ({
        id: avail.id || avail.googleEventId || avail.eventId,
        title: avail.summary || avail.title || 'Available',
        date: this.extractDate(avail.startDateTime || avail.start),
        startTime: this.extractTime(avail.startDateTime || avail.start),
        endTime: this.extractTime(avail.endDateTime || avail.end),
        startDateTime: avail.startDateTime || avail.start,
        endDateTime: avail.endDateTime || avail.end,
        tutorId: avail.tutorId || avail.tutorEmail,
        tutorEmail: avail.tutorId || avail.tutorEmail,
        isBooked: avail.isBooked || false,
        location: avail.location,
        course: avail.course,
      }));

      return {
        availabilitySlots,
        connected: true,
        source: 'backend',
        usingMockData: false,
      };
    } catch (error) {
      console.error('Error in getAvailabilityWithFallback:', error);
      
      // Return empty state on error
      return {
        availabilitySlots: [],
        connected: false,
        source: 'error',
        usingMockData: true,
        error: error.message,
      };
    }
  }

  /**
   * Check if an event exists
   * @param {string} eventId - Event ID to check
   * @returns {Promise<boolean>} True if event exists
   */
  async checkEventExists(eventId) {
    try {
      const url = new URL(`${API_BASE_URL}/availability/check-event`);
      url.searchParams.append('eventId', eventId);

      const response = await fetch(url.toString(), {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.exists || false;
    } catch (error) {
      console.error('Error checking event existence:', error);
      return false;
    }
  }

  /**
   * Sync availabilities from calendar
   * @param {string} tutorId - Tutor ID (uid/id, not email)
   * @param {string} accessToken - Access token for Google Calendar
   * @param {string} calendarId - Optional calendar ID
   * @returns {Promise<Object>} Sync results
   */
  async syncAvailabilities(tutorId, accessToken, calendarId = null) {
    try {
      const body = { tutorId, accessToken };
      if (calendarId) body.calendarId = calendarId;
      
      const response = await fetch(`${API_BASE_URL}/availability/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error syncing availabilities:', error);
      throw error;
    }
  }

  /**
   * Sync specific events
   * @param {string} tutorId - Tutor ID (uid/id, not email)
   * @param {Array} events - Array of events to sync
   * @returns {Promise<Object>} Sync results
   */
  async syncSpecificEvents(tutorId, events) {
    try {
      const response = await fetch(`${API_BASE_URL}/availability/sync-specific`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Browser sends cookies automatically
        body: JSON.stringify({ tutorId, events }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error syncing specific events:', error);
      throw error;
    }
  }

  /**
   * Intelligent sync - only syncs new events
   * @param {string} tutorId - Tutor ID (uid/id, not email)
   * @param {string} calendarName - Optional calendar name (e.g., "Disponibilidad")
   * @param {number} daysAhead - Optional number of days to sync ahead (default: 30)
   * @returns {Promise<Object>} Sync results
   */
  async intelligentSync(tutorId, calendarName = "Disponibilidad", daysAhead = 30) {
    try {
      const body = { tutorId, daysAhead };
      if (calendarName) body.calendarName = calendarName;
      
      const response = await fetch(`${API_BASE_URL}/availability/sync-intelligent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Browser sends cookies automatically
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error in intelligent sync:', error);
      throw error;
    }
  }

  /**
   * Create availability event in Google Calendar and Firebase
   * @param {string} tutorId - Tutor ID (uid/id, not email)
   * @param {Object} eventData - Event data (title, date, startTime, endTime, etc.)
   * @returns {Promise<Object>} Created event result
   */
  async createAvailabilityEvent(tutorId, eventData) {
    try {
      const body = {
        tutorId,
        ...eventData,
      };
      console.log('Creating availability event:', body);
      
      const response = await fetch(`${API_BASE_URL}/availability/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Browser sends cookies automatically
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating availability event:', error);
      throw error;
    }
  }

  /**
   * Delete availability event from Google Calendar and Firebase
   * @param {string} eventId - Event ID to delete
   * @param {string} calendarId - Optional calendar ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteAvailabilityEvent(eventId, calendarId = null) {
    try {
      const url = new URL(`${API_BASE_URL}/availability/delete`);
      url.searchParams.append('eventId', eventId);
      if (calendarId) url.searchParams.append('calendarId', calendarId);
      
      const response = await fetch(url.toString(), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Browser sends cookies automatically
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting availability event:', error);
      throw error;
    }
  }

  /**
   * Validate event data before creation
   * @param {Object} eventData - Event data to validate
   * @returns {Object} Validation result { isValid, errors }
   */
  validateEventData(eventData) {
    const errors = [];

    if (!eventData.date) {
      errors.push('La fecha es requerida');
    }

    if (!eventData.startTime) {
      errors.push('La hora de inicio es requerida');
    }

    if (!eventData.endTime) {
      errors.push('La hora de fin es requerida');
    }

    if (eventData.startTime && eventData.endTime) {
      const startTime = new Date(`2000-01-01T${eventData.startTime}`);
      const endTime = new Date(`2000-01-01T${eventData.endTime}`);
      if (endTime <= startTime) {
        errors.push('La hora de fin debe ser posterior a la hora de inicio');
      }
    }

    if (eventData.date) {
      const selectedDate = new Date(eventData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        errors.push('No se puede crear un evento en una fecha pasada');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Start auto-sync (polls for updates periodically)
   * @param {string} tutorId - Tutor ID (uid/id, not email)
   * @param {number} interval - Interval in milliseconds (default: 5 minutes)
   */
  startAutoSync(tutorId, interval = 300000) {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
    }

    this.autoSyncInterval = setInterval(async () => {
      try {
        await this.syncAvailabilities(tutorId);
        console.log('Auto-sync completed for', tutorId);
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    }, interval);

    console.log(`Auto-sync started for ${tutorId} with interval ${interval}ms`);
  }

  /**
   * Stop auto-sync
   */
  stopAutoSync() {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
      console.log('Auto-sync stopped');
    }
  }

  /**
   * Helper: Extract date in YYYY-MM-DD format from datetime string
   */
  extractDate(datetime) {
    if (!datetime) return '';
    try {
      const date = new Date(datetime);
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error extracting date:', error);
      return '';
    }
  }

  /**
   * Helper: Extract time in HH:MM format from datetime string
   */
  extractTime(datetime) {
    if (!datetime) return '';
    try {
      const date = new Date(datetime);
      return date.toTimeString().slice(0, 5);
    } catch (error) {
      console.error('Error extracting time:', error);
      return '';
    }
  }

  // ==================== JOINT AVAILABILITY METHODS ====================

  /**
   * Get availability for multiple tutors
   * Backend: POST /availability/joint/multiple
   * @param {Array<string>} tutorIds - Array of tutor IDs (uid/id, not emails)
   * @param {string} startDate - Optional start date (YYYY-MM-DD)
   * @param {string} endDate - Optional end date (YYYY-MM-DD)
   * @param {number} limit - Optional limit
   * @returns {Promise<Object>} Multiple tutors availability
   */
  async getMultipleTutorsAvailability(tutorIds, startDate = null, endDate = null, limit = 100) {
    try {
      const body = { tutorIds, limit };
      if (startDate) body.startDate = startDate;
      if (endDate) body.endDate = endDate;

      const response = await fetch(`${API_BASE_URL}/availability/joint/multiple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Browser sends cookies automatically
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: data.success || true,
        tutorsAvailability: data.tutorsAvailability || [],
        totalTutors: data.totalTutors || 0,
        connectedTutors: data.connectedTutors || 0,
        totalSlots: data.totalSlots || 0,
      };
    } catch (error) {
      console.error('Error getting multiple tutors availability:', error);
      throw error;
    }
  }

  /**
   * Get joint availability for a course (gets all tutors teaching that course)
   * @param {string} courseName - Course name
   * @param {string} startDate - Optional start date (YYYY-MM-DD)
   * @param {string} endDate - Optional end date (YYYY-MM-DD)
   * @param {number} limit - Optional limit
   * @returns {Promise<Object>} Joint availability for all tutors of the course
   */
  async getJointAvailabilityByCourse(courseName, startDate = null, endDate = null, limit = 100) {
    try {
      // First, get all tutors teaching this course using UserService
      // Import UserService dynamically to avoid circular dependencies
      const UserServiceModule = await import('../core/UserService');
      const UserService = UserServiceModule.UserService;
      const tutorsResponse = await UserService.getTutorsByCourse(courseName, 100);
      console.log('Tutors response:', tutorsResponse);
      // UserService.getTutorsByCourse returns { success, tutors, count }
      const tutors = tutorsResponse?.tutors || [];
      
      if (!tutors || tutors.length === 0) {
        console.log(`No tutors found for course: ${courseName}`);
        return {
          success: true,
          tutorsAvailability: [],
          totalTutors: 0,
          connectedTutors: 0,
          totalSlots: 0,
        };
      }

      // Extract tutor IDs - prioritize id/uid over email
      const tutorIds = tutors.map(tutor => tutor.id || tutor.uid || tutor.email).filter(Boolean);
      
      if (tutorIds.length === 0) {
        console.warn('Found tutors but could not extract IDs:', tutors);
        return {
          success: true,
          tutorsAvailability: [],
          totalTutors: 0,
          connectedTutors: 0,
          totalSlots: 0,
        };
      }

      console.log(`Getting joint availability for ${tutorIds.length} tutors of course: ${courseName}`);
      
      // Get availability for all tutors
      return await this.getMultipleTutorsAvailability(tutorIds, startDate, endDate, limit);
    } catch (error) {
      console.error('Error getting joint availability by course:', error);
      throw error;
    }
  }

  /**
   * Generate joint availability slots for a specific day
   * Backend: POST /availability/joint/day
   * @param {Array<string>} tutorIds - Array of tutor IDs (uid/id, not emails)
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Object>} Joint slots for the day
   */
  async generateJointSlotsForDay(tutorIds, date) {
    try {
      const response = await fetch(`${API_BASE_URL}/availability/joint/day`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Browser sends cookies automatically
        body: JSON.stringify({ tutorIds, date }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: data.success || true,
        date: data.date,
        jointSlots: data.jointSlots || [],
        totalSlots: data.totalSlots || 0,
        tutorsCount: data.tutorsCount || 0,
      };
    } catch (error) {
      console.error('Error generating joint slots for day:', error);
      throw error;
    }
  }

  /**
   * Generate joint availability slots for a specific day by course
   * @param {string} courseName - Course name
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Object>} Joint slots for the day
   */
  async generateJointSlotsForDayByCourse(courseName, date) {
    try {
      // First, get all tutors teaching this course
      const UserServiceModule = await import('../core/UserService');
      const UserService = UserServiceModule.UserService;
      const tutorsResponse = await UserService.getTutorsByCourse(courseName, 100);
      
      // UserService.getTutorsByCourse returns { success, tutors, count }
      const tutors = tutorsResponse?.tutors || [];
      
      if (!tutors || tutors.length === 0) {
        return {
          success: true,
          date,
          jointSlots: [],
          totalSlots: 0,
          tutorsCount: 0,
        };
      }

      // Extract tutor IDs
      // Extract tutor IDs - prioritize id/uid over email
      const tutorIds = tutors.map(tutor => tutor.id || tutor.uid || tutor.email).filter(Boolean);
      
      if (tutorIds.length === 0) {
        return {
          success: true,
          date,
          jointSlots: [],
          totalSlots: 0,
          tutorsCount: 0,
        };
      }

      // Generate joint slots for the day
      return await this.generateJointSlotsForDay(tutorIds, date);
    } catch (error) {
      console.error('Error generating joint slots for day by course:', error);
      throw error;
    }
  }

  /**
   * Generate joint availability slots for a week
   * Backend: POST /availability/joint/week
   * @param {Array<string>} tutorIds - Array of tutor IDs (uid/id, not emails)
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @returns {Promise<Object>} Joint slots for the week
   */
  async generateJointSlotsForWeek(tutorIds, startDate) {
    try {
      const response = await fetch(`${API_BASE_URL}/availability/joint/week`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Browser sends cookies automatically
        body: JSON.stringify({ tutorIds, startDate }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: data.success || true,
        startDate: data.startDate,
        weekSlots: data.weekSlots || {},
        totalSlots: data.totalSlots || 0,
        tutorsCount: data.tutorsCount || 0,
        daysWithSlots: data.daysWithSlots || 0,
      };
    } catch (error) {
      console.error('Error generating joint slots for week:', error);
      throw error;
    }
  }

  /**
   * Generate joint availability slots for a week by course
   * @param {string} courseName - Course name
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @returns {Promise<Object>} Joint slots for the week
   */
  async generateJointSlotsForWeekByCourse(courseName, startDate) {
    try {
      // First, get all tutors teaching this course
      const UserServiceModule = await import('../core/UserService');
      const UserService = UserServiceModule.UserService;
      const tutorsResponse = await UserService.getTutorsByCourse(courseName, 100);
      
      // UserService.getTutorsByCourse returns { success, tutors, count }
      const tutors = tutorsResponse?.tutors || [];
      
      if (!tutors || tutors.length === 0) {
        return {
          success: true,
          startDate,
          weekSlots: {},
          totalSlots: 0,
          tutorsCount: 0,
          daysWithSlots: 0,
        };
      }

      // Extract tutor IDs
      // Extract tutor IDs - prioritize id/uid over email
      const tutorIds = tutors.map(tutor => tutor.id || tutor.uid || tutor.email).filter(Boolean);
      
      if (tutorIds.length === 0) {
        return {
          success: true,
          startDate,
          weekSlots: {},
          totalSlots: 0,
          tutorsCount: 0,
          daysWithSlots: 0,
        };
      }

      // Generate joint slots for the week
      return await this.generateJointSlotsForWeek(tutorIds, startDate);
    } catch (error) {
      console.error('Error generating joint slots for week by course:', error);
      throw error;
    }
  }

  /**
   * Get joint availability statistics
   * Backend: POST /availability/joint/stats
   * @param {Array<string>} tutorIds - Array of tutor IDs (uid/id, not emails)
   * @returns {Promise<Object>} Joint availability statistics
   */
  async getJointAvailabilityStats(tutorIds) {
    try {
      const response = await fetch(`${API_BASE_URL}/availability/joint/stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Browser sends cookies automatically
        body: JSON.stringify({ tutorIds }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: data.success || true,
        stats: data.stats || {},
        tutorsAvailability: data.tutorsAvailability || {},
      };
    } catch (error) {
      console.error('Error getting joint availability stats:', error);
      throw error;
    }
  }

  /**
   * Get joint availability statistics by course
   * @param {string} courseName - Course name
   * @returns {Promise<Object>} Joint availability statistics
   */
  async getJointAvailabilityStatsByCourse(courseName) {
    try {
      // First, get all tutors teaching this course
      const UserServiceModule = await import('../core/UserService');
      const UserService = UserServiceModule.UserService;
      const tutorsResponse = await UserService.getTutorsByCourse(courseName, 100);
      
      // UserService.getTutorsByCourse returns { success, tutors, count }
      const tutors = tutorsResponse?.tutors || [];
      
      if (!tutors || tutors.length === 0) {
        return {
          success: true,
          stats: {},
          tutorsAvailability: {},
        };
      }

      // Extract tutor IDs
      // Extract tutor IDs - prioritize id/uid over email
      const tutorIds = tutors.map(tutor => tutor.id || tutor.uid || tutor.email).filter(Boolean);
      
      if (tutorIds.length === 0) {
        return {
          success: true,
          stats: {},
          tutorsAvailability: {},
        };
      }

      // Get statistics
      return await this.getJointAvailabilityStats(tutorIds);
    } catch (error) {
      console.error('Error getting joint availability stats by course:', error);
      throw error;
    }
  }

  // ==================== SLOT GENERATION METHODS ====================

  /**
   * Generate hourly slots from tutor availabilities
   * Backend: POST /availability/slots/generate
   * @param {string} tutorId - Tutor ID (uid/id, not email)
   * @param {string} startDate - Optional start date
   * @param {string} endDate - Optional end date
   * @param {number} limit - Optional limit
   * @returns {Promise<Object>} Generated slots
   */
  async generateSlots(tutorId, startDate = null, endDate = null, limit = 100) {
    try {
      const body = { tutorId, limit };
      if (startDate) body.startDate = startDate;
      if (endDate) body.endDate = endDate;

      const response = await fetch(`${API_BASE_URL}/availability/slots/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: data.success || true,
        slots: data.slots || [],
        totalSlots: data.totalSlots || 0,
        availableSlots: data.availableSlots || 0,
        bookedSlots: data.bookedSlots || 0,
      };
    } catch (error) {
      console.error('Error generating slots:', error);
      throw error;
    }
  }

  /**
   * Generate slots from specific availability IDs
   * Backend: POST /availability/slots/from-availabilities
   * @param {Array<string>} availabilityIds - Array of availability IDs
   * @returns {Promise<Object>} Generated slots
   */
  async generateSlotsFromAvailabilities(availabilityIds) {
    try {
      const response = await fetch(`${API_BASE_URL}/availability/slots/from-availabilities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ availabilityIds }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: data.success || true,
        slots: data.slots || [],
        totalSlots: data.totalSlots || 0,
        availableSlots: data.availableSlots || 0,
      };
    } catch (error) {
      console.error('Error generating slots from availabilities:', error);
      throw error;
    }
  }

  /**
   * Get available slots (filtered)
   * Backend: GET /availability/slots/available
   * @param {string} tutorId - Optional tutor ID
   * @param {string} startDate - Optional start date
   * @param {string} endDate - Optional end date
   * @returns {Promise<Object>} Available slots
   */
  async getAvailableSlots(tutorId = null, startDate = null, endDate = null) {
    try {
      const url = new URL(`${API_BASE_URL}/availability/slots/available`);
      if (tutorId) url.searchParams.append('tutorId', tutorId);
      if (startDate) url.searchParams.append('startDate', startDate);
      if (endDate) url.searchParams.append('endDate', endDate);

      const response = await fetch(url.toString(), {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: data.success || true,
        slots: data.slots || [],
        groupedByDate: data.groupedByDate || {},
        totalSlots: data.totalSlots || 0,
        totalDays: data.totalDays || 0,
      };
    } catch (error) {
      console.error('Error getting available slots:', error);
      throw error;
    }
  }

  /**
   * Validate a slot for booking
   * Backend: POST /availability/slots/validate
   * @param {string} parentAvailabilityId - Parent availability ID
   * @param {number} slotIndex - Slot index
   * @returns {Promise<Object>} Validation result
   */
  async validateSlot(parentAvailabilityId, slotIndex) {
    try {
      const response = await fetch(`${API_BASE_URL}/availability/slots/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ parentAvailabilityId, slotIndex }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: data.success || true,
        isValid: data.isValid || false,
        errors: data.errors || [],
        slot: data.slot || null,
      };
    } catch (error) {
      console.error('Error validating slot:', error);
      throw error;
    }
  }

  /**
   * Check slot availability in real time
   * Backend: POST /availability/slots/check-availability
   * @param {string} tutorId - Tutor ID
   * @param {string} parentAvailabilityId - Parent availability ID
   * @param {number} slotIndex - Slot index
   * @returns {Promise<Object>} Real-time availability check
   */
  async checkSlotAvailability(tutorId, parentAvailabilityId, slotIndex) {
    try {
      const response = await fetch(`${API_BASE_URL}/availability/slots/check-availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ tutorId, parentAvailabilityId, slotIndex }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: data.success || true,
        available: data.available || false,
        reason: data.reason || '',
        booking: data.booking || null,
        slot: data.slot || null,
      };
    } catch (error) {
      console.error('Error checking slot availability:', error);
      throw error;
    }
  }

  /**
   * Get consecutive available slots
   * Backend: POST /availability/slots/consecutive
   * @param {string} tutorId - Tutor ID
   * @param {number} count - Number of consecutive slots needed
   * @param {string} startDate - Optional start date
   * @param {string} endDate - Optional end date
   * @returns {Promise<Object>} Consecutive slots groups
   */
  async getConsecutiveSlots(tutorId, count, startDate = null, endDate = null) {
    try {
      const body = { tutorId, count };
      if (startDate) body.startDate = startDate;
      if (endDate) body.endDate = endDate;

      const response = await fetch(`${API_BASE_URL}/availability/slots/consecutive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: data.success || true,
        consecutiveGroups: data.consecutiveGroups || [],
        totalGroups: data.totalGroups || 0,
        slotsPerGroup: data.slotsPerGroup || count,
      };
    } catch (error) {
      console.error('Error getting consecutive slots:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const AvailabilityService = new AvailabilityServiceClass();
export default AvailabilityService;

