import { TutoringSessionService } from '../src/app/services/TutoringSessionService';
import { NotificationService } from '../src/app/services/NotificationService';

// Mock Firebase
const mockDoc = jest.fn();
const mockCollection = jest.fn();
const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockSetDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockAddDoc = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockLimit = jest.fn();
const mockServerTimestamp = jest.fn(() => 'mock-timestamp');
const mockWriteBatch = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: mockCollection,
  doc: mockDoc,
  getDoc: mockGetDoc,
  getDocs: mockGetDocs,
  setDoc: mockSetDoc,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  addDoc: mockAddDoc,
  query: mockQuery,
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: mockLimit,
  serverTimestamp: mockServerTimestamp,
  writeBatch: mockWriteBatch,
}));

// Mock Firebase config
jest.mock('../src/firebaseConfig', () => ({
  db: 'mock-db'
}));

describe('TutoringSessionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockAddDoc.mockResolvedValue({ id: 'mock-session-id' });
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        id: 'session1',
        studentEmail: 'student@example.com',
        tutorEmail: 'tutor@example.com',
        status: 'pending'
      })
    });
    mockUpdateDoc.mockResolvedValue({});
    mockCollection.mockReturnValue('mock-collection');
    mockDoc.mockReturnValue('mock-doc');
    mockQuery.mockReturnValue('mock-query');
    mockWhere.mockReturnValue('mock-where');
    mockOrderBy.mockReturnValue('mock-order-by');
    mockLimit.mockReturnValue('mock-limit');
  });

  describe('createTutoringSession', () => {
    const mockSessionData = {
      studentEmail: 'student@example.com',
      tutorEmail: 'tutor@example.com',
      subject: 'Mathematics',
      scheduledDateTime: '2024-01-20T14:00:00Z',
      endDateTime: '2024-01-20T15:00:00Z',
      location: 'Room 101',
      notes: 'Test session'
    };

    test('creates tutoring session successfully', async () => {
      const result = await TutoringSessionService.createTutoringSession(mockSessionData);

      expect(mockAddDoc).toHaveBeenCalledWith(
        'mock-collection',
        expect.objectContaining({
          ...mockSessionData,
          status: 'pending',
          tutorApprovalStatus: 'pending',
          paymentStatus: 'pending'
        })
      );
      expect(result).toEqual({ success: true, id: 'mock-session-id' });
    });

    test('creates session without approval when requiresApproval is false', async () => {
      const sessionDataWithoutApproval = {
        ...mockSessionData,
        requiresApproval: false
      };

      await TutoringSessionService.createTutoringSession(sessionDataWithoutApproval);

      expect(mockAddDoc).toHaveBeenCalledWith(
        'mock-collection',
        expect.objectContaining({
          status: 'scheduled',
          tutorApprovalStatus: 'approved'
        })
      );
    });

    test('handles errors during session creation', async () => {
      mockAddDoc.mockRejectedValue(new Error('Database error'));

      await expect(TutoringSessionService.createTutoringSession(mockSessionData))
        .rejects.toThrow('Error creando sesión de tutoría: Database error');
    });
  });

  describe('acceptTutoringSession', () => {
    const sessionId = 'session1';
    const tutorEmail = 'tutor@example.com';

    test('accepts tutoring session successfully', async () => {
      const result = await TutoringSessionService.acceptTutoringSession(sessionId, tutorEmail);

      expect(mockGetDoc).toHaveBeenCalledWith('mock-doc');
      expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc', {
        status: 'scheduled',
        tutorApprovalStatus: 'accepted',
        acceptedAt: 'mock-timestamp',
        updatedAt: 'mock-timestamp'
      });
      expect(result).toEqual({ success: true, message: 'Session accepted successfully' });
    });

    test('throws error when session does not exist', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false
      });

      await expect(TutoringSessionService.acceptTutoringSession(sessionId, tutorEmail))
        .rejects.toThrow('Error accepting session: Session not found');
    });

    test('throws error when tutor is not authorized', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          tutorEmail: 'different@example.com',
          status: 'pending'
        })
      });

      await expect(TutoringSessionService.acceptTutoringSession(sessionId, tutorEmail))
        .rejects.toThrow('Error accepting session: Unauthorized to accept this session');
    });

    test('throws error when session is not pending', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          tutorEmail: tutorEmail,
          status: 'scheduled'
        })
      });

      await expect(TutoringSessionService.acceptTutoringSession(sessionId, tutorEmail))
        .rejects.toThrow('Error accepting session: Session is no longer pending');
    });
  });

  describe('rejectTutoringSession', () => {
    const sessionId = 'session1';
    const tutorEmail = 'tutor@example.com';
    const reason = 'Not available';

    test('rejects tutoring session successfully', async () => {
      const result = await TutoringSessionService.rejectTutoringSession(sessionId, tutorEmail, reason);

      expect(mockGetDoc).toHaveBeenCalledWith('mock-doc');
      expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc', {
        status: 'rejected',
        tutorApprovalStatus: 'rejected',
        rejectionReason: reason,
        rejectedAt: 'mock-timestamp',
        updatedAt: 'mock-timestamp'
      });
      expect(result).toEqual({ success: true, message: 'Session rejected successfully' });
    });

    test('rejects session without reason', async () => {
      await TutoringSessionService.rejectTutoringSession(sessionId, tutorEmail);

      expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc', {
        status: 'rejected',
        tutorApprovalStatus: 'rejected',
        rejectionReason: '',
        rejectedAt: 'mock-timestamp',
        updatedAt: 'mock-timestamp'
      });
    });
  });

  describe('getTutorSessions', () => {
    const tutorEmail = 'tutor@example.com';
    const mockSessions = [
      {
        id: 'session1',
        studentEmail: 'student1@example.com',
        tutorEmail: tutorEmail,
        subject: 'Math',
        status: 'pending'
      },
      {
        id: 'session2',
        studentEmail: 'student2@example.com',
        tutorEmail: tutorEmail,
        subject: 'Physics',
        status: 'scheduled'
      }
    ];

    test('retrieves tutor sessions successfully', async () => {
      mockGetDocs.mockResolvedValue({
        docs: mockSessions.map(session => ({
          id: session.id,
          data: () => session
        }))
      });

      const result = await TutoringSessionService.getTutorSessions(tutorEmail);

      expect(mockCollection).toHaveBeenCalledWith('mock-db', 'tutoring_sessions');
      expect(mockWhere).toHaveBeenCalledWith('tutorEmail', '==', tutorEmail);
      expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');
      expect(result).toEqual(mockSessions);
    });

    test('handles empty results', async () => {
      mockGetDocs.mockResolvedValue({
        docs: []
      });

      const result = await TutoringSessionService.getTutorSessions(tutorEmail);

      expect(result).toEqual([]);
    });

    test('handles errors during retrieval', async () => {
      mockGetDocs.mockRejectedValue(new Error('Database error'));

      await expect(TutoringSessionService.getTutorSessions(tutorEmail))
        .rejects.toThrow('Error retrieving sessions: Database error');
    });
  });
});

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockAddDoc.mockResolvedValue({ id: 'mock-notification-id' });
    mockGetDocs.mockResolvedValue({
      docs: []
    });
    mockUpdateDoc.mockResolvedValue({});
    mockCollection.mockReturnValue('mock-collection');
    mockDoc.mockReturnValue('mock-doc');
    mockQuery.mockReturnValue('mock-query');
    mockWhere.mockReturnValue('mock-where');
    mockOrderBy.mockReturnValue('mock-order-by');
    mockLimit.mockReturnValue('mock-limit');
    mockWriteBatch.mockReturnValue({
      update: jest.fn(),
      commit: jest.fn().mockResolvedValue({})
    });
  });

  describe('createPendingSessionNotification', () => {
    const mockSessionData = {
      tutorEmail: 'tutor@example.com',
      studentEmail: 'student@example.com',
      studentName: 'John Doe',
      sessionId: 'session1',
      subject: 'Mathematics',
      scheduledDateTime: '2024-01-20T14:00:00Z'
    };

    test('creates pending session notification successfully', async () => {
      const result = await NotificationService.createPendingSessionNotification(mockSessionData);

      expect(mockAddDoc).toHaveBeenCalledWith(
        'mock-collection',
        expect.objectContaining({
          tutorEmail: mockSessionData.tutorEmail,
          studentEmail: mockSessionData.studentEmail,
          studentName: mockSessionData.studentName,
          sessionId: mockSessionData.sessionId,
          subject: mockSessionData.subject,
          scheduledDateTime: mockSessionData.scheduledDateTime,
          type: 'pending_session_request',
          title: 'New Session Request',
          message: `${mockSessionData.studentName} has requested a tutoring session for ${mockSessionData.subject}`,
          isRead: false
        })
      );
      expect(result).toEqual({ success: true, id: 'mock-notification-id' });
    });

    test('handles errors during notification creation', async () => {
      mockAddDoc.mockRejectedValue(new Error('Database error'));

      await expect(NotificationService.createPendingSessionNotification(mockSessionData))
        .rejects.toThrow('Error creating notification: Database error');
    });
  });

  describe('createSessionAcceptedNotification', () => {
    const mockSessionData = {
      sessionId: 'session1',
      studentEmail: 'student@example.com',
      tutorEmail: 'tutor@example.com',
      subject: 'Mathematics',
      scheduledDateTime: '2024-01-20T14:00:00Z'
    };

    test('creates session accepted notification successfully', async () => {
      const result = await NotificationService.createSessionAcceptedNotification(mockSessionData);

      expect(mockAddDoc).toHaveBeenCalledWith(
        'mock-collection',
        expect.objectContaining({
          studentEmail: mockSessionData.studentEmail,
          tutorEmail: mockSessionData.tutorEmail,
          sessionId: mockSessionData.sessionId,
          subject: mockSessionData.subject,
          scheduledDateTime: mockSessionData.scheduledDateTime,
          type: 'session_accepted',
          title: 'Session Accepted',
          message: `Your tutoring session for ${mockSessionData.subject} has been accepted`,
          isRead: false
        })
      );
      expect(result).toEqual({ success: true, id: 'mock-notification-id' });
    });
  });

  describe('getTutorNotifications', () => {
    const tutorEmail = 'tutor@example.com';
    const mockNotifications = [
      {
        id: 'notif1',
        tutorEmail: tutorEmail,
        type: 'pending_session_request',
        title: 'New Session Request',
        isRead: false
      },
      {
        id: 'notif2',
        tutorEmail: tutorEmail,
        type: 'session_cancelled',
        title: 'Session Cancelled',
        isRead: true
      }
    ];

    test('retrieves tutor notifications successfully', async () => {
      mockGetDocs.mockResolvedValue({
        docs: mockNotifications.map(notification => ({
          id: notification.id,
          data: () => notification
        }))
      });

      const result = await NotificationService.getTutorNotifications(tutorEmail);

      expect(mockCollection).toHaveBeenCalledWith('mock-db', 'notifications');
      expect(mockWhere).toHaveBeenCalledWith('tutorEmail', '==', tutorEmail);
      expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');
      expect(mockLimit).toHaveBeenCalledWith(50);
      expect(result).toEqual(mockNotifications);
    });

    test('uses custom limit when provided', async () => {
      mockGetDocs.mockResolvedValue({
        docs: []
      });

      await NotificationService.getTutorNotifications(tutorEmail, 25);

      expect(mockLimit).toHaveBeenCalledWith(25);
    });

    test('handles errors during retrieval', async () => {
      mockGetDocs.mockRejectedValue(new Error('Database error'));

      await expect(NotificationService.getTutorNotifications(tutorEmail))
        .rejects.toThrow('Error retrieving notifications: Database error');
    });
  });

  describe('getStudentNotifications', () => {
    const studentEmail = 'student@example.com';
    const mockNotifications = [
      {
        id: 'notif1',
        studentEmail: studentEmail,
        type: 'session_accepted',
        title: 'Session Accepted',
        isRead: false
      }
    ];

    test('retrieves student notifications successfully', async () => {
      mockGetDocs.mockResolvedValue({
        docs: mockNotifications.map(notification => ({
          id: notification.id,
          data: () => notification
        }))
      });

      const result = await NotificationService.getStudentNotifications(studentEmail);

      expect(mockCollection).toHaveBeenCalledWith('mock-db', 'notifications');
      expect(mockWhere).toHaveBeenCalledWith('studentEmail', '==', studentEmail);
      expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');
      expect(mockLimit).toHaveBeenCalledWith(50);
      expect(result).toEqual(mockNotifications);
    });
  });

  describe('markAsRead', () => {
    const notificationId = 'notif1';

    test('marks notification as read successfully', async () => {
      const result = await NotificationService.markAsRead(notificationId);

      expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc', {
        isRead: true,
        readAt: 'mock-timestamp',
        updatedAt: 'mock-timestamp'
      });
      expect(result).toEqual({ success: true });
    });

    test('handles errors during update', async () => {
      mockUpdateDoc.mockRejectedValue(new Error('Database error'));

      await expect(NotificationService.markAsRead(notificationId))
        .rejects.toThrow('Error marking notification as read: Database error');
    });
  });

  describe('markAllAsRead', () => {
    const userEmail = 'user@example.com';

    test('marks all notifications as read for tutor', async () => {
      const mockUnreadNotifications = [
        { ref: 'mock-doc1' },
        { ref: 'mock-doc2' }
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockUnreadNotifications
      });

      const mockBatch = {
        update: jest.fn(),
        commit: jest.fn().mockResolvedValue({})
      };
      mockWriteBatch.mockReturnValue(mockBatch);

      const result = await NotificationService.markAllAsRead(userEmail, 'tutor');

      expect(mockWhere).toHaveBeenCalledWith('tutorEmail', '==', userEmail);
      expect(mockWhere).toHaveBeenCalledWith('isRead', '==', false);
      expect(mockBatch.update).toHaveBeenCalledTimes(2);
      expect(mockBatch.commit).toHaveBeenCalled();
      expect(result).toEqual({ 
        success: true, 
        message: 'Marked 2 notifications as read',
        count: 2
      });
    });

    test('marks all notifications as read for student', async () => {
      const mockUnreadNotifications = [
        { ref: 'mock-doc1' }
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockUnreadNotifications
      });

      const mockBatch = {
        update: jest.fn(),
        commit: jest.fn().mockResolvedValue({})
      };
      mockWriteBatch.mockReturnValue(mockBatch);

      const result = await NotificationService.markAllAsRead(userEmail, 'student');

      expect(mockWhere).toHaveBeenCalledWith('studentEmail', '==', userEmail);
      expect(result).toEqual({ 
        success: true, 
        message: 'Marked 1 notifications as read',
        count: 1
      });
    });

    test('handles case when no unread notifications exist', async () => {
      mockGetDocs.mockResolvedValue({
        docs: []
      });

      const result = await NotificationService.markAllAsRead(userEmail, 'tutor');

      expect(result).toEqual({ 
        success: true, 
        message: 'No unread notifications found' 
      });
    });

    test('handles errors during batch update', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [{ ref: 'mock-doc1' }]
      });

      const mockBatch = {
        update: jest.fn(),
        commit: jest.fn().mockRejectedValue(new Error('Batch error'))
      };
      mockWriteBatch.mockReturnValue(mockBatch);

      await expect(NotificationService.markAllAsRead(userEmail, 'tutor'))
        .rejects.toThrow('Error marking notifications as read: Batch error');
    });
  });

  describe('deleteNotification', () => {
    const notificationId = 'notif1';

    test('deletes notification successfully', async () => {
      const result = await NotificationService.deleteNotification(notificationId);

      expect(mockDeleteDoc).toHaveBeenCalledWith('mock-doc');
      expect(result).toEqual({ success: true });
    });

    test('handles errors during deletion', async () => {
      mockDeleteDoc.mockRejectedValue(new Error('Database error'));

      await expect(NotificationService.deleteNotification(notificationId))
        .rejects.toThrow('Error deleting notification: Database error');
    });
  });
});
