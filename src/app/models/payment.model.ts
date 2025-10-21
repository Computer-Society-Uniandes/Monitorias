export interface Payment {
    id?: string;
    amount: number;
    currency: string;
    method: string;
    gatewayProvider: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded' | string;
    sessionId: string;
    transactionID: string; // Keep both naming conventions for compatibility
    transactionId?: string; // Alternative naming used in implementation
    studentEmail: string;
    studentName?: string; // Student name for payment context
    tutorEmail: string;
    tutorName?: string; // Tutor name for payment context
    subject?: string; // Subject for payment context
    date_payment?: Date; // Primary date field used in implementation
    created_at?: Date; // Legacy field for backward compatibility
    completedAt?: Date;
    completed_at?: Date; // Alternative naming used in implementation
    pagado?: boolean; // Payment status boolean used in implementation
    raw?: any; // Raw data storage used in implementation
  }
  