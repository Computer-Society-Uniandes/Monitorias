import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Shared mutable mocks for next/navigation
let mockParams = new URLSearchParams();
let mockRouterPush = jest.fn();
let mockRouterBack = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush, back: mockRouterBack }),
  useSearchParams: () => ({
    get: (k) => mockParams.get(k),
    toString: () => mockParams.toString(),
  }),
}));

// Mock AvailabilityCalendar to avoid heavy behavior
jest.mock('../src/app/components/AvailabilityCalendar/AvailabilityCalendar', () => ({
  __esModule: true,
  default: ({ tutorId, tutorName, subject, mode }) => (
    <div data-testid="availability-calendar">
      calendar mode={mode} tutor={tutorName} subject={subject} id={tutorId}
    </div>
  ),
}));

import IndividualAvailabilityPage from '../src/app/availability/individual/page.jsx';

describe('IndividualAvailability page', () => {
  beforeEach(() => {
    mockParams = new URLSearchParams({
      tutorId: 't1',
      tutorName: 'Ada Lovelace',
      subject: 'Programación',
      location: 'Campus',
      rating: '4.8',
    });
    mockRouterPush = jest.fn();
    mockRouterBack = jest.fn();
  });

  test('renders tutor header and passes props to calendar (happy path)', async () => {
    render(<IndividualAvailabilityPage />);

    // Tutor name visible
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();

    // Calendar receives props
    const cal = await screen.findByTestId('availability-calendar');
    expect(cal).toHaveTextContent(/mode=individual/i);
    expect(cal).toHaveTextContent(/tutor=Ada Lovelace/i);
    expect(cal).toHaveTextContent(/subject=Programación/i);
    expect(cal).toHaveTextContent(/id=t1/i);
  });

  test('shows subject, location and rating metadata when provided', async () => {
    render(<IndividualAvailabilityPage />);

    // Subject shown in metadata
    expect(await screen.findByText('Programación')).toBeInTheDocument();
    // Location shown
    expect(screen.getByText('Campus')).toBeInTheDocument();
    // Rating shown with star symbol
    expect(screen.getByText(/4\.8\s*⭐/)).toBeInTheDocument();
  });

  test('hides metadata items when not provided', async () => {
    // Remove optional fields
    mockParams = new URLSearchParams({
      tutorId: 't2',
      tutorName: 'Alan Turing',
      // subject missing
      // location missing
      // rating missing
    });

    render(<IndividualAvailabilityPage />);

    // Tutor visible
    expect(await screen.findByText('Alan Turing')).toBeInTheDocument();

    // No subject/location/rating text present
    expect(screen.queryByText('Programación')).not.toBeInTheDocument();
    expect(screen.queryByText('Campus')).not.toBeInTheDocument();
    expect(screen.queryByText(/⭐/)).not.toBeInTheDocument();
  });

  test('back button triggers router.back()', async () => {
    render(<IndividualAvailabilityPage />);
    const backBtn = await screen.findByRole('button', { name: /back/i }); // i18n backShort -> "Back"
    await userEvent.click(backBtn);
    expect(mockRouterBack).toHaveBeenCalledTimes(1);
  });

  test('error state when missing tutorId or tutorName, and back to search navigates', async () => {
    // Missing tutorId & tutorName
    mockParams = new URLSearchParams({ subject: 'Programación' });

    render(<IndividualAvailabilityPage />);

    // Error title and text (from i18n mocks)
    expect(await screen.findByText('Data Error')).toBeInTheDocument();
    expect(
      screen.getByText('Tutor data could not be loaded. Please go back and try again.')
    ).toBeInTheDocument();

    // Back button navigates to search
    const goBackBtn = screen.getByRole('button', { name: /Back to Search/i });
    await userEvent.click(goBackBtn);
    expect(mockRouterPush).toHaveBeenCalledWith('/home/buscar-tutores');
  });
});
