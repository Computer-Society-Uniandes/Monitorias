/**
 * Services Layer - Centralized Export
 * 
 * Import services from this file for better organization:
 * import { UserService, TutoringSessionService } from '@/app/services';
 */

// Core Services (refactored to use Repository pattern)
export { UserService } from './core/UserService';
export { TutoringSessionService } from './core/TutoringSessionService';
export { UserProfileService } from './core/UserProfileService';
export { AvailabilityService } from './core/AvailabilityService';
export { FavoritesService } from './core/FavoritesService';
export { NotificationService } from './core/NotificationService';
export { PaymentService } from './core/PaymentService';

// Integration Services
export { CalendarAuthService } from './integrations/CalendarAuthService';
export { CalicoCalendarService } from './integrations/CalicoCalendarService';
export { GoogleCalendarService } from './integrations/GoogleCalendarService';
export { GoogleDriveService } from './integrations/GoogleDriveService';

// Utils Services (refactored to use Repository pattern)
export { default as TutoringHistoryService } from './utils/TutoringHistoryService';
export { FirebaseAvailabilityService } from './utils/FirebaseAvailabilityService';
export { AuthService } from './utils/AuthService';
export { TutorSearchService } from './utils/TutorSearchService';

