export interface Major {
    id: string;
    code: string;
    name: string;
    description: string;
    department: string;
    duration: number;
    courses: string[];
    is_active: boolean;
    created_at: Date;
    updated_at?: Date;
  }
  