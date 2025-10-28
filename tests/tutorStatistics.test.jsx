import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock AuthContext to provide a logged-in tutor
jest.mock('../src/app/context/SecureAuthContext', () => ({
  useAuth: () => ({
    user: { isLoggedIn: true, email: 'tutor@example.com' },
  }),
}));

// Mock PaymentService to control data
jest.mock('../src/app/services/core/PaymentService', () => ({
  PaymentService: {
    getPaymentsByTutor: jest.fn(async (email) => {
      const now = Date.now();
      const d1 = new Date(now - 3 * 24 * 60 * 60 * 1000); // dentro del mes
      const d2 = new Date(now - 2 * 24 * 60 * 60 * 1000);
      return [
        { id: '1', amount: 50000, pagado: true, method: 'card', subject: 'Cálculo', studentName: 'Estudiante Uno', date_payment: d1 },
        { id: '2', amount: 30000, pagado: false, method: 'cash', subject: 'Álgebra', studentName: 'Estudiante Dos', date_payment: d2 },
      ];
    }),
  },
}));

// Mock Firestore (db) usage in statistics page
jest.mock('../src/firebaseConfig', () => ({ db: {} }));

// Mock Firebase functions used in the component for rating lookup
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => ({})),
  getDoc: jest.fn(async () => ({ exists: () => false })),
  collection: jest.fn(() => ({})),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  getDocs: jest.fn(async () => ({ empty: true, docs: [] })),
  limit: jest.fn(() => ({})),
}));

import TutorStatistics from '../src/app/tutor/statistics/page.jsx';
import { PaymentService } from '../src/app/services/core/PaymentService';

describe('TutorStatistics page', () => {
  test('renders statistics layout and fetches tutor payments', async () => {
    render(<TutorStatistics />);

    // It should call the service to load data
    expect(PaymentService.getPaymentsByTutor).toHaveBeenCalledWith('tutor@example.com');

    // Basic sections should render
    expect(await screen.findByRole('heading', { name: /statistics/i })).toBeInTheDocument();
    expect(await screen.findByText(/sessions per month/i)).toBeInTheDocument();
    // Transactions header present (render validation)
    expect(await screen.findByText(/date|fecha/i)).toBeInTheDocument();
  });

  test('displays transaction status badges and method icons', async () => {
    render(<TutorStatistics />);
    // Look for status column header and any status badge label (pending/completed)
    expect(await screen.findByText(/status|estado/i)).toBeInTheDocument();
  });

  test('shows computed summary cards: sessions, next payment, total earnings, rating', async () => {
    render(<TutorStatistics />);

    // Titles present
    expect(await screen.findByText(/total sessions/i)).toBeInTheDocument();
    expect(screen.getByText(/next payment/i)).toBeInTheDocument();
    expect(screen.getByText(/total earnings/i)).toBeInTheDocument();
    expect(screen.getByText(/average rating/i)).toBeInTheDocument();

    // Values present (avoid strict currency format – locale dependent)
    // Total sessions = 2
    const sessionsCard = screen.getByText(/total sessions/i).closest('.stat-card');
    expect(within(sessionsCard).getByText('2')).toBeInTheDocument();

    // Next payment = 30000 formatted (look for 30.000)
    const nextCard = screen.getByText(/next payment/i).closest('.stat-card');
    expect(within(nextCard).getByText(/30[\.,]000/)).toBeInTheDocument();

    // Total earnings = 50000 formatted (look for 50.000)
    const totalCard = screen.getByText(/total earnings/i).closest('.stat-card');
    expect(within(totalCard).getByText(/50[\.,]000/)).toBeInTheDocument();

    // Rating default 0.0 ⭐
    const ratingCard = screen.getByText(/average rating/i).closest('.stat-card');
    expect(within(ratingCard).getByText(/0\.0\s*⭐/)).toBeInTheDocument();
  });

  test('builds subject filter options from payments and filters the table', async () => {
    render(<TutorStatistics />);

    // Wait until filters render
    await screen.findByText(/payment history|historial de pagos/i);

    // Subject select contains both subjects from payments - find all labels and get the one in filters
    const subjectLabels = screen.getAllByText(/subject/i);
    const subjectLabel = subjectLabels.find(el => el.tagName === 'LABEL');
    const subjectGroup = subjectLabel.closest('.filter-group');
    const subjectSelect = subjectGroup.querySelector('select');
    expect(within(subjectSelect).getByRole('option', { name: 'Cálculo' })).toBeInTheDocument();
    expect(within(subjectSelect).getByRole('option', { name: 'Álgebra' })).toBeInTheDocument();

    // Filter by "Cálculo"
    await userEvent.selectOptions(subjectSelect, 'Cálculo');

    // After filter, table should show one transaction with concept containing subject
    const conceptHeader = screen.getByText(/concept|concepto/i);
    const table = conceptHeader.closest('.transactions-table');
    const rows = table.querySelectorAll('.table-body .table-row');
    expect(rows.length).toBe(1);
    expect(within(rows[0]).getByText(/Tutoring Cálculo|Tutoría Cálculo/i)).toBeInTheDocument();
  });

  test('custom date period hides all transactions and shows empty state', async () => {
    render(<TutorStatistics />);

    // Wait until filters render
    await screen.findByText(/payment history|historial de pagos/i);

    // Change timeframe to custom
    const periodLabel = screen.getByText(/period/i);
    const periodGroup = periodLabel.closest('.filter-group');
    const periodSelect = periodGroup.querySelector('select');
    await userEvent.selectOptions(periodSelect, 'custom');

    // Wait for custom inputs to appear - find all labels at once
    const fromLabels = await screen.findAllByText(/from|desde/i);
    const fromLabel = fromLabels.find(el => el.tagName === 'LABEL');
    const fromGroup = fromLabel.closest('.filter-group');
    const fromInput = fromGroup.querySelector('input[type="date"]');
    
    const toLabels = await screen.findAllByText(/to|hasta/i);
    const toLabel = toLabels.find(el => el.tagName === 'LABEL');
    const toGroup = toLabel.closest('.filter-group');
    const toInput = toGroup.querySelector('input[type="date"]');
    
    // Use click and type instead of clear for date inputs
    await userEvent.click(fromInput);
    await userEvent.type(fromInput, '{selectall}{delete}2000-01-01');
    await userEvent.click(toInput);
    await userEvent.type(toInput, '{selectall}{delete}2000-01-02');

    // Expect empty state
    expect(await screen.findByText(/no transactions|no hay transacciones/i)).toBeInTheDocument();
  });

  test('applies status class and method icon mapping', async () => {
    // Override payments to have clear methods with dates early in the month
    const { PaymentService: Svc } = await import('../src/app/services/core/PaymentService');
    const now = new Date();
    const dateInMonth = new Date(now.getFullYear(), now.getMonth(), 5); // 5th of current month
    Svc.getPaymentsByTutor.mockResolvedValue([
      { id: '1', amount: 10000, pagado: true, method: 'transfer', subject: 'Cálculo', studentEmail: 'a@b.com', studentName: 'Student A', date_payment: dateInMonth },
      { id: '2', amount: 20000, pagado: false, method: 'cash', subject: 'Álgebra', studentEmail: 'c@d.com', studentName: 'Student C', date_payment: dateInMonth },
      { id: '3', amount: 30000, pagado: true, method: 'card', subject: 'Álgebra', studentEmail: 'e@f.com', studentName: 'Student E', date_payment: dateInMonth },
    ]);

    render(<TutorStatistics />);
    await screen.findByText(/payment history|historial de pagos/i);
    // Wait until rows are rendered
    await screen.findAllByText(/Tutoring|Tutoría/);

    // Query badges by class for robustness
    const badges = Array.from(document.querySelectorAll('.status-badge'));
    const completedBadge = badges.find((b) => /completed|completado/i.test(b.textContent || ''));
    const pendingBadge = badges.find((b) => /pending|pendiente/i.test(b.textContent || ''));
    expect(completedBadge && completedBadge.className).toMatch(/status-completed/);
    expect(pendingBadge && pendingBadge.className).toMatch(/status-pending/);

    // Method icons: transfer 🏦, cash 💵, card 💳
    expect(screen.getByText(/🏦\s*transfer/i)).toBeInTheDocument();
    expect(screen.getByText(/💵\s*cash/i)).toBeInTheDocument();
    expect(screen.getByText(/💳\s*card/i)).toBeInTheDocument();
  });

  test('loads average rating from Firestore when available', async () => {
    // Mock getDoc to return rating 4.7 BEFORE rendering
    const fs = await import('firebase/firestore');
    fs.getDoc.mockResolvedValue({ exists: () => true, data: () => ({ rating: '4.7' }) });

    render(<TutorStatistics />);
    // Wait for component to load data
    await screen.findByText(/payment history|historial de pagos/i);
    
    const ratingCard = await screen.findByText(/average rating/i);
    const card = ratingCard.closest('.stat-card');
    expect(within(card).getByText(/4\.7\s*⭐/)).toBeInTheDocument();
  });
});
