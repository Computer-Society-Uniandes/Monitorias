/**
 * Core Notification interface representing a system notification.
 * This is the main notification object used throughout the application.
 */
export interface Notification {
  // Core identification
  id?: string;
  
  // Notification content
  title: string;
  message: string;
  type: 'session_request' | 'session_approved' | 'session_rejected' | 'session_cancelled' | 'session_rescheduled' | 'payment_reminder' | 'payment_verified' | 'general' | string;
  
  // Read status
  isRead: boolean;
  readAt?: Date;
  
  // Participants
  studentEmail: string;
  tutorEmail: string;
  
  // Session context
  sessionId?: string;
  subject?: string;
  scheduledDateTime?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Extended notification with additional data.
 * This is used for detailed notification information that's not always needed.
 */
export interface NotificationDetails extends Notification {
  // Additional participant information
  studentName?: string;
  tutorName?: string;
  
  // Rescheduling notification fields
  oldDateTime?: Date; // Original scheduled time for rescheduling notifications
  newDateTime?: Date; // New scheduled time for rescheduling notifications
  reason?: string; // Reason for rescheduling or cancellation
  
  // Alternative naming (for backward compatibility)
  read?: boolean; // Alternative naming for isRead
  created_at?: Date; // Alternative naming for createdAt
}
  