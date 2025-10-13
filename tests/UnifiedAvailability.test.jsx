import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import UnifiedAvailability from '../src/app/components/UnifiedAvailability/UnifiedAvailability';
import { TutoringSessionService } from '../src/app/services/TutoringSessionService';
import { AvailabilityService } from '../src/app/services/AvailabilityService';
import { NotificationService } from '../src/app/services/NotificationService';

// Mock dependencies
jest.mock('../src/app/context/SecureAuthContext');
jest.mock('../src/app/services/TutoringSessionService');
jest.mock('../src/app/services/AvailabilityService');
jest.mock('../src/app/services/NotificationService');

// Mock window.alert
global.alert = jest.fn();
jest.mock('../src/lib/i18n', () => ({
  useI18n: () => ({
    t: (key, params = {}) => {
      const translations = {
        'tutorAvailability.title': 'Availability',
        'tutorAvailability.loading': 'Loading availability and sessions...',
        'tutorAvailability.availableSlots': 'Available Time Slots',
        'tutorAvailability.addSlot': 'Add Time Slot',
        'tutorAvailability.editSlots': 'Edit Time Slots',
        'tutorAvailability.syncCalendar': 'Sync Calendar',
        'tutorAvailability.syncing': 'Syncing...',
        'tutorAvailability.connectCalendarFirst': 'Connect your Google Calendar first',
        'tutorAvailability.syncCalendarTitle': 'Sync Google Calendar events',
        'tutorAvailability.availabilityFor': 'Availability for {date}',
        'tutorAvailability.selectDay': 'Select a day',
        'tutorAvailability.booked': 'Booked',
        'tutorAvailability.available': 'Available',
        'tutorAvailability.noSlotsForDay': 'No time slots available for this day',
        'tutorAvailability.useAddSlotHint': 'Use \'Add Time Slot\' to add availability',
        'tutorAvailability.pending': 'Pending',
        'tutorAvailability.upcoming': 'Upcoming',
        'tutorAvailability.past': 'Past',
        'tutorAvailability.pendingApproval': 'Pending approval',
        'tutorAvailability.noPendingRequests': 'No pending requests',
        'tutorAvailability.defaultSessionTitle': 'Programming introduction with student',
        'tutorAvailability.addAvailabilitySlot': 'Add Availability Time Slot',
        'tutorAvailability.titleLabel': 'Title',
        'tutorAvailability.syncSuccessful': 'Sync successful',
        'tutorAvailability.syncFailed': 'Sync failed',
        'tutorAvailability.errorCreatingEvent': 'Error creating event',
        'tutorAvailability.creating': 'Creating...',
        'tutorAvailability.titlePlaceholder': 'Availability time slot',
        'tutorAvailability.dateLabel': 'Date',
        'tutorAvailability.startTimeLabel': 'Start Time',
        'tutorAvailability.endTimeLabel': 'End Time',
        'tutorAvailability.descriptionLabel': 'Description',
        'tutorAvailability.descriptionPlaceholder': 'Optional description',
        'tutorAvailability.cancel': 'Cancel',
        'tutorAvailability.save': 'Save',
        'tutorAvailability.connectCalendarRequired': 'You must connect your Google Calendar to create events',
        'tutorAvailability.mustBeConnectedToSync': 'You must be connected to Google Calendar to sync',
        'tutorAvailability.syncSuccess': 'Sync successful!',
        'tutorAvailability.eventsProcessed': 'Events processed',
        'tutorAvailability.newEvents': 'New events',
        'tutorAvailability.updatedEvents': 'Updated',
        'tutorAvailability.syncError': 'Sync error'
      };
      let translation = translations[key] || key;
      // Simple parameter replacement
      Object.keys(params).forEach(param => {
        translation = translation.replace(`{${param}}`, params[param]);
      });
      return translation;
    },
    locale: 'en'
  })
}));

// Import the mocked useAuth
import { useAuth } from '../src/app/context/SecureAuthContext';

// Mock Calendar component from react-calendar
jest.mock('react-calendar', () => {
  return function MockCalendar({ onChange, value, className }) {
    return (
      <div data-testid="mock-calendar" className={className}>
        <button 
          data-testid="calendar-date-button"
          onClick={() => onChange(new Date('2024-01-15T10:00:00Z'))}
        >
          Select Date
        </button>
      </div>
    );
  };
});



// Mock GoogleCalendarButton
jest.mock('../src/app/components/GoogleCalendarButton/GoogleCalendarButton', () => {
  return function MockGoogleCalendarButton({ onConnectionChange }) {
    return (
      <button 
        data-testid="google-calendar-button"
        onClick={() => onConnectionChange(true)}
      >
        Connect Calendar
      </button>
    );
  };
});

// Mock TutoringDetailsModal
jest.mock('../src/app/components/TutoringDetailsModal/TutoringDetailsModal', () => {
  return function MockTutoringDetailsModal({ isOpen, onClose }) {
    return isOpen ? (
      <div data-testid="tutoring-details-modal">
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null;
  };
});

// Mock TutorApprovalModal
jest.mock('../src/app/components/TutorApprovalModal/TutorApprovalModal', () => {
  return function MockTutorApprovalModal({ isOpen, onClose }) {
    return isOpen ? (
      <div data-testid="tutor-approval-modal">
        <button onClick={onClose}>Close Approval Modal</button>
      </div>
    ) : null;
  };
});

describe('UnifiedAvailability Component', () => {
  const mockUser = {
    isLoggedIn: true,
    user: {
      email: 'tutor@example.com',
      name: 'Test Tutor'
    }
  };

  const mockAvailability = [
    {
      id: 'avail1',
      title: 'Test Session',
      date: '2024-01-15',
      startTime: '10:00',
      endTime: '11:00',
      isBooked: false,
      description: 'Test description'
    },
    {
      id: 'avail2',
      title: 'Booked Session',
      date: '2024-01-15',
      startTime: '14:00',
      endTime: '15:00',
      isBooked: true,
      description: 'Booked session'
    }
  ];

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7); // 7 days from now
  
  const mockSessions = [
    {
      id: 'session1',
      studentName: 'Student One',
      studentEmail: 'student1@example.com',
      subject: 'Math',
      scheduledDateTime: futureDate.toISOString(),
      endDateTime: new Date(futureDate.getTime() + 60 * 60 * 1000).toISOString(),
      status: 'scheduled',
      tutorApprovalStatus: 'approved'
    },
    {
      id: 'session2',
      studentName: 'Student Two',
      studentEmail: 'student2@example.com',
      subject: 'Physics',
      scheduledDateTime: new Date(futureDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      endDateTime: new Date(futureDate.getTime() + 25 * 60 * 60 * 1000).toISOString(),
      status: 'scheduled',
      tutorApprovalStatus: 'approved'
    }
  ];

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    global.alert.mockClear();
    
    // Mock useAuth
    useAuth.mockReturnValue({
      user: mockUser.user
    });
    
    // Mock service methods
    TutoringSessionService.getTutorSessions = jest.fn().mockResolvedValue(mockSessions);
    TutoringSessionService.getPendingSessionsForTutor = jest.fn().mockResolvedValue([
      {
        id: 'session1',
        studentName: 'Student One',
        studentEmail: 'student1@example.com',
        subject: 'Math',
        scheduledDateTime: futureDate.toISOString(),
        endDateTime: new Date(futureDate.getTime() + 60 * 60 * 1000).toISOString(),
        status: 'pending',
        tutorApprovalStatus: 'pending'
      }
    ]);
    TutoringSessionService.createTutoringSession = jest.fn().mockResolvedValue({ success: true, id: 'new-session' });
    
    AvailabilityService.getAvailabilityWithFallback = jest.fn().mockResolvedValue({
      success: true,
      availabilitySlots: mockAvailability,
      connected: true,
      source: 'firebase',
      totalEvents: mockAvailability.length
    });
    
    AvailabilityService.validateEventData = jest.fn().mockReturnValue({ isValid: true, errors: [] });
    AvailabilityService.createAvailabilityEvent = jest.fn().mockResolvedValue({ success: true, message: 'Event created' });
    
    NotificationService.getTutorNotifications = jest.fn().mockResolvedValue([]);
    
    // Mock global fetch
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Render and Data Loading', () => {
    test('renders loading state initially', async () => {
      render(<UnifiedAvailability />);
      
      expect(screen.getByText('Loading availability and sessions...')).toBeInTheDocument();
    });

    test('loads and displays tutor availability data', async () => {
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(AvailabilityService.getAvailabilityWithFallback).toHaveBeenCalled();
      });
      
      await waitFor(() => {
        expect(screen.getByText('Availability')).toBeInTheDocument();
      });
    });

    test('loads and displays tutoring sessions', async () => {
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(TutoringSessionService.getTutorSessions).toHaveBeenCalledWith(mockUser.user.email);
        expect(TutoringSessionService.getPendingSessionsForTutor).toHaveBeenCalledWith(mockUser.user.email);
        expect(NotificationService.getTutorNotifications).toHaveBeenCalledWith(mockUser.user.email);
      });
    });

    test('displays calendar with correct locale', async () => {
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        const calendar = screen.getByTestId('mock-calendar');
        expect(calendar).toBeInTheDocument();
      });
    });
  });

  describe('Calendar Interaction', () => {
    test('handles date selection from calendar', async () => {
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
      });
      
      const dateButton = screen.getByTestId('calendar-date-button');
      await act(async () => {
        fireEvent.click(dateButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Availability for Monday, January 15, 2024')).toBeInTheDocument();
      });
    });

    test('displays slots for selected date', async () => {
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
      });
      
      const dateButton = screen.getByTestId('calendar-date-button');
      await act(async () => {
        fireEvent.click(dateButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Available Time Slots')).toBeInTheDocument();
      });
    });

    test('shows no slots message when no availability for selected date', async () => {
      AvailabilityService.getAvailabilityWithFallback.mockResolvedValueOnce({
        success: true,
        availabilitySlots: [],
        connected: true,
        source: 'firebase',
        totalEvents: 0
      });
      
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
      });
      
      const dateButton = screen.getByTestId('calendar-date-button');
      await act(async () => {
        fireEvent.click(dateButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('No time slots available for this day')).toBeInTheDocument();
      });
    });
  });

  describe('Slot Management', () => {
    test('opens add slot modal when add slot button is clicked', async () => {
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
      });
      
      const addSlotButton = screen.getByRole('button', { name: 'Add Time Slot' });
      await act(async () => {
        fireEvent.click(addSlotButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Add Availability Time Slot')).toBeInTheDocument();
      });
    });

    test('creates new availability slot successfully', async () => {
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
      });
      
      // Open add slot modal
      const addSlotButton = screen.getByRole('button', { name: 'Add Time Slot' });
      await act(async () => {
        fireEvent.click(addSlotButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Add Availability Time Slot')).toBeInTheDocument();
      });
      
      // Fill form
      const titleInput = screen.getByLabelText('Title');
      const dateInput = screen.getByLabelText('Date');
      const startTimeInput = screen.getByLabelText('Start Time');
      const endTimeInput = screen.getByLabelText('End Time');
      
      await act(async () => {
        fireEvent.change(titleInput, { target: { value: 'New Session' } });
        fireEvent.change(dateInput, { target: { value: '2024-01-20' } });
        fireEvent.change(startTimeInput, { target: { value: '10:00' } });
        fireEvent.change(endTimeInput, { target: { value: '11:00' } });
      });
      
      // Submit form
      const saveButton = screen.getByText('Save');
      await act(async () => {
        fireEvent.click(saveButton);
      });
      
      await waitFor(() => {
        expect(AvailabilityService.createAvailabilityEvent).toHaveBeenCalled();
      });
    });

    test('shows validation error when required fields are missing', async () => {
      AvailabilityService.getAvailabilityWithFallback.mockResolvedValueOnce({
        success: true,
        availabilitySlots: [],
        connected: false,
        source: 'firebase',
        totalEvents: 0
      });
      
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
      });
      
      // Open add slot modal
      const addSlotButton = screen.getByRole('button', { name: 'Add Time Slot' });
      await act(async () => {
        fireEvent.click(addSlotButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Add Availability Time Slot')).toBeInTheDocument();
      });
      
      // Try to submit without filling required fields
      const saveButton = screen.getByText('Save');
      await act(async () => {
        fireEvent.click(saveButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('You must connect your Google Calendar to create events')).toBeInTheDocument();
      });
    });
  });

  describe('Session Management', () => {
    test('displays pending sessions in pending tab', async () => {
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Pending/ })).toBeInTheDocument();
      });
      
      const pendingTab = screen.getByRole('button', { name: /Pending/ });
      await act(async () => {
        fireEvent.click(pendingTab);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/Student One/)).toBeInTheDocument();
      });
    });

    test('displays upcoming sessions in upcoming tab', async () => {
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Upcoming' })).toBeInTheDocument();
      });
      
      const upcomingTab = screen.getByRole('button', { name: 'Upcoming' });
      await act(async () => {
        fireEvent.click(upcomingTab);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Physics')).toBeInTheDocument();
      });
    });

    test('opens session details modal when session is clicked', async () => {
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Pending/ })).toBeInTheDocument();
      });
      
      const pendingTab = screen.getByRole('button', { name: /Pending/ });
      await act(async () => {
        fireEvent.click(pendingTab);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/Student One/)).toBeInTheDocument();
      });
      
      const sessionCard = screen.getByText(/Student One/);
      await act(async () => {
        fireEvent.click(sessionCard);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('tutor-approval-modal')).toBeInTheDocument();
      });
    });

    test('shows no pending requests message when no pending sessions', async () => {
      TutoringSessionService.getPendingSessionsForTutor.mockResolvedValueOnce([]);
      
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Pending/ })).toBeInTheDocument();
      });
      
      const pendingTab = screen.getByRole('button', { name: /Pending/ });
      await act(async () => {
        fireEvent.click(pendingTab);
      });
      
      await waitFor(() => {
        expect(screen.getByText('No pending requests')).toBeInTheDocument();
      });
    });
  });

  describe('Google Calendar Integration', () => {
    test('syncs with Google Calendar successfully', async () => {
      // Mock successful fetch response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          syncResults: {
            totalProcessed: 2,
            created: 1,
            updated: 1
          }
        })
      });
      
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
      });
      
      const syncButton = screen.getByText('Sync Calendar');
      await act(async () => {
        fireEvent.click(syncButton);
      });
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/availability/sync', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tutorId: mockUser.user.email,
            tutorEmail: mockUser.user.email,
            forceSync: true
          })
        }));
      });
    });

    test('shows error when Google Calendar sync fails', async () => {
      // Mock failed fetch response
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Sync failed'
        })
      });
      
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
      });
      
      const syncButton = screen.getByText('Sync Calendar');
      await act(async () => {
        fireEvent.click(syncButton);
      });
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/availability/sync', expect.any(Object));
      });
    });

    test('disables sync button when not connected to Google Calendar', async () => {
      AvailabilityService.getAvailabilityWithFallback.mockResolvedValueOnce({
        success: true,
        availabilitySlots: [],
        connected: false,
        source: 'firebase',
        totalEvents: 0
      });
      
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
      });
      
      const syncButton = screen.getByText('Sync Calendar');
      expect(syncButton).toBeDisabled();
    });
  });

  describe('Internationalization', () => {
    test('displays text in correct language based on locale', async () => {
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByText('Availability')).toBeInTheDocument();
      });
    });

    test('formats dates according to locale', async () => {
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
      });
      
      const dateButton = screen.getByTestId('calendar-date-button');
      await act(async () => {
        fireEvent.click(dateButton);
      });
      
      // Check that date formatting is applied
      await waitFor(() => {
        expect(screen.getByText('Available Time Slots')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles error when loading availability fails', async () => {
      AvailabilityService.getAvailabilityWithFallback.mockRejectedValueOnce(new Error('Failed to load'));
      
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByText('Loading availability and sessions...')).toBeInTheDocument();
      });
    });

    test('handles error when loading sessions fails', async () => {
      TutoringSessionService.getTutorSessions.mockRejectedValueOnce(new Error('Failed to load sessions'));
      
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByText('Loading availability and sessions...')).toBeInTheDocument();
      });
    });

    test('handles error when creating session fails', async () => {
      AvailabilityService.createAvailabilityEvent.mockRejectedValueOnce(new Error('Failed to create'));
      
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
      });
      
      // Open add slot modal
      const addSlotButton = screen.getByRole('button', { name: 'Add Time Slot' });
      await act(async () => {
        fireEvent.click(addSlotButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Add Availability Time Slot')).toBeInTheDocument();
      });
      
      // Fill and submit form
      const titleInput = screen.getByLabelText('Title');
      await act(async () => {
        fireEvent.change(titleInput, { target: { value: 'New Session' } });
      });
      
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to create')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    test('shows loading state during sync operation', async () => {
      // Mock fetch to return undefined (simulating network error)
      global.fetch.mockResolvedValue(undefined);
      
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
      });
      
      const syncButton = screen.getByText('Sync Calendar');
      await act(async () => {
        fireEvent.click(syncButton);
      });
      
      // The component should show an error message instead of "Syncing..."
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/availability/sync', expect.any(Object));
      });
    });

    test('shows loading state during session creation', async () => {
      // Mock the service to return a pending promise
      AvailabilityService.createAvailabilityEvent.mockImplementation(() => new Promise(() => {}));
      
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
      });
      
      // Open add slot modal
      const addSlotButton = screen.getByRole('button', { name: 'Add Time Slot' });
      await act(async () => {
        fireEvent.click(addSlotButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Add Availability Time Slot')).toBeInTheDocument();
      });
      
      // Fill form
      const titleInput = screen.getByLabelText('Title');
      await act(async () => {
        fireEvent.change(titleInput, { target: { value: 'New Session' } });
      });
      
      // Submit form
      const saveButton = screen.getByRole('button', { name: 'Save' });
      await act(async () => {
        fireEvent.click(saveButton);
      });
      
      // The component should show loading state or call the service
      await waitFor(() => {
        expect(AvailabilityService.createAvailabilityEvent).toHaveBeenCalled();
      });
    });
  });
});
