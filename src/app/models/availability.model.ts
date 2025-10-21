export interface Availability {
    id?: string;
    title: string;
    description?: string;
    color?: string;
    location?: string;
    tutorId: string;
    tutorEmail: string;
    subject?: string; // Subject/matter for this availability
    sourceCalendarId?: string;
    sourceCalendarName?: string;
    googleEventId?: string;
    htmlLink?: string;
    fromAvailabilityCalendar: boolean;
    recurring: boolean;
    recurrenceRule?: string;
    status: 'confirmed' | 'cancelled' | 'tentative' | string;
    startDateTime: Date;
    endDateTime: Date;
    syncedAt?: Date;
    // Slot management fields
    isBooked?: boolean; // Whether this availability slot is booked
    slotIndex?: number; // Index of the slot within the availability
    parentAvailabilityId?: string; // ID of the parent availability for slots
    // Additional fields for compatibility
    day?: string; // Formatted day name (e.g., "Lunes")
    startTime?: string; // Formatted start time (e.g., "09:00")
    endTime?: string; // Formatted end time (e.g., "10:00")
    date?: string; // Formatted date (e.g., "2024-01-15")
    created_at: Date;
    updatedAt?: Date;
  }
  