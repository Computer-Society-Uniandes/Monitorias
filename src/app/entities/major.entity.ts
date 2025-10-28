/**
 * Core Major interface representing an academic major/program.
 * This is the main major object used throughout the application.
 */
export interface Major {
  // Core identification
  id: string;
  code: string;
  name: string;
  
  // Academic information
  description: string;
  department: string;
  duration: number; // Duration in semesters/years
  
  // Course management
  courses: string[]; // Array of course IDs
  
  // Status
  isActive: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Extended major with additional data.
 * This is used for detailed major information that's not always needed.
 */
export interface MajorDetails extends Major {
  // Additional academic information
  prerequisites?: string[]; // Required prerequisites
  careerPaths?: string[]; // Potential career paths
  difficulty?: 'Basic' | 'Intermediate' | 'Advanced';
  
  // Administrative data
  coordinator?: string; // Major coordinator
  requirements?: string; // Additional requirements
  
  // Legacy fields (for backward compatibility)
  is_active?: boolean; // Alternative naming
  created_at?: Date; // Alternative naming
  updated_at?: Date; // Alternative naming
}
  