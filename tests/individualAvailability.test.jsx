import React from 'react';
import { render, screen } from '@testing-library/react';

// We need to override next/navigation search params for this test
const mockParams = new URLSearchParams({
  tutorId: 't1',
  tutorName: 'Ada Lovelace',
  subject: 'Programación',
  location: 'Campus',
  rating: '4.8',
});

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
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
  test('renders tutor header and passes props to calendar', async () => {
    render(<IndividualAvailabilityPage />);

    // Tutor name visible
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();

    // Calendar receives props
    const cal = await screen.findByTestId('availability-calendar');
    expect(cal).toHaveTextContent(/mode=individual/i);
    expect(cal).toHaveTextContent(/tutor=Ada Lovelace/i);
    expect(cal).toHaveTextContent(/subject=Programación/i);
  });
});
