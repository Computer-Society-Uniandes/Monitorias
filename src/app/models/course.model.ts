export interface Course {
    id?: string;
    code: string;
    name: string;
    description: string;
    faculty: string;
    credits: number;
    difficulty: 'Basic' | 'Intermediate' | 'Advanced' | string;
    prerequisites?: string[];
  }
  