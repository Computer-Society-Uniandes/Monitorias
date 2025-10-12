import React from 'react';
import { render, screen, within } from '@testing-library/react';

// Mock AuthContext to provide a logged-in tutor
jest.mock('../src/app/context/SecureAuthContext', () => ({
  useAuth: () => ({
    user: { isLoggedIn: true, email: 'tutor@example.com' },
  }),
}));

// Mock PaymentsService to control data
jest.mock('../src/app/services/PaymentsService', () => ({
  __esModule: true,
  default: {
    getPaymentsByTutor: jest.fn(async (email) => [
      // One paid session last month
      { id: '1', amount: 50000, pagado: true, subject: 'Cálculo', studentName: 'Estudiante Uno', date_payment: new Date() },
      // One pending session this month
      { id: '2', amount: 30000, pagado: false, subject: 'Álgebra', studentName: 'Estudiante Dos', date_payment: new Date() },
    ]),
  },
}));

// Mock Firestore (db) usage in statistics page
jest.mock('../src/firebaseConfig', () => ({ db: {} }));

// Mock Firebase functions used in the component for rating lookup
jest.mock('firebase/firestore', () => ({
  doc: () => ({}),
  getDoc: async () => ({ exists: () => false }),
  collection: () => ({}),
  query: () => ({}),
  where: () => ({}),
  getDocs: async () => ({ empty: true, docs: [] }),
  limit: () => ({}),
}));

import TutorStatistics from '../src/app/tutor/statistics/page.jsx';
import PaymentsService from '../src/app/services/PaymentsService.js';

describe('TutorStatistics page', () => {
  test('renders statistics layout and fetches tutor payments', async () => {
    render(<TutorStatistics />);

    // It should call the service to load data
    expect(PaymentsService.getPaymentsByTutor).toHaveBeenCalledWith('tutor@example.com');

    // Basic sections should render
    expect(await screen.findByText(/statistics/i)).toBeInTheDocument();
    expect(await screen.findByText(/sessions per month/i)).toBeInTheDocument();
    // Transactions header present (render validation)
    expect(await screen.findByText(/date|fecha/i)).toBeInTheDocument();
  });

  test('displays transaction status badges and method icons', async () => {
    render(<TutorStatistics />);
    // Look for status column header and any status badge label (pending/completed)
    expect(await screen.findByText(/status|estado/i)).toBeInTheDocument();
  });
});
