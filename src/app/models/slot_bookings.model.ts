export interface SlotBooking {
    id?: string;
    bookedAt: Date;
    created_at: Date;
    updatedAt?: Date;
    parentAvailabilityId: string;
    sessionId: string;
    slotId: string;
    slotIndex: number;
    slotStartTime: Date;
    slotEndTime: Date;
    startTime?: Date; // Alternative naming used in implementation
    endTime?: Date; // Alternative naming used in implementation
    studentEmail: string;
    tutorEmail: string;
    subject: string;
    bookedBy?: string; // Optional field for tracking who made the booking
    bookId?: string; // Optional field for booking reference
  }
  