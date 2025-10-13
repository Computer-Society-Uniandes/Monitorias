import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import SessionConfirmationModal from '../src/app/components/SessionConfirmationModal/SessionConfirmationModal';

// Mock PaymentService
jest.mock('../src/app/services/PaymentService', () => ({
  PaymentService: {
    uploadPaymentProof: jest.fn(),
  },
}));

describe('SessionConfirmationModal', () => {
  const mockSession = {
    subject: 'Cálculo I',
    subjectCode: 'MATE1001',
    tutorEmail: 'tutor@example.com',
    tutorName: 'John Doe',
    studentEmail: 'student@example.com',
    scheduledDateTime: '2025-10-15T10:00:00Z',
    endDateTime: '2025-10-15T11:00:00Z',
    price: 50000,
  };

  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('does not render when isOpen is false', () => {
    const { container } = render(
      <SessionConfirmationModal
        isOpen={false}
        onClose={mockOnClose}
        session={mockSession}
        onConfirm={mockOnConfirm}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders modal with all session details', () => {
    render(
      <SessionConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText('Session Confirmation')).toBeInTheDocument();
    expect(screen.getByText('Cálculo I')).toBeInTheDocument();
    expect(screen.getByText('MATE1001')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  test('displays formatted date and time', () => {
    render(
      <SessionConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onConfirm={mockOnConfirm}
      />
    );

    // Should display formatted date (locale-aware)
    expect(screen.getByText(/October|octubre/i)).toBeInTheDocument();
  });

  test('displays formatted price', () => {
    render(
      <SessionConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onConfirm={mockOnConfirm}
      />
    );

    // Should display currency amount
    expect(screen.getByText(/50,000/)).toBeInTheDocument();
  });

  test('pre-fills student email if provided in session', () => {
    render(
      <SessionConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onConfirm={mockOnConfirm}
      />
    );

    const emailInput = screen.getByPlaceholderText(/your-email@example.com/i);
    expect(emailInput).toHaveValue('student@example.com');
  });

  test('allows user to change email', async () => {
    render(
      <SessionConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onConfirm={mockOnConfirm}
      />
    );

    const emailInput = screen.getByPlaceholderText(/your-email@example.com/i);
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'newemail@example.com' } });
    });

    expect(emailInput).toHaveValue('newemail@example.com');
  });

  test('validates file type on upload', async () => {
    render(
      <SessionConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onConfirm={mockOnConfirm}
      />
    );

    const fileInput = screen.getByLabelText(/Select file/i).closest('label').querySelector('input[type="file"]');
    
    // Try to upload invalid file type
    const invalidFile = new File(['content'], 'document.txt', { type: 'text/plain' });
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [invalidFile] } });
    });

    expect(screen.getByText(/Please upload an image.*or PDF/i)).toBeInTheDocument();
  });

  test('validates file size on upload', async () => {
    render(
      <SessionConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onConfirm={mockOnConfirm}
      />
    );

    const fileInput = screen.getByLabelText(/Select file/i).closest('label').querySelector('input[type="file"]');
    
    // Try to upload file larger than 5MB
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'proof.jpg', { type: 'image/jpeg' });
    Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 });
    
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [largeFile] } });
    });

    expect(screen.getByText(/File must not exceed 5MB/i)).toBeInTheDocument();
  });

  test('accepts valid image file', async () => {
    render(
      <SessionConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onConfirm={mockOnConfirm}
      />
    );

    const fileInput = screen.getByLabelText(/Select file/i).closest('label').querySelector('input[type="file"]');
    
    const validFile = new File(['content'], 'proof.jpg', { type: 'image/jpeg' });
    Object.defineProperty(validFile, 'size', { value: 1024 * 1024 }); // 1MB
    
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [validFile] } });
    });

    expect(screen.getByText(/File selected: proof.jpg/i)).toBeInTheDocument();
  });

  test('accepts valid PDF file', async () => {
    render(
      <SessionConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onConfirm={mockOnConfirm}
      />
    );

    const fileInput = screen.getByLabelText(/Select file/i).closest('label').querySelector('input[type="file"]');
    
    const validFile = new File(['content'], 'proof.pdf', { type: 'application/pdf' });
    Object.defineProperty(validFile, 'size', { value: 1024 * 1024 }); // 1MB
    
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [validFile] } });
    });

    expect(screen.getByText(/File selected: proof.pdf/i)).toBeInTheDocument();
  });

  test('confirm button is disabled without payment proof', () => {
    render(
      <SessionConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onConfirm={mockOnConfirm}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /Confirm Booking and Send Invite/i });
    expect(confirmButton).toBeDisabled();
  });

  test('confirm button is disabled with invalid email', async () => {
    render(
      <SessionConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onConfirm={mockOnConfirm}
      />
    );

    // Upload valid file
    const fileInput = screen.getByLabelText(/Select file/i).closest('label').querySelector('input[type="file"]');
    const validFile = new File(['content'], 'proof.jpg', { type: 'image/jpeg' });
    Object.defineProperty(validFile, 'size', { value: 1024 });
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [validFile] } });
    });

    // Set invalid email
    const emailInput = screen.getByPlaceholderText(/your-email@example.com/i);
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    });

    const confirmButton = screen.getByRole('button', { name: /Confirm Booking and Send Invite/i });
    expect(confirmButton).toBeDisabled();
  });

  test('confirm button is enabled with valid inputs', async () => {
    render(
      <SessionConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onConfirm={mockOnConfirm}
      />
    );

    // Upload valid file
    const fileInput = screen.getByLabelText(/Select file/i).closest('label').querySelector('input[type="file"]');
    const validFile = new File(['content'], 'proof.jpg', { type: 'image/jpeg' });
    Object.defineProperty(validFile, 'size', { value: 1024 });
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [validFile] } });
    });

    // Email is already pre-filled with valid email
    const confirmButton = screen.getByRole('button', { name: /Confirm Booking and Send Invite/i });
    expect(confirmButton).not.toBeDisabled();
  });

  test('calls onConfirm with correct data when confirmed', async () => {
    render(
      <SessionConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onConfirm={mockOnConfirm}
      />
    );

    // Upload valid file
    const fileInput = screen.getByLabelText(/Select file/i).closest('label').querySelector('input[type="file"]');
    const validFile = new File(['content'], 'proof.jpg', { type: 'image/jpeg' });
    Object.defineProperty(validFile, 'size', { value: 1024 });
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [validFile] } });
    });

    // Change email
    const emailInput = screen.getByPlaceholderText(/your-email@example.com/i);
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'newemail@example.com' } });
    });

    // Confirm
    const confirmButton = screen.getByRole('button', { name: /Confirm Booking and Send Invite/i });
    await act(async () => {
      fireEvent.click(confirmButton);
    });

    expect(mockOnConfirm).toHaveBeenCalledWith({
      studentEmail: 'newemail@example.com',
      proofFile: validFile,
    });
  });

  test('closes modal when back button is clicked', async () => {
    render(
      <SessionConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onConfirm={mockOnConfirm}
      />
    );

    const backButton = screen.getAllByRole('button')[0]; // First button is back button
    await act(async () => {
      fireEvent.click(backButton);
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('closes modal when cancel button is clicked', async () => {
    render(
      <SessionConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onConfirm={mockOnConfirm}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await act(async () => {
      fireEvent.click(cancelButton);
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('disables inputs during confirmation loading', () => {
    render(
      <SessionConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onConfirm={mockOnConfirm}
        confirmLoading={true}
      />
    );

    const emailInput = screen.getByPlaceholderText(/your-email@example.com/i);
    const fileInput = screen.getByLabelText(/Select file/i).closest('label').querySelector('input[type="file"]');
    const confirmButton = screen.getByRole('button', { name: /Confirming.../i });

    expect(emailInput).toBeDisabled();
    expect(fileInput).toBeDisabled();
    expect(confirmButton).toBeDisabled();
  });

  test('shows confirming state on button during loading', () => {
    render(
      <SessionConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onConfirm={mockOnConfirm}
        confirmLoading={true}
      />
    );

    expect(screen.getByText('Confirming...')).toBeInTheDocument();
  });

  test('displays error message when present', async () => {
    render(
      <SessionConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onConfirm={mockOnConfirm}
      />
    );

    // Try to upload invalid file to trigger error
    const fileInput = screen.getByLabelText(/Select file/i).closest('label').querySelector('input[type="file"]');
    const invalidFile = new File(['content'], 'document.txt', { type: 'text/plain' });
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [invalidFile] } });
    });

    // Error should be displayed
    const errorMessage = screen.getByText(/Please upload an image.*or PDF/i);
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage.closest('div')).toHaveClass('bg-red-50');
  });

  test('clears error when valid file is uploaded', async () => {
    render(
      <SessionConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onConfirm={mockOnConfirm}
      />
    );

    const fileInput = screen.getByLabelText(/Select file/i).closest('label').querySelector('input[type="file"]');
    
    // First upload invalid file
    const invalidFile = new File(['content'], 'document.txt', { type: 'text/plain' });
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [invalidFile] } });
    });
    expect(screen.getByText(/Please upload an image.*or PDF/i)).toBeInTheDocument();

    // Then upload valid file
    const validFile = new File(['content'], 'proof.jpg', { type: 'image/jpeg' });
    Object.defineProperty(validFile, 'size', { value: 1024 });
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [validFile] } });
    });

    // Error should be cleared
    expect(screen.queryByText(/Please upload an image.*or PDF/i)).not.toBeInTheDocument();
  });

  test('displays session details with icons', () => {
    render(
      <SessionConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onConfirm={mockOnConfirm}
      />
    );

    // Should have visual elements
    const subjectSection = screen.getByText('Subject').closest('div');
    expect(subjectSection).toBeInTheDocument();
    
    const tutorSection = screen.getByText('Tutor').closest('div');
    expect(tutorSection).toBeInTheDocument();

    const detailsSection = screen.getByText('Session Details').closest('div');
    expect(detailsSection).toBeInTheDocument();
  });

  test('shows default price when session price is not provided', () => {
    const sessionWithoutPrice = {
      ...mockSession,
      price: null,
    };

    render(
      <SessionConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        session={sessionWithoutPrice}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText(/25,000/)).toBeInTheDocument();
  });

  test('validates email format', async () => {
    render(
      <SessionConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        session={mockSession}
        onConfirm={mockOnConfirm}
      />
    );

    // Upload valid file
    const fileInput = screen.getByLabelText(/Select file/i).closest('label').querySelector('input[type="file"]');
    const validFile = new File(['content'], 'proof.jpg', { type: 'image/jpeg' });
    Object.defineProperty(validFile, 'size', { value: 1024 });
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [validFile] } });
    });

    const emailInput = screen.getByPlaceholderText(/your-email@example.com/i);
    
    // Test invalid emails
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'notanemail' } });
    });
    let confirmButton = screen.getByRole('button', { name: /Confirm Booking and Send Invite/i });
    expect(confirmButton).toBeDisabled();

    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'missing@domain' } });
    });
    confirmButton = screen.getByRole('button', { name: /Confirm Booking and Send Invite/i });
    expect(confirmButton).toBeDisabled();

    // Test valid email
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'valid@example.com' } });
    });
    confirmButton = screen.getByRole('button', { name: /Confirm Booking and Send Invite/i });
    expect(confirmButton).not.toBeDisabled();
  });
});
