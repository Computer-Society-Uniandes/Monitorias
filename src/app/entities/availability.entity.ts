/**
 * Core Availability interface representing a tutor's available time slot.
 * This is the main availability object used throughout the application.
 */
export interface Availability {
  // Core identification
  id?: string;
  title: string;
  description?: string;
  
  // Tutor information
  tutorId: string;
  tutorEmail: string;
  subject?: string;
  
  // Time information
  startDateTime: Date;
  endDateTime: Date;
  recurring: boolean;
  recurrenceRule?: string;
  
  // Calendar integration
  sourceCalendarId?: string;
  sourceCalendarName?: string;
  googleEventId?: string;
  htmlLink?: string;
  fromAvailabilityCalendar: boolean;
  
  // Status and metadata
  status: 'confirmed' | 'cancelled' | 'tentative' | string;
  color?: string;
  location?: string;
  syncedAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Availability slot for booking management.
 * This represents an individual bookable slot within an availability.
 */
export interface AvailabilitySlot {
  id: string;
  parentAvailabilityId: string;
  slotIndex: number;
  tutorId: string;
  tutorEmail: string;
  subject?: string;
  startDateTime: Date;
  endDateTime: Date;
  location?: string;
  googleEventId?: string;
  htmlLink?: string;
  status: 'confirmed' | 'cancelled' | 'tentative' | string;
  isBooked: boolean;
  bookedBy?: string;
  sessionId?: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Extended availability with additional data and compatibility fields.
 * This is used for detailed availability information and frontend compatibility.
 */
export interface AvailabilityDetails extends Availability {
  // Slot management (for backward compatibility)
  isBooked?: boolean;
  slotIndex?: number;
  parentAvailabilityId?: string;
  
  // Computed fields for frontend display
  day?: string; // Formatted day name (e.g., "Lunes")
  startTime?: string; // Formatted start time (e.g., "09:00")
  endTime?: string; // Formatted end time (e.g., "10:00")
  date?: string; // Formatted date (e.g., "2024-01-15")
  
  // Legacy field for backward compatibility
  created_at?: Date;
}
  