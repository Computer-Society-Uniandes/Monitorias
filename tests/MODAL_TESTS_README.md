# Modal Components Test Suite

This document describes the Jest test suites created for the three modal components in the Calico tutoring platform.

## Test Files Created

1. **tests/RescheduleSessionModal.test.jsx** - Tests for the reschedule session functionality
2. **tests/TutoringDetailsModal.test.jsx** - Tests for viewing and managing session details
3. **tests/SessionConfirmationModal.test.jsx** - Tests for confirming new tutoring sessions

## Running the Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test RescheduleSessionModal.test.jsx

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## Test Coverage Overview

### RescheduleSessionModal.test.jsx
**Purpose**: Tests the session rescheduling functionality

**Test Cases (14 tests)**:
- ✅ Modal visibility control (open/close)
- ✅ Session details rendering
- ✅ Tutor availability loading
- ✅ Loading states
- ✅ Empty state (no available slots)
- ✅ Slot selection interaction
- ✅ Form validation (reason required)
- ✅ Successful reschedule flow
- ✅ Error handling on reschedule failure
- ✅ Close button functionality
- ✅ Button states during async operations
- ✅ Date and time formatting (locale-aware)
- ✅ Pluralization of slot counts

**Mocked Dependencies**:
- `AvailabilityService` - Tutor availability data
- `SlotService` - Slot generation and grouping logic
- `fetch` - API calls for rescheduling
- `useI18n` - Internationalization (via setupTests.js)

**Key Assertions**:
- Validates user cannot reschedule without selecting a slot
- Validates user cannot reschedule without providing a reason
- Ensures API is called with correct payload
- Verifies modal closes and parent is notified on success
- Checks error messages are displayed appropriately

---

### TutoringDetailsModal.test.jsx
**Purpose**: Tests the session details view and management options

**Test Cases (18 tests)**:
- ✅ Modal visibility control
- ✅ Complete session details rendering
- ✅ Currency formatting
- ✅ Payment status badges
- ✅ Action buttons visibility (reschedule/cancel)
- ✅ Opening reschedule modal
- ✅ Closing both modals after reschedule
- ✅ Cancel confirmation flow
- ✅ Cancellation reason validation
- ✅ Successful session cancellation
- ✅ Error handling on cancellation
- ✅ Cancelled session status display
- ✅ Button visibility based on session state
- ✅ Time-based restrictions (2-hour window)
- ✅ Close button functionality
- ✅ Cancellation abort option
- ✅ Time until session display
- ✅ Conditional rendering (location, notes)

**Mocked Dependencies**:
- `TutoringSessionService` - Session cancellation logic
- `useAuth` - User authentication context
- `RescheduleSessionModal` - Child modal component
- `useI18n` - Internationalization

**Key Assertions**:
- Validates all session information is displayed correctly
- Ensures cancel reason is required
- Verifies both modals close after reschedule complete
- Checks proper handling of cancelled sessions
- Tests time-based restrictions are enforced

---

### SessionConfirmationModal.test.jsx
**Purpose**: Tests the new session booking confirmation process

**Test Cases (20 tests)**:
- ✅ Modal visibility control
- ✅ Session details rendering
- ✅ Date and time formatting (locale-aware)
- ✅ Price display and formatting
- ✅ Pre-filled email field
- ✅ Email editing capability
- ✅ File type validation (images and PDF only)
- ✅ File size validation (max 5MB)
- ✅ Accepting valid image files
- ✅ Accepting valid PDF files
- ✅ Button disabled without payment proof
- ✅ Button disabled with invalid email
- ✅ Button enabled with valid inputs
- ✅ Successful confirmation with correct data
- ✅ Close/cancel button functionality
- ✅ Input disabling during loading
- ✅ Loading state button text
- ✅ Error message display
- ✅ Error clearing on valid input
- ✅ Email format validation

**Mocked Dependencies**:
- `PaymentService` - Payment proof upload (imported but not actively used in tests)
- `useI18n` - Internationalization

**Key Assertions**:
- Validates file type restrictions (JPEG, PNG, PDF only)
- Validates file size restrictions (max 5MB)
- Ensures email format validation
- Verifies payment proof is required
- Checks correct data is passed to onConfirm callback
- Tests error states and recovery

---

## Test Structure

All test files follow this structure:

```javascript
describe('ComponentName', () => {
  // Setup
  const mockProps = { ... };
  const mockCallbacks = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup mocks
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  test('specific behavior description', () => {
    // Arrange
    render(<Component {...mockProps} />);
    
    // Act
    fireEvent.click(someButton);
    
    // Assert
    expect(someElement).toBeInTheDocument();
  });
});
```

## Mocking Strategy

### Global Mocks (setupTests.js)
- `next/navigation` - Router functionality
- `lib/i18n` - Internationalization with English translations

### Component-Specific Mocks
- **Services**: Mocked to control data and test edge cases
- **Child Components**: Simplified mock implementations for isolated testing
- **API Calls**: Using `global.fetch` mock for async operations

## Best Practices Followed

1. **Isolation**: Each test is independent and doesn't rely on others
2. **Cleanup**: `beforeEach` and `afterEach` ensure clean state
3. **Clear Names**: Test descriptions clearly state what is being tested
4. **AAA Pattern**: Arrange, Act, Assert structure in each test
5. **Mock Management**: Proper cleanup and reset of mocks
6. **Async Handling**: Using `waitFor` for async operations
7. **User Perspective**: Testing from user interaction viewpoint
8. **Edge Cases**: Testing both success and failure scenarios
9. **Accessibility**: Using proper roles and labels in queries

## Common Testing Patterns

### Testing Modal Visibility
```javascript
test('does not render when isOpen is false', () => {
  const { container } = render(<Modal isOpen={false} />);
  expect(container.firstChild).toBeNull();
});
```

### Testing Async Operations
```javascript
test('loads data on mount', async () => {
  mockService.getData.mockResolvedValue(data);
  render(<Component />);
  
  await waitFor(() => {
    expect(mockService.getData).toHaveBeenCalled();
  });
});
```

### Testing User Interactions
```javascript
test('updates state on button click', () => {
  render(<Component />);
  const button = screen.getByRole('button', { name: /click me/i });
  fireEvent.click(button);
  expect(screen.getByText(/updated/i)).toBeInTheDocument();
});
```

### Testing Form Validation
```javascript
test('validates required field', () => {
  render(<Form />);
  const submitButton = screen.getByRole('button', { name: /submit/i });
  expect(submitButton).toBeDisabled();
  
  const input = screen.getByLabelText(/email/i);
  fireEvent.change(input, { target: { value: 'test@example.com' } });
  expect(submitButton).not.toBeDisabled();
});
```

## Integration with CI/CD

These tests are designed to run in CI/CD pipelines:

- Fast execution (no real API calls)
- Deterministic results (mocked dependencies)
- Clear failure messages
- Compatible with standard Jest reporters

## Future Improvements

1. **Snapshot Testing**: Add snapshot tests for UI consistency
2. **Integration Tests**: Test multiple components working together
3. **E2E Tests**: Add Cypress/Playwright for full user flows
4. **Performance Tests**: Measure render performance
5. **Accessibility Tests**: Add automated a11y checks with jest-axe
6. **Coverage Goals**: Aim for 80%+ code coverage

## Maintenance Notes

- **Update Tests**: When component logic changes, update corresponding tests
- **New Features**: Add tests for new functionality
- **Refactoring**: Keep tests updated during refactoring
- **Dependencies**: Update mocks when service contracts change
- **Documentation**: Keep this document synchronized with test files

## Troubleshooting

### Tests Failing After Changes
1. Check if component props or behavior changed
2. Verify mock implementations match actual services
3. Review async timing with `waitFor` options
4. Check console errors for clues

### Mock Issues
1. Ensure mocks are properly reset in `beforeEach`
2. Verify import paths match actual component imports
3. Check mock return values match expected data structure

### Async Test Failures
1. Use `waitFor` for all async operations
2. Increase timeout if needed: `waitFor(() => {...}, { timeout: 3000 })`
3. Check for unresolved promises

---

**Last Updated**: October 12, 2025
**Test Framework**: Jest 29.x + React Testing Library
**Total Tests**: 52 test cases across 3 files
