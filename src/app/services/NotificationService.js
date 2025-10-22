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
  addDoc,
  writeBatch
} from 'firebase/firestore';

/**
 * @typedef {import('../models/notification.model').Notification} Notification
 * @typedef {import('../models/notification.model').NotificationDetails} NotificationDetails
 */

// Note: Service files should not use i18n directly. 
// Translation should be handled in the UI components that use this service.

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
        title: 'New Tutoring Request',
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
      throw new Error(`Failed to create notification: ${error.message}`);
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
      throw new Error(`Failed to retrieve notifications: ${error.message}`);
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
      throw new Error(`Failed to mark notification as read: ${error.message}`);
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
      throw new Error(`Failed to delete notification: ${error.message}`);
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
      throw new Error(`Failed to create notification: ${error.message}`);
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
      throw new Error(`Failed to create notification: ${error.message}`);
    }
  }

  // Create notification when session is cancelled
  static async createSessionCancelledNotification(sessionData) {
    try {
      const cancellerRole = sessionData.cancellerRole === 'tutor' ? 'tutor' : 'student';
      
      const notificationData = {
        recipientEmail: sessionData.recipientEmail,
        cancelledBy: sessionData.cancelledBy,
        cancellerRole: sessionData.cancellerRole,
        sessionId: sessionData.sessionId,
        subject: sessionData.subject,
        scheduledDateTime: sessionData.scheduledDateTime,
        reason: sessionData.reason || 'No reason provided',
        type: 'session_cancelled',
        title: 'Session Cancelled',
        message: `Your tutoring session for ${sessionData.subject} has been cancelled by the ${cancellerRole}. ${sessionData.reason || 'No reason provided'}`,
        isRead: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), notificationData);
      console.log('Session cancelled notification created with ID:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating session cancelled notification:', error);
      throw new Error(`Failed to create notification: ${error.message}`);
    }
  }

  // Create notification when session is rescheduled
  static async createSessionRescheduledNotification(sessionData) {
    try {
      const oldDate = new Date(sessionData.oldDateTime).toLocaleString('es-ES', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      const newDate = new Date(sessionData.newDateTime).toLocaleString('es-ES', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const notificationData = {
        tutorEmail: sessionData.tutorEmail,
        studentEmail: sessionData.studentEmail,
        studentName: sessionData.studentName,
        sessionId: sessionData.sessionId,
        subject: sessionData.subject,
        oldDateTime: sessionData.oldDateTime,
        newDateTime: sessionData.newDateTime,
        reason: sessionData.reason || 'No reason provided',
        type: 'session_rescheduled',
        title: 'Session Rescheduled',
        message: `Your tutoring session with ${sessionData.studentName} for ${sessionData.subject} has been rescheduled from ${oldDate} to ${newDate}. ${sessionData.reason || 'No reason provided'}`,
        isRead: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), notificationData);
      console.log('Session rescheduled notification created with ID:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating session rescheduled notification:', error);
      throw new Error(`Failed to create notification: ${error.message}`);
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
      throw new Error(`Failed to retrieve notifications: ${error.message}`);
    }
  }

  // Create a notification when a session is rejected
  static async createSessionRejectedNotification(sessionData) {
    try {
      const notificationData = {
        studentEmail: sessionData.studentEmail,
        sessionId: sessionData.sessionId,
        type: 'session_rejected',
        title: 'Session Rejected',
        message: `Your tutoring session request has been rejected${sessionData.reason ? `: ${sessionData.reason}` : ''}`,
        isRead: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), notificationData);
      console.log('Session rejected notification created with ID:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating session rejected notification:', error);
      throw new Error(`Failed to create notification: ${error.message}`);
    }
  }

  // Create session reminder notification for students
  static async createSessionReminderNotification(sessionData) {
    try {
      const notificationData = {
        studentEmail: sessionData.studentEmail,
        sessionId: sessionData.sessionId,
        type: 'session_reminder',
        title: 'Session Reminder',
        message: `Reminder: You have a tutoring session for ${sessionData.subject} with ${sessionData.tutorName}`,
        isRead: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), notificationData);
      console.log('Session reminder notification created with ID:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating session reminder notification:', error);
      throw new Error(`Failed to create notification: ${error.message}`);
    }
  }

  // Create payment reminder notification for students
  static async createPaymentReminderNotification(sessionData) {
    try {
      const notificationData = {
        studentEmail: sessionData.studentEmail,
        sessionId: sessionData.sessionId,
        type: 'payment_reminder',
        title: 'Payment Reminder',
        message: `Please complete the payment for your tutoring session in ${sessionData.subject}`,
        isRead: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), notificationData);
      console.log('Payment reminder notification created with ID:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating payment reminder notification:', error);
      throw new Error(`Failed to create notification: ${error.message}`);
    }
  }

  // Mark all notifications as read for a specific user
  static async markAllAsRead(userEmail, userType = 'tutor') {
    try {
      let queryRef;
      
      if (userType === 'tutor') {
        queryRef = query(
          collection(db, this.COLLECTION_NAME),
          where('tutorEmail', '==', userEmail),
          where('isRead', '==', false)
        );
      } else {
        queryRef = query(
          collection(db, this.COLLECTION_NAME),
          where('studentEmail', '==', userEmail),
          where('isRead', '==', false)
        );
      }

      const snapshot = await getDocs(queryRef);
      
      if (snapshot.empty) {
        return { success: true, message: 'No unread notifications' };
      }

      // Batch update all unread notifications
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          isRead: true,
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();
      
      console.log(`Marked ${snapshot.docs.length} notifications as read for ${userType}: ${userEmail}`);
      return { 
        success: true, 
        message: `Successfully marked ${snapshot.docs.length} notifications as read`,
        count: snapshot.docs.length
      };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }
  }
}
