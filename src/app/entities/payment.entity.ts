/**
 * Core Payment interface representing a payment transaction.
 * This is the main payment object used throughout the application.
 */
export interface Payment {
  // Core identification
  id?: string;
  
  // Payment details
  amount: number;
  currency: string;
  method: string;
  gatewayProvider: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | string;
  
  // Transaction reference
  transactionId: string;
  sessionId: string;
  
  // Participants
  studentEmail: string;
  tutorEmail: string;
  
  // Payment context
  subject?: string;
  
  // Timestamps
  paymentDate: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Extended payment with additional data.
 * This is used for detailed payment information that's not always needed.
 */
export interface PaymentDetails extends Payment {
  // Additional participant information
  studentName?: string;
  tutorName?: string;
  
  // Payment status boolean (for UI compatibility)
  isPaid?: boolean;
  
  // Raw data storage (for debugging/audit)
  raw?: any;
  
  // Legacy fields (for backward compatibility)
  transactionID?: string; // Alternative naming
  date_payment?: Date; // Alternative naming
  created_at?: Date; // Alternative naming
  completed_at?: Date; // Alternative naming
  pagado?: boolean; // Alternative naming
}
  