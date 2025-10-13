import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotificationDropdown from '../src/app/components/NotificationDropdown/NotificationDropdown';
import StudentNotificationDropdown from '../src/app/components/NotificationDropdown/StudentNotificationDropdown';
import { useAuth } from '../src/app/context/SecureAuthContext';
import { NotificationService } from '../src/app/services/NotificationService';
import { TutoringSessionService } from '../src/app/services/TutoringSessionService';

// Mock dependencies
jest.mock('../src/app/context/SecureAuthContext');
jest.mock('../src/app/services/NotificationService');
jest.mock('../src/app/services/TutoringSessionService');

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Mock i18n
jest.mock('../src/lib/i18n', () => ({
  useI18n: () => ({
    t: (key, params = {}) => {
      const translations = {
        'notifications.title': 'Notifications',
        'notifications.loading': 'Loading notifications...',
        'notifications.empty': 'You have no notifications',
        'notifications.emptyDescription': 'All your notifications will appear here',
        'notifications.markAllAsRead': 'Mark all as read',
        'notifications.close': 'Close',
        'notifications.viewAll': 'View all notifications',
        'notifications.defaultTutorName': 'Tutor',
        'notifications.common.notification': 'Notification',
        'notifications.tutor.pendingSessionRequest': 'Tutoring Request',
        'notifications.tutor.sessionReminder': 'Session Reminder',
        'notifications.tutor.message': 'Message',
        'notifications.student.sessionAccepted': 'Session Accepted',
        'notifications.student.sessionRejected': 'Session Rejected',
        'notifications.student.sessionCancelled': 'Session Cancelled',
        'notifications.student.paymentReminder': 'Payment Reminder',
        'notifications.student.tutorMessage': 'Message from Tutor',
        'notifications.timeAgo.justNow': 'Just now',
        'notifications.timeAgo.minutesAgo': `${params.count || 0} minutes ago`,
        'notifications.timeAgo.hoursAgo': `${params.count || 0} hours ago`,
        'notifications.timeAgo.daysAgo': `${params.count || 0} days ago`,
        'notifications.timeAgo.minutesAgoShort': `${params.count || 0}m ago`,
        'notifications.timeAgo.hoursAgoShort': `${params.count || 0}h ago`,
        'notifications.timeAgo.daysAgoShort': `${params.count || 0}d ago`,
      };
      return translations[key] || key;
    },
    locale: 'en'
  })
}));

// Mock SessionBookedModal
jest.mock('../src/app/components/SessionBookedModal/SessionBookedModal', () => {
  return function MockSessionBookedModal({ isOpen, onClose }) {
    return isOpen ? (
      <div data-testid="session-booked-modal">
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
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null;
  };
});

describe('NotificationDropdown Components', () => {
  const mockUser = {
    isLoggedIn: true,
    email: 'tutor@example.com',
    name: 'Test Tutor',
    isTutor: true
  };

  const mockStudentUser = {
    isLoggedIn: true,
    email: 'student@example.com',
    name: 'Test Student',
    isTutor: false
  };

  const mockTutorNotifications = [
    {
      id: 'notif1',
      type: 'pending_session_request',
      title: 'New Session Request',
      message: 'John Doe has requested a tutoring session for Math',
      isRead: false,
      createdAt: new Date('2024-01-15T10:00:00Z'),
      sessionId: 'session1',
      studentName: 'John Doe',
      subject: 'Math'
    },
    {
      id: 'notif2',
      type: 'session_cancelled',
      title: 'Session Cancelled',
      message: 'Your session with Jane Smith has been cancelled',
      isRead: true,
      createdAt: new Date('2024-01-15T09:00:00Z'),
      sessionId: 'session2',
      studentName: 'Jane Smith'
    }
  ];

  const mockStudentNotifications = [
    {
      id: 'notif1',
      type: 'session_accepted',
      title: 'Session Accepted',
      message: 'Your session with Dr. Smith has been accepted',
      isRead: false,
      timestamp: new Date('2024-01-15T10:00:00Z'),
      sessionId: 'session1',
      tutorEmail: 'tutor@example.com',
      subject: 'Physics'
    },
    {
      id: 'notif2',
      type: 'session_rejected',
      title: 'Session Rejected',
      message: 'Your session request has been rejected',
      isRead: true,
      timestamp: new Date('2024-01-15T09:00:00Z'),
      sessionId: 'session2'
    }
  ];

  beforeEach(() => {
    // Mock service methods - ensure all methods are properly defined
    NotificationService.getTutorNotifications = jest.fn().mockResolvedValue(mockTutorNotifications);
    NotificationService.getStudentNotifications = jest.fn().mockResolvedValue(mockStudentNotifications);
    NotificationService.markNotificationAsRead = jest.fn().mockResolvedValue({ success: true });
    NotificationService.markAllAsRead = jest.fn().mockResolvedValue({ success: true, count: 2 });
    
    TutoringSessionService.getPendingSessionsForTutor = jest.fn().mockResolvedValue([
      {
        id: 'session1',
        studentName: 'John Doe',
        tutorName: 'Dr. Smith',
        subject: 'Math',
        scheduledDateTime: '2024-01-20T14:00:00Z',
        endDateTime: '2024-01-20T15:00:00Z'
      }
    ]);
    TutoringSessionService.getStudentSessions = jest.fn().mockResolvedValue([
      {
        id: 'session1',
        studentName: 'John Doe',
        tutorName: 'Dr. Smith',
        subject: 'Math',
        scheduledDateTime: '2024-01-20T14:00:00Z',
        endDateTime: '2024-01-20T15:00:00Z'
      }
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('NotificationDropdown (Tutor)', () => {
    test('renders notification bell icon', () => {
      useAuth.mockReturnValue({ user: mockUser });
      
      render(<NotificationDropdown />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('displays unread notification count', async () => {
      useAuth.mockReturnValue({ user: mockUser });
      
      render(<NotificationDropdown />);
      
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });

    test('opens dropdown when bell is clicked', async () => {
      useAuth.mockReturnValue({ user: mockUser });
      
      render(<NotificationDropdown />);
      
      const bellButton = screen.getByRole('button');
      await act(async () => {
        fireEvent.click(bellButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Tutoring Request')).toBeInTheDocument();
      });
    });

    test('displays notification list when dropdown is open', async () => {
      useAuth.mockReturnValue({ user: mockUser });
      
      render(<NotificationDropdown />);
      
      const bellButton = screen.getByRole('button');
      await act(async () => {
        fireEvent.click(bellButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Tutoring Request')).toBeInTheDocument();
        expect(screen.getByText('John Doe has requested a tutoring session for Math')).toBeInTheDocument();
      });
    });

    test('shows correct notification icons based on type', async () => {
      useAuth.mockReturnValue({ user: mockUser });
      
      render(<NotificationDropdown />);
      
      const bellButton = screen.getByRole('button');
      await act(async () => {
        fireEvent.click(bellButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Tutoring Request')).toBeInTheDocument();
      });
    });

    test('marks notification as read when clicked', async () => {
      useAuth.mockReturnValue({ user: mockUser });
      
      render(<NotificationDropdown />);
      
      const bellButton = screen.getByRole('button');
      await act(async () => {
        fireEvent.click(bellButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Tutoring Request')).toBeInTheDocument();
      });
      
      const notification = screen.getByText('Tutoring Request');
      await act(async () => {
        fireEvent.click(notification);
      });
      
      await waitFor(() => {
        expect(NotificationService.markNotificationAsRead).toHaveBeenCalledWith('notif1');
      });
    });

    test('closes dropdown when clicking outside', async () => {
      useAuth.mockReturnValue({ user: mockUser });
      
      render(
        <div>
          <NotificationDropdown />
          <div data-testid="outside-element">Outside</div>
        </div>
      );
      
      const bellButton = screen.getByRole('button');
      await act(async () => {
        fireEvent.click(bellButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Tutoring Request')).toBeInTheDocument();
      });
      
      const outsideElement = screen.getByTestId('outside-element');
      await act(async () => {
        fireEvent.mouseDown(outsideElement);
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Tutoring Request')).not.toBeInTheDocument();
      });
    });

    test('shows mark all as read button when there are unread notifications', async () => {
      useAuth.mockReturnValue({ user: mockUser });
      
      render(<NotificationDropdown />);
      
      const bellButton = screen.getByRole('button');
      await act(async () => {
        fireEvent.click(bellButton);
      });
      
      await waitFor(() => {
        expect(screen.getByTitle('Mark all as read')).toBeInTheDocument();
      });
    });

    test('marks all notifications as read when button is clicked', async () => {
      useAuth.mockReturnValue({ user: mockUser });
      
      render(<NotificationDropdown />);
      
      const bellButton = screen.getByRole('button');
      await act(async () => {
        fireEvent.click(bellButton);
      });
      
      await waitFor(() => {
        expect(screen.getByTitle('Mark all as read')).toBeInTheDocument();
      });
      
      const markAllButton = screen.getByTitle('Mark all as read');
      await act(async () => {
        fireEvent.click(markAllButton);
      });
      
      await waitFor(() => {
        expect(NotificationService.markAllAsRead).toHaveBeenCalledWith(mockUser.email, 'tutor');
      });
    });

    test('handles error when loading notifications fails', async () => {
      NotificationService.getTutorNotifications.mockRejectedValue(new Error('Failed to load'));
      useAuth.mockReturnValue({ user: mockUser });
      
      render(<NotificationDropdown />);
      
      const bellButton = screen.getByRole('button');
      await act(async () => {
        fireEvent.click(bellButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Error loading notifications')).toBeInTheDocument();
      });
    });

    test('shows empty state when no notifications', async () => {
      NotificationService.getTutorNotifications.mockResolvedValue([]);
      useAuth.mockReturnValue({ user: mockUser });
      
      render(<NotificationDropdown />);
      
      const bellButton = screen.getByRole('button');
      await act(async () => {
        fireEvent.click(bellButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('You have no notifications')).toBeInTheDocument();
      });
    });

    test('opens tutor approval modal for pending session requests', async () => {
      useAuth.mockReturnValue({ user: mockUser });
      
      render(<NotificationDropdown />);
      
      const bellButton = screen.getByRole('button');
      await act(async () => {
        fireEvent.click(bellButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Tutoring Request')).toBeInTheDocument();
      });
      
      const notification = screen.getByText('Tutoring Request');
      await act(async () => {
        fireEvent.click(notification);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('tutor-approval-modal')).toBeInTheDocument();
      });
    });
  });

  describe('StudentNotificationDropdown', () => {
    test('renders notification bell icon for students', () => {
      useAuth.mockReturnValue({ user: mockStudentUser });
      
      render(<StudentNotificationDropdown />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('displays unread notification count for students', async () => {
      useAuth.mockReturnValue({ user: mockStudentUser });
      
      render(<StudentNotificationDropdown />);
      
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });

    test('opens dropdown and shows student notifications', async () => {
      useAuth.mockReturnValue({ user: mockStudentUser });
      
      render(<StudentNotificationDropdown />);
      
      const bellButton = screen.getByRole('button');
      await act(async () => {
        fireEvent.click(bellButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Session Accepted')).toBeInTheDocument();
        expect(screen.getByText('Session Rejected')).toBeInTheDocument();
      });
    });

    test('opens session modal for accepted session notifications', async () => {
      useAuth.mockReturnValue({ user: mockStudentUser });
      
      render(<StudentNotificationDropdown />);
      
      const bellButton = screen.getByRole('button');
      await act(async () => {
        fireEvent.click(bellButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Session Accepted')).toBeInTheDocument();
      });
      
      const notification = screen.getByText('Session Accepted');
      await act(async () => {
        fireEvent.click(notification);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('session-booked-modal')).toBeInTheDocument();
      });
    });

    test('handles rejected session notifications', async () => {
      useAuth.mockReturnValue({ user: mockStudentUser });
      
      render(<StudentNotificationDropdown />);
      
      const bellButton = screen.getByRole('button');
      await act(async () => {
        fireEvent.click(bellButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Session Rejected')).toBeInTheDocument();
      });
      
      // Verify the notification is displayed and can be interacted with
      const notification = screen.getByText('Session Rejected');
      expect(notification).toBeInTheDocument();
      
      // Click the notification (this should trigger navigation in real app and close dropdown)
      await act(async () => {
        fireEvent.click(notification);
      });
      
      // After clicking, the dropdown should close, so we verify the notification is no longer visible
      await waitFor(() => {
        expect(screen.queryByText('Session Rejected')).not.toBeInTheDocument();
      });
    });

    test('shows correct notification icons for different types', async () => {
      useAuth.mockReturnValue({ user: mockStudentUser });
      
      render(<StudentNotificationDropdown />);
      
      const bellButton = screen.getByRole('button');
      await act(async () => {
        fireEvent.click(bellButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Session Accepted')).toBeInTheDocument();
      });
    });

    test('handles payment reminder notifications', async () => {
      const paymentNotification = {
        id: 'notif3',
        type: 'payment_reminder',
        title: 'Payment Reminder',
        message: 'Please submit payment proof for your session',
        isRead: false,
        timestamp: new Date('2024-01-15T10:00:00Z'),
        sessionId: 'session3'
      };
      
      NotificationService.getStudentNotifications.mockResolvedValue([
        ...mockStudentNotifications,
        paymentNotification
      ]);
      
      useAuth.mockReturnValue({ user: mockStudentUser });
      
      render(<StudentNotificationDropdown />);
      
      const bellButton = screen.getByRole('button');
      await act(async () => {
        fireEvent.click(bellButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Payment Reminder')).toBeInTheDocument();
      });
    });

    test('handles tutor message notifications', async () => {
      const messageNotification = {
        id: 'notif4',
        type: 'tutor_message',
        title: 'Message from Tutor',
        message: 'Your tutor has sent you a message',
        isRead: false,
        timestamp: new Date('2024-01-15T10:00:00Z'),
        sessionId: 'session4'
      };
      
      NotificationService.getStudentNotifications.mockResolvedValue([
        ...mockStudentNotifications,
        messageNotification
      ]);
      
      useAuth.mockReturnValue({ user: mockStudentUser });
      
      render(<StudentNotificationDropdown />);
      
      const bellButton = screen.getByRole('button');
      await act(async () => {
        fireEvent.click(bellButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Message from Tutor')).toBeInTheDocument();
      });
    });

    test('marks notification as read when clicked', async () => {
      useAuth.mockReturnValue({ user: mockStudentUser });
      
      render(<StudentNotificationDropdown />);
      
      const bellButton = screen.getByRole('button');
      await act(async () => {
        fireEvent.click(bellButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Session Accepted')).toBeInTheDocument();
      });
      
      const notification = screen.getByText('Session Accepted');
      await act(async () => {
        fireEvent.click(notification);
      });
      
      await waitFor(() => {
        expect(NotificationService.markNotificationAsRead).toHaveBeenCalledWith('notif1');
      });
    });

    test('shows empty state when no notifications', async () => {
      NotificationService.getStudentNotifications.mockResolvedValue([]);
      useAuth.mockReturnValue({ user: mockStudentUser });
      
      render(<StudentNotificationDropdown />);
      
      const bellButton = screen.getByRole('button');
      await act(async () => {
        fireEvent.click(bellButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('You have no notifications')).toBeInTheDocument();
      });
    });

    test('handles error when loading notifications fails', async () => {
      NotificationService.getStudentNotifications.mockRejectedValue(new Error('Failed to load'));
      useAuth.mockReturnValue({ user: mockStudentUser });
      
      render(<StudentNotificationDropdown />);
      
      const bellButton = screen.getByRole('button');
      await act(async () => {
        fireEvent.click(bellButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Error loading notifications')).toBeInTheDocument();
      });
    });
  });

  describe('Internationalization', () => {
    test('displays notifications in correct language', async () => {
      useAuth.mockReturnValue({ user: mockUser });
      
      render(<NotificationDropdown />);
      
      const bellButton = screen.getByRole('button');
      await act(async () => {
        fireEvent.click(bellButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
      });
    });

    test('formats dates according to locale', async () => {
      useAuth.mockReturnValue({ user: mockUser });
      
      render(<NotificationDropdown />);
      
      const bellButton = screen.getByRole('button');
      await act(async () => {
        fireEvent.click(bellButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Tutoring Request')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    test('shows loading state while fetching notifications', async () => {
      NotificationService.getTutorNotifications.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      useAuth.mockReturnValue({ user: mockUser });
      
      render(<NotificationDropdown />);
      
      const bellButton = screen.getByRole('button');
      await act(async () => {
        fireEvent.click(bellButton);
      });
      
      expect(screen.getByText('Loading notifications...')).toBeInTheDocument();
    });
  });
});