/**
 * Representa una sesión de tutoria entre un tutor y un estudiante.
 */
export interface TutoringSession {
    id?: string;
    studentName: string;
    tutorName: string;
    studentEmail: string;
    tutorEmail: string;
    subject: string;
    price: number;
    status: 'scheduled' | 'completed' | 'cancelled' | 'pending' | 'rejected' | 'en_verificación';
    tutorApprovalStatus?: 'approved' | 'rejected' | 'pending';
    paymentStatus?: 'pending' | 'paid' | 'failed' | 'cancelled' | 'en_verificación';
    notes?: string;
    location?: string;
    parentAvailabilityId?: string;
    slotId?: string;
    slotIndex?: number;
    requiresApproval?: boolean; // Whether session requires tutor approval
    requestedAt: Date;
    acceptedAt?: Date;
    scheduledDateTime: Date;
    endDateTime: Date;
    googleEventId?: string;
    calicoCalendarEventId?: string;
    calicoCalendarHtmlLink?: string;
    paymentProof?: PaymentProof; // Consolidated payment proof object
    paymentProofFileId?: string; // Legacy field for backward compatibility
    paymentProofFileName?: string; // Legacy field for backward compatibility
    paymentProofUrl?: string; // Legacy field for backward compatibility
    paymentProofThumbnail?: string; // Legacy field for backward compatibility
    reviews?: Review[]; // Array of reviews for this session
    oldDateTime?: Date; // For rescheduling - original scheduled time
    newDateTime?: Date; // For rescheduling - new scheduled time
    reason?: string; // Reason for rescheduling or cancellation
    created_at: Date;
    updatedAt?: Date;
  }

  // Supporting interfaces for TutoringSession model
  export interface PaymentProof {
    url?: string;
    fileName?: string;
    amountSent?: number;
    senderName?: string;
    transactionNumber?: string;
    submittedAt?: Date;
  }

  export interface Review {
    id?: string;
    reviewerEmail: string;
    reviewerName: string;
    stars: number;
    comment?: string;
    createdAt: Date;
  }
  