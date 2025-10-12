import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mutable mocks to vary per test
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

jest.mock('../src/app/components/AvailabilityCalendar/AvailabilityCalendar', () => ({
  __esModule: true,
  default: ({ subject, mode }) => (
    <div data-testid="availability-calendar">calendar mode={mode} subject={subject}</div>
  ),
}));

import JointAvailabilityPage from '../src/app/availability/joint/page.jsx';

describe('JointAvailability page', () => {
  beforeEach(() => {
    mockParams = new URLSearchParams({ subject: 'Cálculo' });
    mockRouterPush = jest.fn();
    mockRouterBack = jest.fn();
  });

  test('renders subject info and calendar in joint mode (happy path)', async () => {
    render(<JointAvailabilityPage />);
    // Page title from i18n (en: Joint Availability)
    expect(await screen.findByText(/joint availability|disponibilidad conjunta/i)).toBeInTheDocument();
    const cal = await screen.findByTestId('availability-calendar');
    expect(cal).toHaveTextContent(/mode=joint/i);
    expect(cal).toHaveTextContent(/subject=Cálculo/i);
  });

  test('shows subject metadata and all tutors label', async () => {
    render(<JointAvailabilityPage />);
    // Subject in metadata
    expect(await screen.findByText('Cálculo')).toBeInTheDocument();
    // i18n label from en.json mock
    expect(screen.getByText(/All available tutors/i)).toBeInTheDocument();
  });

  test('back button triggers router.back()', async () => {
    render(<JointAvailabilityPage />);
    const backBtn = await screen.findByRole('button', { name: /back/i });
    await userEvent.click(backBtn);
    expect(mockRouterBack).toHaveBeenCalledTimes(1);
  });

  test('error state when subject is missing and back to search navigates', async () => {
    mockParams = new URLSearchParams();
    render(<JointAvailabilityPage />);

    // Error title and description from i18n
    expect(await screen.findByText('Data Error')).toBeInTheDocument();
    expect(
      screen.getByText('No subject specified to search joint availability.')
    ).toBeInTheDocument();

    const backToSearch = screen.getByRole('button', { name: /Back to Search/i });
    await userEvent.click(backToSearch);
    expect(mockRouterPush).toHaveBeenCalledWith('/home/buscar-tutores');
  });
});
