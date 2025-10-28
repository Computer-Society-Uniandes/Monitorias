/**
 * Core Course interface representing an academic course.
 * This is the main course object used throughout the application.
 */
export interface Course {
  // Core identification
  id?: string;
  code: string;
  name: string;
  
  // Academic information
  description: string;
  faculty: string;
  credits: number;
  difficulty: 'Basic' | 'Intermediate' | 'Advanced';
  
  // Prerequisites
  prerequisites?: string[]; // Array of course codes that are prerequisites
  
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Extended course with additional data.
 * This is used for detailed course information that's not always needed.
 */
export interface CourseDetails extends Course {
  // Additional academic information
  objectives?: string[]; // Learning objectives
  outcomes?: string[]; // Expected learning outcomes
  methodology?: string; // Teaching methodology
  
  // Administrative data
  instructor?: string; // Course instructor
  schedule?: string; // Course schedule
  location?: string; // Course location
  
  // Assessment information
  assessment?: {
    exams?: number;
    projects?: number;
    assignments?: number;
    participation?: number;
  };
  
  // Course relationships
  relatedCourses?: string[]; // Related course codes
  majorId?: string; // Associated major ID
}
  