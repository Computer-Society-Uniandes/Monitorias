/**
 * Representa un tutor o estudiante.
 */
export interface User {
    id?: string;
    uid?: string; // Firebase Auth UID
    name: string;
    email: string; // Changed from 'mail' to 'email' for consistency
    displayName?: string; // Firebase Auth display name
    phone_number?: string;
    bio?: string;
    isTutor: boolean;
    isLoggedIn?: boolean; // Authentication status
    role: 'tutor' | 'student' | 'admin';
    profileImage?: string;
    major?: string;
    favoritesCourses?: string[];
    favoritesTutors?: string[];
    subjects?: string[];
    hourlyRate?: number;
    rating?: number;
    totalSessions?: number;
    reviews?: Review[]; // Array of reviews received
    weeklyPerformance?: WeeklyPerformance[]; // Performance data
    sessionStats?: SessionStats; // Session statistics
    created_at?: Date;
    updatedAt?: Date;
  }

  // Supporting interfaces for User model
  export interface Review {
    id?: string;
    reviewerEmail: string;
    reviewerName: string;
    stars: number;
    comment?: string;
    createdAt: Date;
  }

  export interface WeeklyPerformance {
    week: string;
    sessionsCompleted: number;
    earnings: number;
    rating: number;
  }

  export interface SessionStats {
    totalSessions: number;
    completedSessions: number;
    cancelledSessions: number;
    averageRating: number;
    totalEarnings: number;
  }
  