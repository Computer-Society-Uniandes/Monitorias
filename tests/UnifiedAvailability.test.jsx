import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import UnifiedAvailability from '../src/app/components/UnifiedAvailability/UnifiedAvailability';
import { useAuth } from '../src/app/context/SecureAuthContext';
import { TutoringSessionService } from '../src/app/services/TutoringSessionService';
import { CalicoCalendarService } from '../src/app/services/CalicoCalendarService';

// Mock dependencies
jest.mock('../src/app/context/SecureAuthContext');
jest.mock('../src/app/services/TutoringSessionService');
jest.mock('../src/app/services/CalicoCalendarService');

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
      startTime: '2024-01-15T10:00:00Z',
      endTime: '2024-01-15T11:00:00Z',
      isAvailable: true,
      description: 'Test description'
    },
    {
      id: 'avail2',
      title: 'Booked Session',
      startTime: '2024-01-15T14:00:00Z',
      endTime: '2024-01-15T15:00:00Z',
      isAvailable: false,
      description: 'Booked session'
    }
  ];

  const mockSessions = [
    {
      id: 'session1',
      studentName: 'Student One',
      studentEmail: 'student1@example.com',
      subject: 'Math',
      scheduledDateTime: '2024-01-15T10:00:00Z',
      endDateTime: '2024-01-15T11:00:00Z',
      status: 'pending',
      tutorApprovalStatus: 'pending'
    },
    {
      id: 'session2',
      studentName: 'Student Two',
      studentEmail: 'student2@example.com',
      subject: 'Physics',
      scheduledDateTime: '2024-01-15T14:00:00Z',
      endDateTime: '2024-01-15T15:00:00Z',
      status: 'scheduled',
      tutorApprovalStatus: 'approved'
    }
  ];

  beforeEach(() => {
    useAuth.mockReturnValue({ user: mockUser });
    
    // Mock service methods
    TutoringSessionService.getTutorSessions.mockResolvedValue(mockSessions);
    TutoringSessionService.createTutoringSession.mockResolvedValue({ success: true, id: 'new-session' });
    CalicoCalendarService.getTutorAvailability.mockResolvedValue(mockAvailability);
    CalicoCalendarService.syncWithGoogleCalendar.mockResolvedValue({
      success: true,
      eventsProcessed: 2,
      newEvents: 1,
      updatedEvents: 1
    });
    
    // Mock global fetch
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Render and Data Loading', () => {
    test('renders loading state initially', async () => {
      render(<UnifiedAvailability />);
      
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    test('loads and displays tutor availability data', async () => {
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(CalicoCalendarService.getTutorAvailability).toHaveBeenCalledWith(mockUser.user.email);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/tutor availability/i)).toBeInTheDocument();
      });
    });

    test('loads and displays tutoring sessions', async () => {
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(TutoringSessionService.getTutorSessions).toHaveBeenCalledWith(mockUser.user.email);
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
      fireEvent.click(dateButton);
      
      await waitFor(() => {
        expect(screen.getByText(/select a day to view/i)).toBeInTheDocument();
      });
    });

    test('displays slots for selected date', async () => {
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
      });
      
      const dateButton = screen.getByTestId('calendar-date-button');
      fireEvent.click(dateButton);
      
      await waitFor(() => {
        expect(screen.getByText(/available slots/i)).toBeInTheDocument();
      });
    });

    test('shows no slots message when no availability for selected date', async () => {
      CalicoCalendarService.getTutorAvailability.mockResolvedValue([]);
      
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
      });
      
      const dateButton = screen.getByTestId('calendar-date-button');
      fireEvent.click(dateButton);
      
      await waitFor(() => {
        expect(screen.getByText(/no slots available/i)).toBeInTheDocument();
      });
    });
  });

  describe('Slot Management', () => {
    test('opens add slot modal when add slot button is clicked', async () => {
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
      });
      
      const addSlotButton = screen.getByText(/add slot/i);
      fireEvent.click(addSlotButton);
      
      await waitFor(() => {
        expect(screen.getByText(/add availability slot/i)).toBeInTheDocument();
      });
    });

    test('creates new availability slot successfully', async () => {
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
      });
      
      // Open add slot modal
      const addSlotButton = screen.getByText(/add slot/i);
      fireEvent.click(addSlotButton);
      
      await waitFor(() => {
        expect(screen.getByText(/add availability slot/i)).toBeInTheDocument();
      });
      
      // Fill form
      const titleInput = screen.getByLabelText(/title/i);
      const dateInput = screen.getByLabelText(/date/i);
      const startTimeInput = screen.getByLabelText(/start time/i);
      const endTimeInput = screen.getByLabelText(/end time/i);
      
      fireEvent.change(titleInput, { target: { value: 'New Session' } });
      fireEvent.change(dateInput, { target: { value: '2024-01-20' } });
      fireEvent.change(startTimeInput, { target: { value: '10:00' } });
      fireEvent.change(endTimeInput, { target: { value: '11:00' } });
      
      // Submit form
      const saveButton = screen.getByText(/save/i);
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(TutoringSessionService.createTutoringSession).toHaveBeenCalled();
      });
    });

    test('shows validation error when required fields are missing', async () => {
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
      });
      
      // Open add slot modal
      const addSlotButton = screen.getByText(/add slot/i);
      fireEvent.click(addSlotButton);
      
      await waitFor(() => {
        expect(screen.getByText(/add availability slot/i)).toBeInTheDocument();
      });
      
      // Try to submit without filling required fields
      const saveButton = screen.getByText(/save/i);
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/connect calendar first/i)).toBeInTheDocument();
      });
    });
  });

  describe('Session Management', () => {
    test('displays pending sessions in pending tab', async () => {
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByText(/pending/i)).toBeInTheDocument();
      });
      
      const pendingTab = screen.getByText(/pending/i);
      fireEvent.click(pendingTab);
      
      await waitFor(() => {
        expect(screen.getByText('Student One')).toBeInTheDocument();
      });
    });

    test('displays upcoming sessions in upcoming tab', async () => {
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByText(/upcoming/i)).toBeInTheDocument();
      });
      
      const upcomingTab = screen.getByText(/upcoming/i);
      fireEvent.click(upcomingTab);
      
      await waitFor(() => {
        expect(screen.getByText('Student Two')).toBeInTheDocument();
      });
    });

    test('opens session details modal when session is clicked', async () => {
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByText(/pending/i)).toBeInTheDocument();
      });
      
      const pendingTab = screen.getByText(/pending/i);
      fireEvent.click(pendingTab);
      
      await waitFor(() => {
        expect(screen.getByText('Student One')).toBeInTheDocument();
      });
      
      const sessionCard = screen.getByText('Student One');
      fireEvent.click(sessionCard);
      
      await waitFor(() => {
        expect(screen.getByTestId('tutoring-details-modal')).toBeInTheDocument();
      });
    });

    test('shows no pending requests message when no pending sessions', async () => {
      TutoringSessionService.getTutorSessions.mockResolvedValue([
        {
          ...mockSessions[1],
          status: 'scheduled'
        }
      ]);
      
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByText(/pending/i)).toBeInTheDocument();
      });
      
      const pendingTab = screen.getByText(/pending/i);
      fireEvent.click(pendingTab);
      
      await waitFor(() => {
        expect(screen.getByText(/no pending requests/i)).toBeInTheDocument();
      });
    });
  });

  describe('Google Calendar Integration', () => {
    test('syncs with Google Calendar successfully', async () => {
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
      });
      
      const syncButton = screen.getByText(/sync calendar/i);
      fireEvent.click(syncButton);
      
      await waitFor(() => {
        expect(CalicoCalendarService.syncWithGoogleCalendar).toHaveBeenCalledWith(mockUser.user.email);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/sync successful/i)).toBeInTheDocument();
      });
    });

    test('shows error when Google Calendar sync fails', async () => {
      CalicoCalendarService.syncWithGoogleCalendar.mockRejectedValue(new Error('Sync failed'));
      
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
      });
      
      const syncButton = screen.getByText(/sync calendar/i);
      fireEvent.click(syncButton);
      
      await waitFor(() => {
        expect(screen.getByText(/sync failed/i)).toBeInTheDocument();
      });
    });

    test('disables sync button when not connected to Google Calendar', async () => {
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
      });
      
      const syncButton = screen.getByText(/sync calendar/i);
      expect(syncButton).toBeDisabled();
    });
  });

  describe('Internationalization', () => {
    test('displays text in correct language based on locale', async () => {
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByText(/tutor availability/i)).toBeInTheDocument();
      });
    });

    test('formats dates according to locale', async () => {
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
      });
      
      const dateButton = screen.getByTestId('calendar-date-button');
      fireEvent.click(dateButton);
      
      // Check that date formatting is applied
      await waitFor(() => {
        expect(screen.getByText(/available slots/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles error when loading availability fails', async () => {
      CalicoCalendarService.getTutorAvailability.mockRejectedValue(new Error('Failed to load'));
      
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    test('handles error when loading sessions fails', async () => {
      TutoringSessionService.getTutorSessions.mockRejectedValue(new Error('Failed to load sessions'));
      
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    test('handles error when creating session fails', async () => {
      TutoringSessionService.createTutoringSession.mockRejectedValue(new Error('Failed to create'));
      
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
      });
      
      // Open add slot modal
      const addSlotButton = screen.getByText(/add slot/i);
      fireEvent.click(addSlotButton);
      
      await waitFor(() => {
        expect(screen.getByText(/add availability slot/i)).toBeInTheDocument();
      });
      
      // Fill and submit form
      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'New Session' } });
      
      const saveButton = screen.getByText(/save/i);
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/error creating event/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    test('shows loading state during sync operation', async () => {
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
      });
      
      const syncButton = screen.getByText(/sync calendar/i);
      fireEvent.click(syncButton);
      
      await waitFor(() => {
        expect(screen.getByText(/syncing/i)).toBeInTheDocument();
      });
    });

    test('shows loading state during session creation', async () => {
      render(<UnifiedAvailability />);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
      });
      
      // Open add slot modal
      const addSlotButton = screen.getByText(/add slot/i);
      fireEvent.click(addSlotButton);
      
      await waitFor(() => {
        expect(screen.getByText(/add availability slot/i)).toBeInTheDocument();
      });
      
      // Fill form
      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'New Session' } });
      
      // Submit form
      const saveButton = screen.getByText(/save/i);
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/creating/i)).toBeInTheDocument();
      });
    });
  });
});
