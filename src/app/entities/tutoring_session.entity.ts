/**
 * Core TutoringSession interface representing a tutoring session.
 * This is the main session object used throughout the application.
 */
export interface TutoringSession {
  // Core identification
  id?: string;
  
  // Participants
  studentName: string;
  studentEmail: string;
  tutorName: string;
  tutorEmail: string;
  
  // Session details
  subject: string;
  price: number;
  notes?: string;
  location?: string;
  
  // Status management
  status: 'scheduled' | 'completed' | 'cancelled' | 'pending' | 'rejected' | 'en_verificación';
  tutorApprovalStatus?: 'approved' | 'rejected' | 'pending';
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'cancelled' | 'en_verificación';
  
  // Scheduling
  scheduledDateTime: Date;
  endDateTime: Date;
  requestedAt: Date;
  acceptedAt?: Date;
  
  // Slot management
  parentAvailabilityId?: string;
  slotId?: string;
  slotIndex?: number;
  requiresApproval?: boolean;
  
  // Calendar integration
  googleEventId?: string;
  calicoCalendarEventId?: string;
  calicoCalendarHtmlLink?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Extended tutoring session with additional data.
 * This is used for detailed session information that's not always needed.
 */
export interface TutoringSessionDetails extends TutoringSession {
  // Payment proof
  paymentProof?: PaymentProof;
  
  // Reviews
  reviews?: SessionReview[];
  
  // Rescheduling data
  oldDateTime?: Date;
  newDateTime?: Date;
  reason?: string;
  
  // Legacy payment proof fields (for backward compatibility)
  paymentProofFileId?: string;
  paymentProofFileName?: string;
  paymentProofUrl?: string;
  paymentProofThumbnail?: string;
}

/**
 * Payment proof data structure.
 * This is used for storing payment verification information.
 */
export interface PaymentProof {
  url?: string;
  fileName?: string;
  amountSent?: number;
  senderName?: string;
  transactionNumber?: string;
  submittedAt?: Date;
}

/**
 * Session review data structure.
 * This is used for storing reviews within a session.
 */
export interface SessionReview {
  id?: string;
  reviewerEmail: string;
  reviewerName: string;
  stars: number;
  comment?: string;
  createdAt: Date;
}
  