import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import TutoringDetailsModal from '../src/app/components/TutoringDetailsModal/TutoringDetailsModal';

// Mock AuthContext
jest.mock('../src/app/context/SecureAuthContext', () => ({
  useAuth: () => ({
    user: { 
      isLoggedIn: true, 
      email: 'student@example.com' 
    },
  }),
}));

// Mock TutoringSessionService
jest.mock('../src/app/services/core/TutoringSessionService', () => ({
  TutoringSessionService: {
    cancelSession: jest.fn(),
    canCancelSession: jest.fn(),
  },
}));

// Mock RescheduleSessionModal
jest.mock('../src/app/components/RescheduleSessionModal/RescheduleSessionModal', () => {
  return function MockRescheduleModal({ isOpen, onClose, session, onRescheduleComplete }) {
    if (!isOpen) return null;
    return (
      <div data-testid="reschedule-modal">
        <h2>Reschedule Modal</h2>
        <p>{session?.subject}</p>
        <button onClick={onClose}>Close Reschedule</button>
        <button onClick={onRescheduleComplete}>Complete Reschedule</button>
      </div>
    );
  };
});

import { TutoringSessionService } from '../src/app/services/core/TutoringSessionService';

describe('TutoringDetailsModal', () => {
  // Use a future date (3 days from now) to ensure session can be cancelled
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 3);
  const endDate = new Date(futureDate);
  endDate.setHours(futureDate.getHours() + 1);
  
  const mockSession = {
    id: 'session-123',
    subject: 'Cálculo I',
    subjectCode: 'MATE1001',
    tutorEmail: 'tutor@example.com',
    tutorName: 'John Doe',
    studentEmail: 'student@example.com',
    studentName: 'Jane Smith',
    scheduledDateTime: futureDate.toISOString(),
    endDateTime: endDate.toISOString(),
    location: 'Building ML, Room 301',
    price: 50000,
    notes: 'Please bring your textbook',
    status: 'scheduled',
  };

  const mockOnClose = jest.fn();
  const mockOnSessionUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();
    TutoringSessionService.canCancelSession.mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('does not render when isOpen is false', () => {
    const { container } = render(
      <TutoringDetailsModal
        isOpen={false}
        onClose={mockOnClose}
        session={mockSession}
        onSessionUpdate={mockOnSessionUpdate}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders modal with all session details', () => {
    render(
      <TutoringDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onSessionUpdate={mockOnSessionUpdate}
      />
    );

    // "Session Details" appears twice (header and section label), so use getAllByText
    expect(screen.getAllByText('Session Details').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Cálculo I')).toBeInTheDocument();
    expect(screen.getByText('MATE1001')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Building ML, Room 301')).toBeInTheDocument();
    expect(screen.getByText('Please bring your textbook')).toBeInTheDocument();
  });

  test('displays formatted price with currency', () => {
    render(
      <TutoringDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onSessionUpdate={mockOnSessionUpdate}
      />
    );

    // Should display formatted currency
    expect(screen.getByText(/50\.000/)).toBeInTheDocument();
  });

  test('displays payment status badge when present', () => {
    const sessionWithPayment = {
      ...mockSession,
      paymentStatus: 'verificado',
    };

    render(
      <TutoringDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        session={sessionWithPayment}
        onSessionUpdate={mockOnSessionUpdate}
      />
    );

    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  test('shows reschedule and cancel buttons when session can be modified', () => {
    render(
      <TutoringDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onSessionUpdate={mockOnSessionUpdate}
      />
    );

    expect(screen.getByRole('button', { name: /Reschedule/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel Session/i })).toBeInTheDocument();
  });

  test('opens reschedule modal when reschedule button is clicked', async () => {
    render(
      <TutoringDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onSessionUpdate={mockOnSessionUpdate}
      />
    );

    const rescheduleButton = screen.getByRole('button', { name: /Reschedule/i });
    await act(async () => {
      fireEvent.click(rescheduleButton);
    });

    expect(screen.getByTestId('reschedule-modal')).toBeInTheDocument();
    expect(screen.getByText('Reschedule Modal')).toBeInTheDocument();
  });

  test('closes both modals after successful reschedule', async () => {
    render(
      <TutoringDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onSessionUpdate={mockOnSessionUpdate}
      />
    );

    // Open reschedule modal
    const rescheduleButton = screen.getByRole('button', { name: /Reschedule/i });
    await act(async () => {
      fireEvent.click(rescheduleButton);
    });

    // Complete reschedule
    const completeButton = screen.getByRole('button', { name: /Complete Reschedule/i });
    await act(async () => {
      fireEvent.click(completeButton);
    });

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnSessionUpdate).toHaveBeenCalled();
  });

  test('shows cancel confirmation when cancel button is clicked', async () => {
    render(
      <TutoringDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onSessionUpdate={mockOnSessionUpdate}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /Cancel Session/i });
    await act(async () => {
      fireEvent.click(cancelButton);
    });

    expect(screen.getByText(/Are you sure you want to cancel/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Please provide a reason/i)).toBeInTheDocument();
  });

  test('validates reason is provided before cancelling', async () => {
    render(
      <TutoringDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onSessionUpdate={mockOnSessionUpdate}
      />
    );

    // Open cancel confirmation
    const cancelButton = screen.getByRole('button', { name: /Cancel Session/i });
    await act(async () => {
      fireEvent.click(cancelButton);
    });

    // Try to confirm without reason
    const confirmCancelButton = screen.getByRole('button', { name: /Yes, cancel/i });
    
    // Button should be disabled without reason
    expect(confirmCancelButton).toBeDisabled();
  });

  test('successfully cancels session with reason', async () => {
    TutoringSessionService.cancelSession.mockResolvedValue({ success: true });

    render(
      <TutoringDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onSessionUpdate={mockOnSessionUpdate}
      />
    );

    // Open cancel confirmation
    const cancelButton = screen.getByRole('button', { name: /Cancel Session/i });
    await act(async () => {
      fireEvent.click(cancelButton);
    });

    // Enter reason
    const reasonInput = screen.getByPlaceholderText(/Please provide a reason/i);
    await act(async () => {
      fireEvent.change(reasonInput, { target: { value: 'Emergency situation' } });
    });

    // Confirm cancellation
    const confirmCancelButton = screen.getByRole('button', { name: /Yes, cancel/i });
    await act(async () => {
      fireEvent.click(confirmCancelButton);
    });

    await waitFor(() => {
      expect(TutoringSessionService.cancelSession).toHaveBeenCalledWith(
        'session-123',
        'student@example.com',
        'Emergency situation'
      );
      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Session Cancelled'));
      expect(mockOnSessionUpdate).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  test('displays error when cancellation fails', async () => {
    TutoringSessionService.cancelSession.mockRejectedValue(new Error('Network error'));

    render(
      <TutoringDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onSessionUpdate={mockOnSessionUpdate}
      />
    );

    // Open cancel confirmation
    const cancelButton = screen.getByRole('button', { name: /Cancel Session/i });
    await act(async () => {
      fireEvent.click(cancelButton);
    });

    // Enter reason
    const reasonInput = screen.getByPlaceholderText(/Please provide a reason/i);
    await act(async () => {
      fireEvent.change(reasonInput, { target: { value: 'Emergency' } });
    });

    // Confirm cancellation
    const confirmCancelButton = screen.getByRole('button', { name: /Yes, cancel/i });
    await act(async () => {
      fireEvent.click(confirmCancelButton);
    });

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Network error'));
    });
  });

  test('shows cancelled status when session is already cancelled', () => {
    const cancelledSession = {
      ...mockSession,
      status: 'cancelled',
      cancelledBy: 'student@example.com',
      cancellationReason: 'Schedule conflict',
    };

    render(
      <TutoringDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        session={cancelledSession}
        onSessionUpdate={mockOnSessionUpdate}
      />
    );

    expect(screen.getByText(/Session Cancelled/i)).toBeInTheDocument();
    expect(screen.getByText(/Cancelled by:/i)).toBeInTheDocument(); // More specific text
    expect(screen.getByText(/Schedule conflict/i)).toBeInTheDocument();
  });

  test('hides action buttons when session is cancelled', () => {
    const cancelledSession = {
      ...mockSession,
      status: 'cancelled',
    };

    TutoringSessionService.canCancelSession.mockReturnValue(false);

    render(
      <TutoringDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        session={cancelledSession}
        onSessionUpdate={mockOnSessionUpdate}
      />
    );

    expect(screen.queryByRole('button', { name: /Reschedule/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Cancel Session/i })).not.toBeInTheDocument();
  });

  test('shows warning when session cannot be cancelled (less than 2 hours)', () => {
    TutoringSessionService.canCancelSession.mockReturnValue(false);

    render(
      <TutoringDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onSessionUpdate={mockOnSessionUpdate}
      />
    );

    expect(screen.getByText(/Cannot cancel with less than 2 hours notice/i)).toBeInTheDocument();
  });

  test('closes modal when close button is clicked', async () => {
    render(
      <TutoringDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onSessionUpdate={mockOnSessionUpdate}
      />
    );

    const closeButton = screen.getByRole('button', { name: /Close/i });
    await act(async () => {
      fireEvent.click(closeButton);
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('allows keeping the session in cancel confirmation', async () => {
    render(
      <TutoringDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onSessionUpdate={mockOnSessionUpdate}
      />
    );

    // Open cancel confirmation
    const cancelButton = screen.getByRole('button', { name: /Cancel Session/i });
    await act(async () => {
      fireEvent.click(cancelButton);
    });

    // Click "No, keep it"
    const keepButton = screen.getByRole('button', { name: /No, keep it/i });
    await act(async () => {
      fireEvent.click(keepButton);
    });

    // Should return to normal view
    expect(screen.queryByPlaceholderText(/Please provide a reason/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel Session/i })).toBeInTheDocument();
  });

  test('displays time until session', () => {
    // Create a session 5 hours from now
    const futureDate = new Date(Date.now() + 5 * 60 * 60 * 1000);
    const futureSession = {
      ...mockSession,
      scheduledDateTime: futureDate.toISOString(),
    };

    // Mock that session cannot be cancelled (less than 2 hours)
    TutoringSessionService.canCancelSession.mockReturnValue(false);

    render(
      <TutoringDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        session={futureSession}
        onSessionUpdate={mockOnSessionUpdate}
      />
    );

    // Should show time remaining - the text will be "5 hours remaining"
    expect(screen.getByText(/5 hours remaining/i)).toBeInTheDocument();
  });

  test('does not show location when it is "Por definir"', () => {
    const sessionWithoutLocation = {
      ...mockSession,
      location: 'Por definir',
    };

    render(
      <TutoringDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        session={sessionWithoutLocation}
        onSessionUpdate={mockOnSessionUpdate}
      />
    );

    expect(screen.queryByText('Building ML, Room 301')).not.toBeInTheDocument();
  });

  test('does not show notes section when notes are empty', () => {
    const sessionWithoutNotes = {
      ...mockSession,
      notes: null,
    };

    render(
      <TutoringDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        session={sessionWithoutNotes}
        onSessionUpdate={mockOnSessionUpdate}
      />
    );

    expect(screen.queryByText('Please bring your textbook')).not.toBeInTheDocument();
  });
});
