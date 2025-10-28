/**
 * Core SlotBooking interface representing a booked time slot.
 * This is the main slot booking object used throughout the application.
 */
export interface SlotBooking {
  // Core identification
  id?: string;
  
  // Slot identification
  parentAvailabilityId: string;
  slotId: string;
  slotIndex: number;
  
  // Session reference
  sessionId: string;
  
  // Participants
  studentEmail: string;
  tutorEmail: string;
  
  // Session details
  subject: string;
  
  // Time information
  slotStartTime: Date;
  slotEndTime: Date;
  
  // Booking metadata
  bookedAt: Date;
  bookedBy?: string; // Who made the booking
  
  // Timestamps
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Extended slot booking with additional data.
 * This is used for detailed slot booking information that's not always needed.
 */
export interface SlotBookingDetails extends SlotBooking {
  // Additional booking reference
  bookId?: string; // Booking reference ID
  
  // Alternative time naming (for backward compatibility)
  startTime?: Date;
  endTime?: Date;
  
  // Legacy timestamp field (for backward compatibility)
  created_at?: Date;
}
  