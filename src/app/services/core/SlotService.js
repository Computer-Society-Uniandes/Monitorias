/**
 * SlotService
 * 
 * Frontend utility service for working with availability slots
 * Provides helper methods for slot manipulation, filtering, and validation
 * Complements the backend SlotService
 */

class SlotServiceClass {
  /**
   * Filter available slots (not booked and in the future)
   * @param {Array} slots - Array of slots
   * @returns {Array} Available slots
   */
  getAvailableSlots(slots) {
    const now = new Date();
    return slots.filter((slot) => {
      const slotStart = new Date(slot.startDateTime);
      const isFuture = slotStart > now;
      const isNotBooked = !slot.isBooked;
      return isFuture && isNotBooked;
    });
  }

  /**
   * Check if a specific slot is available
   * @param {Object} slot - Slot object
   * @returns {boolean} True if available
   */
  isSlotAvailable(slot) {
    const now = new Date();
    const slotStart = new Date(slot.startDateTime);
    const isFuture = slotStart > now;
    const isNotBooked = !slot.isBooked;
    return isFuture && isNotBooked;
  }

  /**
   * Group slots by date
   * @param {Array} slots - Array of slots
   * @returns {Object} Slots grouped by date { 'YYYY-MM-DD': { date: Date, slots: [] } }
   */
  groupSlotsByDate(slots) {
    const grouped = {};

    slots.forEach((slot) => {
      const date = new Date(slot.startDateTime);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const dateKey = `${y}-${m}-${d}`;

      const localMidnight = new Date(y, date.getMonth(), date.getDate());

      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: localMidnight,
          slots: [],
        };
      }

      grouped[dateKey].slots.push(slot);
    });

    // Sort slots by time within each day
    Object.keys(grouped).forEach((dateKey) => {
      grouped[dateKey].slots.sort(
        (a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
      );
    });

    return grouped;
  }

  /**
   * Format slot info for display
   * @param {Object} slot - Slot object
   * @param {string} locale - Locale for formatting (default: 'es-ES')
   * @returns {Object} Formatted slot information
   */
  formatSlotInfo(slot, locale = 'es-ES') {
    const startTime = new Date(slot.startDateTime);
    const endTime = new Date(slot.endDateTime);

    return {
      id: slot.id,
      date: startTime.toLocaleDateString(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      startTime: startTime.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
      }),
      endTime: endTime.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
      }),
      duration: '1h',
      course: slot.course,
      location: slot.location,
      description: slot.description,
      tutorId: slot.tutorId,
      tutorEmail: slot.tutorEmail,
      isAvailable: this.isSlotAvailable(slot),
      isBooked: slot.isBooked,
      bookedBy: slot.bookedBy,
    };
  }

  /**
   * Get consecutive available slots
   * @param {Array} slots - Array of slots
   * @param {number} count - Number of consecutive slots needed
   * @returns {Array} Array of consecutive slot groups [[slot1, slot2], [slot3, slot4], ...]
   */
  getConsecutiveAvailableSlots(slots, count = 1) {
    const availableSlots = this.getAvailableSlots(slots);
    const consecutiveGroups = [];

    for (let i = 0; i <= availableSlots.length - count; i++) {
      const group = [];
      let isConsecutive = true;

      for (let j = 0; j < count; j++) {
        const currentSlot = availableSlots[i + j];

        if (!currentSlot) {
          isConsecutive = false;
          break;
        }

        if (j > 0) {
          const prevSlot = availableSlots[i + j - 1];
          const currentStart = new Date(currentSlot.startDateTime);
          const prevEnd = new Date(prevSlot.endDateTime);

          // Check that they are consecutive (max 1 minute difference for tolerance)
          if (Math.abs(currentStart.getTime() - prevEnd.getTime()) > 60000) {
            isConsecutive = false;
            break;
          }
        }

        group.push(currentSlot);
      }

      if (isConsecutive && group.length === count) {
        consecutiveGroups.push(group);
      }
    }

    return consecutiveGroups;
  }

  /**
   * Validate that a slot can be booked
   * @param {Object} slot - Slot object
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  validateSlotForBooking(slot) {
    const errors = [];

    if (!slot) {
      errors.push('Slot no encontrado');
      return { isValid: false, errors };
    }

    if (slot.isBooked) {
      errors.push(`Este horario ya está reservado por ${slot.bookedBy || 'otro estudiante'}`);
    }

    const now = new Date();
    const slotStart = new Date(slot.startDateTime);

    if (slotStart <= now) {
      errors.push('No se puede reservar un horario que ya pasó');
    }

    // Verify it's not too soon (minimum 1 hour in advance)
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    if (slotStart < oneHourFromNow) {
      errors.push('Debe reservar con al menos 1 hora de anticipación');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Extract time from datetime string
   * @param {Date|string} dateTime - Date or datetime string
   * @returns {string|null} Time in HH:MM format
   */
  extractTimeFromDateTime(dateTime) {
    if (!dateTime) return null;
    const date = dateTime instanceof Date ? dateTime : new Date(dateTime);
    if (isNaN(date.getTime())) return null;
    return date.toTimeString().substring(0, 5); // Format HH:MM
  }

  /**
   * Filter future slots (exclude past dates and times)
   * @param {Array} slots - Array of slots
   * @returns {Array} Future slots
   */
  filterFutureSlots(slots) {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().substring(0, 5);

    return slots.filter((slot) => {
      const slotDate = slot.date || (slot.startDateTime ? new Date(slot.startDateTime).toISOString().split('T')[0] : null);
      const slotTime = slot.time || slot.startTime || this.extractTimeFromDateTime(slot.startDateTime);

      if (!slotDate) return false;
      if (slotDate > today) return true;
      if (slotDate === today && slotTime && slotTime >= currentTime) return true;
      return false;
    });
  }

  /**
   * Get slots for a specific date
   * @param {Array} slots - Array of slots
   * @param {Date|string} date - Date to filter by
   * @returns {Array} Slots for the specified date
   */
  getSlotsForDate(slots, date) {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const dateString = targetDate.toISOString().split('T')[0];

    return slots.filter((slot) => {
      const slotDate = new Date(slot.startDateTime).toISOString().split('T')[0];
      return slotDate === dateString;
    });
  }

  /**
   * Get slots for a specific week
   * @param {Array} slots - Array of slots
   * @param {Date|string} startDate - Start date of the week
   * @returns {Object} Slots grouped by day { 'YYYY-MM-DD': slots[] }
   */
  getSlotsForWeek(slots, startDate) {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const weekSlots = {};

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      const dayString = currentDate.toISOString().split('T')[0];

      weekSlots[dayString] = this.getSlotsForDate(slots, currentDate);
    }

    return weekSlots;
  }

  /**
   * Get slots by tutor
   * @param {Array} slots - Array of slots
   * @param {string} tutorId - Tutor ID (email)
   * @returns {Array} Slots for the specified tutor
   */
  getSlotsByTutor(slots, tutorId) {
    return slots.filter((slot) => slot.tutorId === tutorId || slot.tutorEmail === tutorId);
  }

  /**
   * Get slots by course
   * @param {Array} slots - Array of slots
   * @param {string} course - Course name
   * @returns {Array} Slots for the specified course
   */
  getSlotsByCourse(slots, course) {
    return slots.filter((slot) => 
      slot.course && slot.course.toLowerCase() === course.toLowerCase()
    );
  }

  /**
   * Get slots by course (alias for course)
   * @param {Array} slots
   * @param {string} course
   */
  getSlotsByCourse(slots, course) {
    return this.getSlotsByCourse(slots, course);
  }

  /**
   * Calculate slot duration in hours
   * @param {Object} slot - Slot object
   * @returns {number} Duration in hours
   */
  calculateSlotDuration(slot) {
    const start = new Date(slot.startDateTime);
    const end = new Date(slot.endDateTime);
    return Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
  }

  /**
   * Check if slots overlap
   * @param {Object} slot1 - First slot
   * @param {Object} slot2 - Second slot
   * @returns {boolean} True if slots overlap
   */
  doSlotsOverlap(slot1, slot2) {
    const start1 = new Date(slot1.startDateTime);
    const end1 = new Date(slot1.endDateTime);
    const start2 = new Date(slot2.startDateTime);
    const end2 = new Date(slot2.endDateTime);

    return start1 < end2 && start2 < end1;
  }

  /**
   * Merge consecutive slots into longer time blocks
   * @param {Array} slots - Array of slots (should be sorted by time)
   * @returns {Array} Array of merged time blocks
   */
  mergeConsecutiveSlots(slots) {
    if (slots.length === 0) return [];

    const sortedSlots = [...slots].sort(
      (a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
    );

    const merged = [];
    let currentBlock = { ...sortedSlots[0] };

    for (let i = 1; i < sortedSlots.length; i++) {
      const currentSlot = sortedSlots[i];
      const currentBlockEnd = new Date(currentBlock.endDateTime);
      const nextStart = new Date(currentSlot.startDateTime);

      // Check if consecutive (max 1 minute gap)
      if (Math.abs(nextStart.getTime() - currentBlockEnd.getTime()) <= 60000) {
        // Merge: extend the current block
        currentBlock.endDateTime = currentSlot.endDateTime;
        currentBlock.slotDuration = this.calculateSlotDuration(currentBlock);
      } else {
        // Not consecutive: save current block and start new one
        merged.push(currentBlock);
        currentBlock = { ...currentSlot };
      }
    }

    // Don't forget the last block
    merged.push(currentBlock);

    return merged;
  }

  /**
   * Get statistics for a set of slots
   * @param {Array} slots - Array of slots
   * @returns {Object} Statistics object
   */
  getSlotStatistics(slots) {
    const now = new Date();
    const availableSlots = slots.filter((slot) => !slot.isBooked && new Date(slot.startDateTime) > now);
    const bookedSlots = slots.filter((slot) => slot.isBooked);
    const pastSlots = slots.filter((slot) => new Date(slot.startDateTime) <= now);

    const uniqueTutors = new Set(slots.map((slot) => slot.tutorId || slot.tutorEmail));
    const uniqueCourses = new Set(slots.map((slot) => slot.course).filter(Boolean));

    return {
      totalSlots: slots.length,
      availableSlots: availableSlots.length,
      bookedSlots: bookedSlots.length,
      pastSlots: pastSlots.length,
      uniqueTutors: uniqueTutors.size,
      uniqueCourses: uniqueCourses.size,
      courses: Array.from(uniqueCourses),
      tutors: Array.from(uniqueTutors),
    };
  }
}

// Export singleton instance
export const SlotService = new SlotServiceClass();
export default SlotService;

