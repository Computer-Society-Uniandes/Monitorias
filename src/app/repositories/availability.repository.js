import { db } from '../firebaseServerConfig';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

/**
 * @typedef {import('../entities/availability.entity').Availability} Availability
 */

/**
 * AvailabilityRepository - Data access layer for Availability entity
 * Handles all Firebase operations for availabilities
 */
export class AvailabilityRepository {
  static COLLECTION = 'availabilities';

  /**
   * Find availability by ID (Google Event ID)
   * @param {string} googleEventId - Google Calendar event ID
   * @returns {Promise<Availability|null>}
   */
  static async findById(googleEventId) {
    try {
      const docRef = doc(db, this.COLLECTION, googleEventId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        syncedAt: data.syncedAt?.toDate(),
        startDateTime: data.startDateTime?.toDate(),
        endDateTime: data.endDateTime?.toDate(),
      };
    } catch (error) {
      console.error('[AvailabilityRepository] Error finding by ID:', error);
      throw error;
    }
  }

  /**
   * Save or update availability
   * @param {string} googleEventId - Google Calendar event ID
   * @param {Partial<Availability>} availabilityData - Availability data
   * @returns {Promise<string>} Document ID
   */
  static async save(googleEventId, availabilityData) {
    try {
      const docRef = doc(db, this.COLLECTION, googleEventId);
      
      const firestoreData = {
        ...availabilityData,
        googleEventId,
        updatedAt: serverTimestamp(),
        syncedAt: serverTimestamp()
      };

      // Add createdAt if document doesn't exist
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        firestoreData.createdAt = serverTimestamp();
      }

      await setDoc(docRef, firestoreData, { merge: true });
      return googleEventId;
    } catch (error) {
      console.error('[AvailabilityRepository] Error saving:', error);
      throw error;
    }
  }

  /**
   * Delete availability
   * @param {string} googleEventId - Google Calendar event ID
   * @returns {Promise<void>}
   */
  static async delete(googleEventId) {
    try {
      const docRef = doc(db, this.COLLECTION, googleEventId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('[AvailabilityRepository] Error deleting:', error);
      throw error;
    }
  }

  /**
   * Check if availability exists
   * @param {string} googleEventId - Google Calendar event ID
   * @returns {Promise<boolean>}
   */
  static async exists(googleEventId) {
    try {
      const docRef = doc(db, this.COLLECTION, googleEventId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      console.error('[AvailabilityRepository] Error checking existence:', error);
      throw error;
    }
  }

  /**
   * Find availabilities by tutor
   * @param {string} tutorId - Tutor ID or email
   * @param {number} limitCount - Limit results
   * @returns {Promise<Availability[]>}
   */
  static async findByTutor(tutorId, limitCount = 50) {
    try {
      const results = [];
      const seen = new Set();

      // Helper to process snapshots
      const addFromSnapshot = (snapshot) => {
        snapshot.forEach((docSnap) => {
          if (seen.has(docSnap.id)) return;
          seen.add(docSnap.id);
          
          const data = docSnap.data();
          results.push({
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            syncedAt: data.syncedAt?.toDate(),
            startDateTime: data.startDateTime?.toDate(),
            endDateTime: data.endDateTime?.toDate(),
          });
        });
      };

      // Try by tutorId with orderBy
      try {
        const q = query(
          collection(db, this.COLLECTION),
          where('tutorId', '==', tutorId),
          orderBy('startDateTime', 'asc'),
          limit(limitCount)
        );
        const snapshot = await getDocs(q);
        addFromSnapshot(snapshot);
      } catch (error) {
        // Fallback without orderBy
        const q = query(
          collection(db, this.COLLECTION),
          where('tutorId', '==', tutorId),
          limit(limitCount)
        );
        const snapshot = await getDocs(q);
        addFromSnapshot(snapshot);
      }

      // Try by tutorEmail with orderBy
      try {
        const q = query(
          collection(db, this.COLLECTION),
          where('tutorEmail', '==', tutorId),
          orderBy('startDateTime', 'asc'),
          limit(limitCount)
        );
        const snapshot = await getDocs(q);
        addFromSnapshot(snapshot);
      } catch (error) {
        // Fallback without orderBy
        const q = query(
          collection(db, this.COLLECTION),
          where('tutorEmail', '==', tutorId),
          limit(limitCount)
        );
        const snapshot = await getDocs(q);
        addFromSnapshot(snapshot);
      }

      // Sort by start date
      results.sort((a, b) => {
        const dateA = a.startDateTime ? new Date(a.startDateTime) : new Date(0);
        const dateB = b.startDateTime ? new Date(b.startDateTime) : new Date(0);
        return dateA - dateB;
      });

      return results;
    } catch (error) {
      console.error('[AvailabilityRepository] Error finding by tutor:', error);
      throw error;
    }
  }

  /**
   * Find availabilities by subject
   * @param {string} subject - Subject name
   * @param {number} limitCount - Limit results
   * @returns {Promise<Availability[]>}
   */
  static async findBySubject(subject, limitCount = 50) {
    try {
      const availabilities = [];
      const processedIds = new Set();

      // Search by subject field
      try {
        const q = query(
          collection(db, this.COLLECTION),
          where('subject', '==', subject),
          orderBy('startDateTime', 'asc'),
          limit(limitCount)
        );

        const snapshot = await getDocs(q);
        snapshot.forEach((doc) => {
          if (!processedIds.has(doc.id)) {
            processedIds.add(doc.id);
            const data = doc.data();
            availabilities.push({
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate(),
              updatedAt: data.updatedAt?.toDate(),
              syncedAt: data.syncedAt?.toDate(),
              startDateTime: data.startDateTime?.toDate(),
              endDateTime: data.endDateTime?.toDate(),
            });
          }
        });
      } catch (error) {
        // Fallback without orderBy
        const q = query(
          collection(db, this.COLLECTION),
          where('subject', '==', subject),
          limit(limitCount)
        );

        const snapshot = await getDocs(q);
        snapshot.forEach((doc) => {
          if (!processedIds.has(doc.id)) {
            processedIds.add(doc.id);
            const data = doc.data();
            availabilities.push({
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate(),
              updatedAt: data.updatedAt?.toDate(),
              syncedAt: data.syncedAt?.toDate(),
              startDateTime: data.startDateTime?.toDate(),
              endDateTime: data.endDateTime?.toDate(),
            });
          }
        });
      }

      // Search by subjects array
      try {
        const q = query(
          collection(db, this.COLLECTION),
          where('subjects', 'array-contains', subject),
          orderBy('startDateTime', 'asc'),
          limit(limitCount)
        );

        const snapshot = await getDocs(q);
        snapshot.forEach((doc) => {
          if (!processedIds.has(doc.id)) {
            processedIds.add(doc.id);
            const data = doc.data();
            availabilities.push({
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate(),
              updatedAt: data.updatedAt?.toDate(),
              syncedAt: data.syncedAt?.toDate(),
              startDateTime: data.startDateTime?.toDate(),
              endDateTime: data.endDateTime?.toDate(),
            });
          }
        });
      } catch (error) {
        // Fallback without orderBy
        const q = query(
          collection(db, this.COLLECTION),
          where('subjects', 'array-contains', subject),
          limit(limitCount)
        );

        const snapshot = await getDocs(q);
        snapshot.forEach((doc) => {
          if (!processedIds.has(doc.id)) {
            processedIds.add(doc.id);
            const data = doc.data();
            availabilities.push({
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate(),
              updatedAt: data.updatedAt?.toDate(),
              syncedAt: data.syncedAt?.toDate(),
              startDateTime: data.startDateTime?.toDate(),
              endDateTime: data.endDateTime?.toDate(),
            });
          }
        });
      }

      // Sort by start date
      availabilities.sort((a, b) => {
        const dateA = new Date(a.startDateTime);
        const dateB = new Date(b.startDateTime);
        return dateA - dateB;
      });

      return availabilities;
    } catch (error) {
      console.error('[AvailabilityRepository] Error finding by subject:', error);
      throw error;
    }
  }

  /**
   * Find availabilities in date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {number} limitCount - Limit results
   * @returns {Promise<Availability[]>}
   */
  static async findInDateRange(startDate, endDate, limitCount = 100) {
    try {
      const startTimestamp = Timestamp.fromDate(startDate);
      const endTimestamp = Timestamp.fromDate(endDate);

      const q = query(
        collection(db, this.COLLECTION),
        where('startDateTime', '>=', startTimestamp),
        where('startDateTime', '<=', endTimestamp),
        orderBy('startDateTime', 'asc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const availabilities = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        availabilities.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          syncedAt: data.syncedAt?.toDate(),
          startDateTime: data.startDateTime?.toDate(),
          endDateTime: data.endDateTime?.toDate(),
        });
      });

      return availabilities;
    } catch (error) {
      console.error('[AvailabilityRepository] Error finding in date range:', error);
      throw error;
    }
  }

  /**
   * Find availabilities by tutor and date range
   * @param {string} tutorEmail - Tutor email
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Availability[]>}
   */
  static async findByTutorAndDateRange(tutorEmail, startDate, endDate) {
    try {
      const startTimestamp = Timestamp.fromDate(startDate);
      const endTimestamp = Timestamp.fromDate(endDate);

      const q = query(
        collection(db, this.COLLECTION),
        where('tutorEmail', '==', tutorEmail),
        where('startDateTime', '>=', startTimestamp),
        where('startDateTime', '<=', endTimestamp),
        orderBy('startDateTime', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const availabilities = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        availabilities.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          syncedAt: data.syncedAt?.toDate(),
          startDateTime: data.startDateTime?.toDate(),
          endDateTime: data.endDateTime?.toDate(),
        });
      });

      return availabilities;
    } catch (error) {
      console.error('[AvailabilityRepository] Error finding by tutor and date range:', error);
      throw error;
    }
  }
}

