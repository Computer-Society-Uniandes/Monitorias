/**
 * Core User interface representing a tutor or student.
 */
export interface User {
  // Core identification fields
  id?: string;
  uid?: string; // Firebase Auth UID
  email: string;
  name: string;
  displayName?: string; // Firebase Auth display name
  
  // Authentication and role
  isLoggedIn: boolean;
  isTutor: boolean;
  role: 'tutor' | 'student' | 'admin';
  
  // Profile information
  phoneNumber?: string;
  bio?: string;
  profileImage?: string;
  major?: string;
  
  // Tutor-specific fields (only relevant when isTutor is true)
  subjects?: string[];
  hourlyRate?: number;
  rating?: number;
  totalSessions?: number;
  
  // Favorites (simplified)
  favoriteCourses?: string[];
  favoriteTutors?: string[];
  
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Extended user profile with additional data fetched separately.
 * This is used for detailed user information that's not always needed.
 */
export interface UserProfile extends User {
  // Additional profile data
  reviews?: UserReview[];
  weeklyPerformance?: WeeklyPerformance[];
  sessionStats?: SessionStats;
}

/**
 * User review data structure.
 * This is typically stored in tutoring sessions, not directly in user objects.
 */
export interface UserReview {
  id?: string;
  reviewerEmail: string;
  reviewerName: string;
  stars: number;
  comment?: string;
  createdAt: Date;
}

/**
 * Weekly performance data for tutors.
 * This is calculated and stored separately from the core user object.
 */
export interface WeeklyPerformance {
  week: string;
  sessionsCompleted: number;
  earnings: number;
  rating: number;
}

/**
 * Session statistics for tutors.
 * This is calculated and stored separately from the core user object.
 */
export interface SessionStats {
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  averageRating: number;
  totalEarnings: number;
}
  