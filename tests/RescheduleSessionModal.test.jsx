import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import RescheduleSessionModal from '../src/app/components/RescheduleSessionModal/RescheduleSessionModal';

// Mock services
jest.mock('../src/app/services/AvailabilityService', () => ({
  AvailabilityService: {
    getAvailabilitiesByTutorAndRange: jest.fn(),
  },
}));

jest.mock('../src/app/services/SlotService', () => ({
  SlotService: {
    generateHourlySlotsFromAvailabilities: jest.fn(),
    getAvailableSlots: jest.fn(),
    groupSlotsByDate: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

import { AvailabilityService } from '../src/app/services/core/AvailabilityService';
import { SlotService } from '../src/app/services/utils/SlotService';

describe('RescheduleSessionModal', () => {
  const mockSession = {
    id: 'session-123',
    subject: 'Cálculo I',
    tutorEmail: 'tutor@example.com',
    tutorName: 'John Doe',
    scheduledDateTime: '2025-10-15T10:00:00Z',
    endDateTime: '2025-10-15T11:00:00Z',
  };

  const mockOnClose = jest.fn();
  const mockOnRescheduleComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('does not render when isOpen is false', () => {
    const { container } = render(
      <RescheduleSessionModal
        isOpen={false}
        onClose={mockOnClose}
        session={mockSession}
        onRescheduleComplete={mockOnRescheduleComplete}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders modal with session details when isOpen is true', async () => {
    AvailabilityService.getAvailabilitiesByTutorAndRange.mockResolvedValue({
      availabilitySlots: [],
    });
    SlotService.generateHourlySlotsFromAvailabilities.mockReturnValue([]);
    SlotService.getAvailableSlots.mockReturnValue([]);
    SlotService.groupSlotsByDate.mockReturnValue({});

    render(
      <RescheduleSessionModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onRescheduleComplete={mockOnRescheduleComplete}
      />
    );

    expect(screen.getByText('Reschedule Session')).toBeInTheDocument();
    expect(screen.getByText('Cálculo I')).toBeInTheDocument();
    expect(screen.getByText(/Current Schedule/i)).toBeInTheDocument();
  });

  test('loads tutor availability on mount', async () => {
    const mockSlots = [
      {
        id: 'slot-1',
        startDateTime: '2025-10-20T14:00:00Z',
        endDateTime: '2025-10-20T15:00:00Z',
        location: 'Online',
      },
    ];

    AvailabilityService.getAvailabilitiesByTutorAndRange.mockResolvedValue({
      availabilitySlots: [{ date: '2025-10-20', startTime: '14:00', endTime: '15:00' }],
    });
    SlotService.generateHourlySlotsFromAvailabilities.mockReturnValue(mockSlots);
    SlotService.getAvailableSlots.mockReturnValue(mockSlots);
    SlotService.groupSlotsByDate.mockReturnValue({
      '2025-10-20': {
        date: new Date('2025-10-20'),
        slots: mockSlots,
      },
    });

    render(
      <RescheduleSessionModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onRescheduleComplete={mockOnRescheduleComplete}
      />
    );

    await waitFor(() => {
      expect(AvailabilityService.getAvailabilitiesByTutorAndRange).toHaveBeenCalledWith(
        'tutor@example.com',
        expect.any(String),
        expect.any(String)
      );
    });
  });

  test('displays loading state while fetching availability', async () => {
    AvailabilityService.getAvailabilitiesByTutorAndRange.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ availabilitySlots: [] }), 100))
    );

    render(
      <RescheduleSessionModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onRescheduleComplete={mockOnRescheduleComplete}
      />
    );

    expect(screen.getByText('Loading availability...')).toBeInTheDocument();
  });

  test('displays empty state when no slots available', async () => {
    AvailabilityService.getAvailabilitiesByTutorAndRange.mockResolvedValue({
      availabilitySlots: [],
    });
    SlotService.generateHourlySlotsFromAvailabilities.mockReturnValue([]);
    SlotService.getAvailableSlots.mockReturnValue([]);
    SlotService.groupSlotsByDate.mockReturnValue({});

    render(
      <RescheduleSessionModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onRescheduleComplete={mockOnRescheduleComplete}
      />
    );

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading availability...')).not.toBeInTheDocument();
    });

    // Now check for empty state - use regex to match text that includes emoji
    expect(screen.getByText(/No available times/i)).toBeInTheDocument();
    expect(screen.getByText(/tutor has no availability/i)).toBeInTheDocument();
  });

  test('allows user to select a time slot', async () => {
    const mockSlots = [
      {
        id: 'slot-1',
        startDateTime: '2025-10-20T09:00:00Z',
        endDateTime: '2025-10-20T10:00:00Z',
      },
    ];

    AvailabilityService.getAvailabilitiesByTutorAndRange.mockResolvedValue({
      availabilitySlots: [{ date: '2025-10-20', startTime: '09:00', endTime: '10:00' }],
    });
    SlotService.generateHourlySlotsFromAvailabilities.mockReturnValue(mockSlots);
    SlotService.getAvailableSlots.mockReturnValue(mockSlots);
    SlotService.groupSlotsByDate.mockReturnValue({
      '2025-10-20': {
        date: new Date('2025-10-20'),
        slots: mockSlots,
      },
    });

    render(
      <RescheduleSessionModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onRescheduleComplete={mockOnRescheduleComplete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/time slot available/i)).toBeInTheDocument();
    });

    // Find the slot button by looking for any time pattern (timezone-independent)
    const slotButtons = screen.getAllByRole('button');
    const slotButton = slotButtons.find(button => 
      button.textContent && button.textContent.match(/\d{1,2}:\d{2}\s*(AM|PM)?.*\d{1,2}:\d{2}\s*(AM|PM)?/i)
    );
    expect(slotButton).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(slotButton);
    });

    // Slot should be selected (visual change)
    expect(slotButton).toHaveClass('border-[#FF8C00]');
  });

  test('validates reason input before rescheduling', async () => {
    const mockSlots = [
      {
        id: 'slot-1',
        startDateTime: '2025-10-20T09:00:00Z',
        endDateTime: '2025-10-20T10:00:00Z',
      },
    ];

    AvailabilityService.getAvailabilitiesByTutorAndRange.mockResolvedValue({
      availabilitySlots: [{ date: '2025-10-20', startTime: '09:00', endTime: '10:00' }],
    });
    SlotService.generateHourlySlotsFromAvailabilities.mockReturnValue(mockSlots);
    SlotService.getAvailableSlots.mockReturnValue(mockSlots);
    SlotService.groupSlotsByDate.mockReturnValue({
      '2025-10-20': { date: new Date('2025-10-20'), slots: mockSlots },
    });

    render(
      <RescheduleSessionModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onRescheduleComplete={mockOnRescheduleComplete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/time slot available/i)).toBeInTheDocument();
    });

    // Select slot (timezone-independent approach)
    const slotButtons = screen.getAllByRole('button');
    const slotButton = slotButtons.find(button => 
      button.textContent && button.textContent.match(/\d{1,2}:\d{2}\s*(AM|PM)?.*\d{1,2}:\d{2}\s*(AM|PM)?/i)
    );
    expect(slotButton).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(slotButton);
    });

    // Try to confirm without reason - button should be disabled
    const confirmButton = screen.getByRole('button', { name: /Confirm Reschedule/i });
    expect(confirmButton).toBeDisabled();

    // Alert won't be called because button is disabled, but we can verify the disabled state
    await act(async () => {
      fireEvent.click(confirmButton);
    });
    expect(global.alert).not.toHaveBeenCalled();
  });

  test('successfully reschedules session with valid inputs', async () => {
    const mockSlots = [
      {
        id: 'slot-1',
        startDateTime: '2025-10-20T09:00:00Z',
        endDateTime: '2025-10-20T10:00:00Z',
      },
    ];

    AvailabilityService.getAvailabilitiesByTutorAndRange.mockResolvedValue({
      availabilitySlots: [{ date: '2025-10-20', startTime: '09:00', endTime: '10:00' }],
    });
    SlotService.generateHourlySlotsFromAvailabilities.mockReturnValue(mockSlots);
    SlotService.getAvailableSlots.mockReturnValue(mockSlots);
    SlotService.groupSlotsByDate.mockReturnValue({
      '2025-10-20': { date: new Date('2025-10-20'), slots: mockSlots },
    });

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(
      <RescheduleSessionModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onRescheduleComplete={mockOnRescheduleComplete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/time slot available/i)).toBeInTheDocument();
    });

    // Select slot (timezone-independent approach)
    const slotButtons = screen.getAllByRole('button');
    const slotButton = slotButtons.find(button => 
      button.textContent && button.textContent.match(/\d{1,2}:\d{2}\s*(AM|PM)?.*\d{1,2}:\d{2}\s*(AM|PM)?/i)
    );
    expect(slotButton).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(slotButton);
    });

    // Enter reason
    const reasonInput = screen.getByPlaceholderText(/E.g.: I have another commitment/i);
    await act(async () => {
      fireEvent.change(reasonInput, { target: { value: 'Need to change time' } });
    });

    // Confirm reschedule
    const confirmButton = screen.getByRole('button', { name: /Confirm Reschedule/i });
    await act(async () => {
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/tutoring-sessions/reschedule',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('session-123'),
        })
      );
      expect(global.alert).toHaveBeenCalledWith('✅ Session successfully rescheduled');
      expect(mockOnRescheduleComplete).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  test('displays error message when rescheduling fails', async () => {
    const mockSlots = [
      {
        id: 'slot-1',
        startDateTime: '2025-10-20T09:00:00Z',
        endDateTime: '2025-10-20T10:00:00Z',
      },
    ];

    AvailabilityService.getAvailabilitiesByTutorAndRange.mockResolvedValue({
      availabilitySlots: [{ date: '2025-10-20', startTime: '09:00', endTime: '10:00' }],
    });
    SlotService.generateHourlySlotsFromAvailabilities.mockReturnValue(mockSlots);
    SlotService.getAvailableSlots.mockReturnValue(mockSlots);
    SlotService.groupSlotsByDate.mockReturnValue({
      '2025-10-20': { date: new Date('2025-10-20'), slots: mockSlots },
    });

    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Slot no longer available' }),
    });

    render(
      <RescheduleSessionModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onRescheduleComplete={mockOnRescheduleComplete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/time slot available/i)).toBeInTheDocument();
    });

    // Select slot and enter reason (timezone-independent approach)
    const slotButtons = screen.getAllByRole('button');
    const slotButton = slotButtons.find(button => 
      button.textContent && button.textContent.match(/\d{1,2}:\d{2}\s*(AM|PM)?.*\d{1,2}:\d{2}\s*(AM|PM)?/i)
    );
    expect(slotButton).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(slotButton);
    });

    const reasonInput = screen.getByPlaceholderText(/E.g.: I have another commitment/i);
    await act(async () => {
      fireEvent.change(reasonInput, { target: { value: 'Need to change time' } });
    });

    // Confirm reschedule
    const confirmButton = screen.getByRole('button', { name: /Confirm Reschedule/i });
    await act(async () => {
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/Slot no longer available/i)).toBeInTheDocument();
    });
  });

  test('closes modal when close button is clicked', async () => {
    AvailabilityService.getAvailabilitiesByTutorAndRange.mockResolvedValue({
      availabilitySlots: [],
    });
    SlotService.generateHourlySlotsFromAvailabilities.mockReturnValue([]);
    SlotService.getAvailableSlots.mockReturnValue([]);

    render(
      <RescheduleSessionModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onRescheduleComplete={mockOnRescheduleComplete}
      />
    );

    const backButton = screen.getAllByRole('button')[0]; // First button is back button
    await act(async () => {
      fireEvent.click(backButton);
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('disables buttons during rescheduling process', async () => {
    const mockSlots = [
      {
        id: 'slot-1',
        startDateTime: '2025-10-20T09:00:00Z',
        endDateTime: '2025-10-20T10:00:00Z',
      },
    ];

    AvailabilityService.getAvailabilitiesByTutorAndRange.mockResolvedValue({
      availabilitySlots: [{ date: '2025-10-20', startTime: '09:00', endTime: '10:00' }],
    });
    SlotService.generateHourlySlotsFromAvailabilities.mockReturnValue(mockSlots);
    SlotService.getAvailableSlots.mockReturnValue(mockSlots);
    SlotService.groupSlotsByDate.mockReturnValue({
      '2025-10-20': { date: new Date('2025-10-20'), slots: mockSlots },
    });

    global.fetch.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100))
    );

    render(
      <RescheduleSessionModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onRescheduleComplete={mockOnRescheduleComplete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/time slot available/i)).toBeInTheDocument();
    });

    // Select slot and enter reason (timezone-independent approach)
    const slotButtons = screen.getAllByRole('button');
    const slotButton = slotButtons.find(button => 
      button.textContent && button.textContent.match(/\d{1,2}:\d{2}\s*(AM|PM)?.*\d{1,2}:\d{2}\s*(AM|PM)?/i)
    );
    expect(slotButton).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(slotButton);
    });

    const reasonInput = screen.getByPlaceholderText(/E.g.: I have another commitment/i);
    await act(async () => {
      fireEvent.change(reasonInput, { target: { value: 'Need to change' } });
    });

    const confirmButton = screen.getByRole('button', { name: /Confirm Reschedule/i });
    await act(async () => {
      fireEvent.click(confirmButton);
    });

    // Button should show loading state
    expect(screen.getByText('Rescheduling...')).toBeInTheDocument();
  });
});
