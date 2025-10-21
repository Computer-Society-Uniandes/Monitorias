export interface Notification {
    id?: string;
    title: string;
    message: string;
    type: 'session_request' | 'session_approved' | 'session_rejected' | 'session_cancelled' | 'session_rescheduled' | 'payment_reminder' | 'payment_verified' | 'general' | string;
    isRead: boolean;
    read?: boolean; // Alternative naming used in implementation
    studentEmail: string;
    studentName: string;
    tutorEmail: string;
    tutorName: string;
    subject: string;
    readAt?: Date;
    sessionId?: string;
    scheduledDateTime?: Date;
    // Rescheduling notification fields
    oldDateTime?: Date; // Original scheduled time for rescheduling notifications
    newDateTime?: Date; // New scheduled time for rescheduling notifications
    reason?: string; // Reason for rescheduling or cancellation
    created_at: Date;
    createdAt?: Date; // Alternative naming used in implementation
    updatedAt?: Date;
  }
  