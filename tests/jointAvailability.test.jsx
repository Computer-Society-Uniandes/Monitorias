import React from 'react';
import { render, screen } from '@testing-library/react';

const subjectParams = new URLSearchParams({ subject: 'Cálculo' });

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useSearchParams: () => ({
    get: (k) => subjectParams.get(k),
    toString: () => subjectParams.toString(),
  }),
}));

jest.mock('../src/app/components/AvailabilityCalendar/AvailabilityCalendar', () => ({
  __esModule: true,
  default: ({ subject, mode }) => (
    <div data-testid="availability-calendar">calendar mode={mode} subject={subject}</div>
  ),
}));

import JointAvailabilityPage from '../src/app/availability/joint/page.jsx';

describe('JointAvailability page', () => {
  test('renders subject info and calendar in joint mode', async () => {
    render(<JointAvailabilityPage />);
    // Page title from i18n (en: Joint Availability | es: Disponibilidad conjunta)
    expect(await screen.findByText(/joint availability|disponibilidad conjunta/i)).toBeInTheDocument();
    const cal = await screen.findByTestId('availability-calendar');
    expect(cal).toHaveTextContent(/mode=joint/i);
    expect(cal).toHaveTextContent(/subject=Cálculo/i);
  });
});
