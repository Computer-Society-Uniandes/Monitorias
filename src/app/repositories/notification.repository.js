import { db } from '../../firebaseConfig';

import { 
  collection, 
  doc,
  addDoc,
  getDocs,
  updateDoc, 
  query, 
  where, 
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';

/**
 * @typedef {import('../entities/notification.entity').Notification} Notification
 */

/**
 * NotificationRepository - Data access layer for Notification entity
 * Handles all Firebase operations for notifications
 */
export class NotificationRepository {
  static COLLECTION = 'notifications';

  /**
   * Create a new notification
   * @param {Partial<Notification>} notificationData - Notification data
   * @returns {Promise<string>} Notification ID
   */
  static async create(notificationData) {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTION), {
        ...notificationData,
        isRead: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('[NotificationRepository] Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Update notification
   * @param {string} notificationId - Notification ID
   * @param {Partial<Notification>} updateData - Data to update
   * @returns {Promise<void>}
   */
  static async update(notificationId, updateData) {
    try {
      const docRef = doc(db, this.COLLECTION, notificationId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('[NotificationRepository] Error updating notification:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<void>}
   */
  static async markAsRead(notificationId) {
    try {
      const docRef = doc(db, this.COLLECTION, notificationId);
      await updateDoc(docRef, {
        isRead: true,
        readAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('[NotificationRepository] Error marking as read:', error);
      throw error;
    }
  }

  /**
   * Find notifications by tutor
   * @param {string} tutorEmail - Tutor email
   * @param {number} limitCount - Limit results
   * @returns {Promise<Notification[]>}
   */
  static async findByTutor(tutorEmail, limitCount = 50) {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('tutorEmail', '==', tutorEmail),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const notifications = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          readAt: data.readAt?.toDate(),
          scheduledDateTime: data.scheduledDateTime?.toDate(),
        });
      });

      return notifications;
    } catch (error) {
      console.error('[NotificationRepository] Error finding by tutor:', error);
      throw error;
    }
  }

  /**
   * Find notifications by student
   * @param {string} studentEmail - Student email
   * @param {number} limitCount - Limit results
   * @returns {Promise<Notification[]>}
   */
  static async findByStudent(studentEmail, limitCount = 50) {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('studentEmail', '==', studentEmail),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const notifications = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          readAt: data.readAt?.toDate(),
          scheduledDateTime: data.scheduledDateTime?.toDate(),
        });
      });

      return notifications;
    } catch (error) {
      console.error('[NotificationRepository] Error finding by student:', error);
      throw error;
    }
  }

  /**
   * Find unread notifications by tutor
   * @param {string} tutorEmail - Tutor email
   * @returns {Promise<Notification[]>}
   */
  static async findUnreadByTutor(tutorEmail) {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('tutorEmail', '==', tutorEmail),
        where('isRead', '==', false),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const notifications = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          scheduledDateTime: data.scheduledDateTime?.toDate(),
        });
      });

      return notifications;
    } catch (error) {
      console.error('[NotificationRepository] Error finding unread by tutor:', error);
      throw error;
    }
  }

  /**
   * Find unread notifications by student
   * @param {string} studentEmail - Student email
   * @returns {Promise<Notification[]>}
   */
  static async findUnreadByStudent(studentEmail) {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('studentEmail', '==', studentEmail),
        where('isRead', '==', false),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const notifications = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          scheduledDateTime: data.scheduledDateTime?.toDate(),
        });
      });

      return notifications;
    } catch (error) {
      console.error('[NotificationRepository] Error finding unread by student:', error);
      throw error;
    }
  }

  /**
   * Find notification by session
   * @param {string} sessionId - Session ID
   * @returns {Promise<Notification[]>}
   */
  static async findBySession(sessionId) {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('sessionId', '==', sessionId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const notifications = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          readAt: data.readAt?.toDate(),
          scheduledDateTime: data.scheduledDateTime?.toDate(),
        });
      });

      return notifications;
    } catch (error) {
      console.error('[NotificationRepository] Error finding by session:', error);
      throw error;
    }
  }
}

