import { db } from '../../firebaseConfig';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc,
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp,
  addDoc
} from 'firebase/firestore';

export class NotificationService {
  static COLLECTION_NAME = 'notifications';

  // Create a notification for a tutor about a pending session
  static async createPendingSessionNotification(sessionData) {
    try {
      const notificationData = {
        tutorEmail: sessionData.tutorEmail,
        studentEmail: sessionData.studentEmail,
        studentName: sessionData.studentName,
        sessionId: sessionData.sessionId,
        subject: sessionData.subject,
        scheduledDateTime: sessionData.scheduledDateTime,
        type: 'pending_session_request',
        title: 'New Session Request',
        message: `${sessionData.studentName} has requested a tutoring session for ${sessionData.subject}`,
        isRead: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), notificationData);
      console.log('Pending session notification created with ID:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating pending session notification:', error);
      throw new Error(`Error creating notification: ${error.message}`);
    }
  }

  // Get notifications for a tutor
  static async getTutorNotifications(tutorEmail, limitCount = 50) {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('tutorEmail', '==', tutorEmail),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const notifications = [];

      querySnapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          scheduledDateTime: doc.data().scheduledDateTime?.toDate(),
        });
      });

      return notifications;
    } catch (error) {
      console.error('Error getting tutor notifications:', error);
      throw new Error(`Error getting notifications: ${error.message}`);
    }
  }

  // Mark notification as read
  static async markNotificationAsRead(notificationId) {
    try {
      const notificationRef = doc(db, this.COLLECTION_NAME, notificationId);
      await updateDoc(notificationRef, {
        isRead: true,
        readAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log('Notification marked as read:', notificationId);
      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error(`Error marking notification as read: ${error.message}`);
    }
  }

  // Delete notification
  static async deleteNotification(notificationId) {
    try {
      const notificationRef = doc(db, this.COLLECTION_NAME, notificationId);
      await deleteDoc(notificationRef);

      console.log('Notification deleted:', notificationId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw new Error(`Error deleting notification: ${error.message}`);
    }
  }

  // Get unread notification count for a tutor
  static async getUnreadNotificationCount(tutorEmail) {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('tutorEmail', '==', tutorEmail),
        where('isRead', '==', false)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      return 0;
    }
  }

  // Create notification when session is accepted
  static async createSessionAcceptedNotification(sessionData) {
    try {
      const notificationData = {
        studentEmail: sessionData.studentEmail,
        tutorEmail: sessionData.tutorEmail,
        sessionId: sessionData.sessionId,
        subject: sessionData.subject,
        scheduledDateTime: sessionData.scheduledDateTime,
        type: 'session_accepted',
        title: 'Session Accepted',
        message: `Your tutoring session for ${sessionData.subject} has been accepted`,
        isRead: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), notificationData);
      console.log('Session accepted notification created with ID:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating session accepted notification:', error);
      throw new Error(`Error creating notification: ${error.message}`);
    }
  }

  // Create notification when session is declined
  static async createSessionDeclinedNotification(sessionData) {
    try {
      const notificationData = {
        studentEmail: sessionData.studentEmail,
        tutorEmail: sessionData.tutorEmail,
        sessionId: sessionData.sessionId,
        subject: sessionData.subject,
        scheduledDateTime: sessionData.scheduledDateTime,
        type: 'session_declined',
        title: 'Session Declined',
        message: `Your tutoring session for ${sessionData.subject} has been declined`,
        isRead: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), notificationData);
      console.log('Session declined notification created with ID:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating session declined notification:', error);
      throw new Error(`Error creating notification: ${error.message}`);
    }
  }

  // Create notification when session is cancelled
  static async createSessionCancelledNotification(sessionData) {
    try {
      const cancellerName = sessionData.cancellerRole === 'tutor' ? 'el tutor' : 'el estudiante';
      const notificationData = {
        recipientEmail: sessionData.recipientEmail,
        cancelledBy: sessionData.cancelledBy,
        cancellerRole: sessionData.cancellerRole,
        sessionId: sessionData.sessionId,
        subject: sessionData.subject,
        scheduledDateTime: sessionData.scheduledDateTime,
        reason: sessionData.reason || 'Sin razón especificada',
        type: 'session_cancelled',
        title: 'Sesión Cancelada',
        message: `Tu tutoría de ${sessionData.subject} ha sido cancelada por ${cancellerName}. Motivo: ${sessionData.reason || 'Sin razón especificada'}`,
        isRead: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), notificationData);
      console.log('Session cancelled notification created with ID:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating session cancelled notification:', error);
      throw new Error(`Error creating notification: ${error.message}`);
    }
  }

  // Get notifications for a student
  static async getStudentNotifications(studentEmail, limitCount = 50) {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('studentEmail', '==', studentEmail),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const notifications = [];

      querySnapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          scheduledDateTime: doc.data().scheduledDateTime?.toDate(),
        });
      });

      return notifications;
    } catch (error) {
      console.error('Error getting student notifications:', error);
      throw new Error(`Error getting notifications: ${error.message}`);
    }
  }

  // Create a notification when a session is accepted
  static async createSessionAcceptedNotification(sessionData) {
    try {
      const notificationData = {
        studentEmail: sessionData.studentEmail,
        sessionId: sessionData.sessionId,
        type: 'session_accepted',
        title: 'Sesión Aprobada',
        message: 'Tu solicitud de tutoría ha sido aprobada por el tutor',
        isRead: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), notificationData);
      console.log('Session accepted notification created with ID:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating session accepted notification:', error);
      throw new Error(`Error creating notification: ${error.message}`);
    }
  }

  // Create a notification when a session is rejected
  static async createSessionRejectedNotification(sessionData) {
    try {
      const notificationData = {
        studentEmail: sessionData.studentEmail,
        sessionId: sessionData.sessionId,
        type: 'session_rejected',
        title: 'Sesión Rechazada',
        message: `Tu solicitud de tutoría ha sido rechazada${sessionData.reason ? ': ' + sessionData.reason : ''}`,
        isRead: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), notificationData);
      console.log('Session rejected notification created with ID:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating session rejected notification:', error);
      throw new Error(`Error creating notification: ${error.message}`);
    }
  }

  // Get notifications for a student
  static async getStudentNotifications(studentEmail, limitCount = 50) {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('studentEmail', '==', studentEmail),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const notifications = [];

      querySnapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          scheduledDateTime: doc.data().scheduledDateTime?.toDate(),
        });
      });

      return notifications;
    } catch (error) {
      console.error('Error getting student notifications:', error);
      throw new Error(`Error getting notifications: ${error.message}`);
    }
  }

  // Create session reminder notification for students
  static async createSessionReminderNotification(sessionData) {
    try {
      const notificationData = {
        studentEmail: sessionData.studentEmail,
        sessionId: sessionData.sessionId,
        type: 'session_reminder',
        title: 'Recordatorio de Sesión',
        message: `Tu sesión de ${sessionData.subject} con ${sessionData.tutorName} es en 1 hora`,
        isRead: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), notificationData);
      console.log('Session reminder notification created with ID:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating session reminder notification:', error);
      throw new Error(`Error creating notification: ${error.message}`);
    }
  }

  // Create payment reminder notification for students
  static async createPaymentReminderNotification(sessionData) {
    try {
      const notificationData = {
        studentEmail: sessionData.studentEmail,
        sessionId: sessionData.sessionId,
        type: 'payment_reminder',
        title: 'Recordatorio de Pago',
        message: `Recuerda realizar el pago para tu sesión de ${sessionData.subject}`,
        isRead: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), notificationData);
      console.log('Payment reminder notification created with ID:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating payment reminder notification:', error);
      throw new Error(`Error creating notification: ${error.message}`);
    }
  }
}
