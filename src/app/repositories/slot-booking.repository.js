import { db } from '../../firebaseConfig';

import { 
  collection, 
  doc,
  addDoc,
  getDocs,
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

/**
 * @typedef {import('../entities/slot_bookings.entity').SlotBooking} SlotBooking
 */

/**
 * SlotBookingRepository - Data access layer for SlotBooking entity
 * Handles all Firebase operations for slot bookings
 */
export class SlotBookingRepository {
  static COLLECTION = 'slot_bookings';

  /**
   * Create a new slot booking
   * @param {Partial<SlotBooking>} bookingData - Booking data
   * @returns {Promise<string>} Booking ID
   */
  static async create(bookingData) {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTION), {
        ...bookingData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('[SlotBookingRepository] Error creating booking:', error);
      throw error;
    }
  }

  /**
   * Delete slot booking
   * @param {string} bookingId - Booking ID
   * @returns {Promise<void>}
   */
  static async delete(bookingId) {
    try {
      const docRef = doc(db, this.COLLECTION, bookingId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('[SlotBookingRepository] Error deleting booking:', error);
      throw error;
    }
  }

  /**
   * Find booking by slot
   * @param {string} parentAvailabilityId - Parent availability ID
   * @param {number} slotIndex - Slot index
   * @returns {Promise<SlotBooking|null>}
   */
  static async findBySlot(parentAvailabilityId, slotIndex) {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('parentAvailabilityId', '==', parentAvailabilityId),
        where('slotIndex', '==', slotIndex)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        ...data,
        bookedAt: data.bookedAt?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        slotStartTime: data.slotStartTime?.toDate(),
        slotEndTime: data.slotEndTime?.toDate(),
      };
    } catch (error) {
      console.error('[SlotBookingRepository] Error finding by slot:', error);
      throw error;
    }
  }

  /**
   * Find bookings for availability
   * @param {string} parentAvailabilityId - Parent availability ID
   * @returns {Promise<SlotBooking[]>}
   */
  static async findByAvailability(parentAvailabilityId) {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('parentAvailabilityId', '==', parentAvailabilityId)
      );

      const querySnapshot = await getDocs(q);
      const bookings = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        bookings.push({
          id: doc.id,
          ...data,
          bookedAt: data.bookedAt?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          slotStartTime: data.slotStartTime?.toDate(),
          slotEndTime: data.slotEndTime?.toDate(),
        });
      });

      return bookings;
    } catch (error) {
      console.error('[SlotBookingRepository] Error finding by availability:', error);
      throw error;
    }
  }

  /**
   * Find bookings by tutor
   * @param {string} tutorEmail - Tutor email
   * @returns {Promise<SlotBooking[]>}
   */
  static async findByTutor(tutorEmail) {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('tutorEmail', '==', tutorEmail),
        orderBy('slotStartTime', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const bookings = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        bookings.push({
          id: doc.id,
          ...data,
          bookedAt: data.bookedAt?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          slotStartTime: data.slotStartTime?.toDate(),
          slotEndTime: data.slotEndTime?.toDate(),
        });
      });

      return bookings;
    } catch (error) {
      console.error('[SlotBookingRepository] Error finding by tutor:', error);
      throw error;
    }
  }

  /**
   * Find bookings by student
   * @param {string} studentEmail - Student email
   * @returns {Promise<SlotBooking[]>}
   */
  static async findByStudent(studentEmail) {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('studentEmail', '==', studentEmail),
        orderBy('slotStartTime', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const bookings = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        bookings.push({
          id: doc.id,
          ...data,
          bookedAt: data.bookedAt?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          slotStartTime: data.slotStartTime?.toDate(),
          slotEndTime: data.slotEndTime?.toDate(),
        });
      });

      return bookings;
    } catch (error) {
      console.error('[SlotBookingRepository] Error finding by student:', error);
      throw error;
    }
  }

  /**
   * Find booking by session
   * @param {string} sessionId - Session ID
   * @returns {Promise<SlotBooking|null>}
   */
  static async findBySession(sessionId) {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('sessionId', '==', sessionId)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        ...data,
        bookedAt: data.bookedAt?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        slotStartTime: data.slotStartTime?.toDate(),
        slotEndTime: data.slotEndTime?.toDate(),
      };
    } catch (error) {
      console.error('[SlotBookingRepository] Error finding by session:', error);
      throw error;
    }
  }

  /**
   * Delete bookings by slot and session
   * @param {string} parentAvailabilityId - Parent availability ID
   * @param {number} slotIndex - Slot index
   * @param {string} sessionId - Session ID
   * @returns {Promise<number>} Number of deleted bookings
   */
  static async deleteBySlotAndSession(parentAvailabilityId, slotIndex, sessionId) {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('parentAvailabilityId', '==', parentAvailabilityId),
        where('slotIndex', '==', slotIndex),
        where('sessionId', '==', sessionId)
      );

      const querySnapshot = await getDocs(q);
      let deletedCount = 0;
      
      for (const doc of querySnapshot.docs) {
        await deleteDoc(doc.ref);
        deletedCount++;
      }

      return deletedCount;
    } catch (error) {
      console.error('[SlotBookingRepository] Error deleting by slot and session:', error);
      throw error;
    }
  }
}

