/**
 * Availability Repository
 * Handles all database operations for availability data
 */

import { getFirestore, getTimestamp, parseDate } from '../firebase/admin';
import admin from 'firebase-admin';

const COLLECTION = 'availabilities';

/**
 * Safely convert value to Date
 * @private
 */
function safeToDate(value) {
  return parseDate(value);
}

/**
 * Remove undefined values from object (Firestore doesn't accept undefined)
 * @private
 */
function removeUndefinedValues(obj) {
  const cleaned = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      if (
        typeof obj[key] === 'object' &&
        obj[key] !== null &&
        !(obj[key] instanceof Date) &&
        !(obj[key] instanceof admin.firestore.Timestamp)
      ) {
        cleaned[key] = removeUndefinedValues(obj[key]);
      } else {
        cleaned[key] = obj[key];
      }
    }
  }
  return cleaned;
}

/**
 * Find availability by ID
 * @param {string} googleEventId - The Google Event ID
 * @returns {Promise<Object|null>} Availability object or null
 */
export async function findById(googleEventId) {
  try {
    const db = getFirestore();
    const docRef = db.collection(COLLECTION).doc(googleEventId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      tutorId: data.tutorId,
      title: data.title,
      location: data.location,
      startDateTime: safeToDate(data.startDateTime),
      endDateTime: safeToDate(data.endDateTime),
      googleEventId: data.googleEventId,
      eventLink: data.eventLink || data.htmlLink || null,
      recurring: data.recurring,
      recurrenceRule: data.recurrenceRule,
      sourceCalendarId: data.sourceCalendarId,
      sourceCalendarName: data.sourceCalendarName,
      course: data.course,
      createdAt: safeToDate(data.createdAt),
      updatedAt: safeToDate(data.updatedAt),
    };
  } catch (error) {
    console.error('Error finding by ID:', error);
    throw error;
  }
}

/**
 * Save availability (create or update)
 * @param {string|undefined} googleEventId - The Google Event ID
 * @param {Object} availabilityData - The availability data
 * @returns {Promise<string>} Document ID
 */
export async function save(googleEventId, availabilityData) {
  try {
    const db = getFirestore();
    const firestoreData = {
      ...availabilityData,
      googleEventId: googleEventId,
      eventLink: availabilityData.eventLink || availabilityData.htmlLink || null,
      updatedAt: getTimestamp(),
    };

    // Remove undefined values
    const cleanedData = removeUndefinedValues(firestoreData);

    if (googleEventId) {
      const docRef = db.collection(COLLECTION).doc(googleEventId);
      const docSnap = await docRef.get();
      if (!docSnap.exists) {
        cleanedData.createdAt = getTimestamp();
      }
      await docRef.set(cleanedData, { merge: true });
      return googleEventId;
    } else {
      const colRef = db.collection(COLLECTION);
      cleanedData.createdAt = getTimestamp();
      const docRef = await colRef.add(cleanedData);
      return docRef.id;
    }
  } catch (error) {
    console.error('Error saving:', error);
    throw error;
  }
}

/**
 * Delete availability
 * @param {string} googleEventId - The Google Event ID
 * @returns {Promise<void>}
 */
export async function deleteAvailability(googleEventId) {
  try {
    const db = getFirestore();
    const docRef = db.collection(COLLECTION).doc(googleEventId);
    await docRef.delete();
  } catch (error) {
    console.error('Error deleting:', error);
    throw error;
  }
}

/**
 * Check if availability exists
 * @param {string} googleEventId - The Google Event ID
 * @returns {Promise<boolean>}
 */
export async function exists(googleEventId) {
  try {
    const db = getFirestore();
    const docRef = db.collection(COLLECTION).doc(googleEventId);
    const docSnap = await docRef.get();
    return docSnap.exists;
  } catch (error) {
    console.error('Error checking existence:', error);
    throw error;
  }
}

/**
 * Find availabilities by tutor
 * @param {string} tutorId - The tutor ID
 * @param {number} limitCount - Maximum results
 * @returns {Promise<Array>}
 */
export async function findByTutor(tutorId, limitCount = 50) {
  try {
    const results = [];
    const seen = new Set();
    const db = getFirestore();

    const addFromSnapshot = (snapshot) => {
      snapshot.forEach((docSnap) => {
        if (seen.has(docSnap.id)) return;
        seen.add(docSnap.id);

        const data = docSnap.data();
        results.push({
          id: docSnap.id,
          tutorId: data.tutorId,
          title: data.title,
          location: data.location,
          startDateTime: safeToDate(data.startDateTime),
          endDateTime: safeToDate(data.endDateTime),
          googleEventId: data.googleEventId,
          eventLink: data.eventLink || data.htmlLink || null,
          recurring: data.recurring,
          recurrenceRule: data.recurrenceRule,
          sourceCalendarId: data.sourceCalendarId,
          sourceCalendarName: data.sourceCalendarName,
          course: data.course,
          createdAt: safeToDate(data.createdAt),
          updatedAt: safeToDate(data.updatedAt),
        });
      });
    };

    // Query by tutorId and order by startDateTime
    const snapshot = await db
      .collection(COLLECTION)
      .where('tutorId', '==', tutorId)
      .orderBy('startDateTime', 'asc')
      .limit(limitCount)
      .get();
    addFromSnapshot(snapshot);

    // Sort by start date
    results.sort((a, b) => {
      const tA = a.startDateTime ? a.startDateTime.getTime() : 0;
      const tB = b.startDateTime ? b.startDateTime.getTime() : 0;
      return tA - tB;
    });

    return results;
  } catch (error) {
    console.error('Error finding by tutor:', error);
    throw error;
  }
}

/**
 * Find availabilities by course
 * @param {string} course - The course name
 * @param {number} limitCount - Maximum results
 * @returns {Promise<Array>}
 */
export async function findByCourse(course, limitCount = 50) {
  try {
    const availabilities = [];
    const processedIds = new Set();
    const db = getFirestore();

    const snapshot = await db
      .collection(COLLECTION)
      .where('course', '==', course)
      .orderBy('startDateTime', 'asc')
      .limit(limitCount)
      .get();

    snapshot.forEach((doc) => {
      if (!processedIds.has(doc.id)) {
        processedIds.add(doc.id);
        const data = doc.data();
        availabilities.push({
          id: doc.id,
          tutorId: data.tutorId,
          title: data.title,
          location: data.location,
          startDateTime: safeToDate(data.startDateTime),
          endDateTime: safeToDate(data.endDateTime),
          googleEventId: data.googleEventId,
          eventLink: data.eventLink || data.htmlLink || null,
          recurring: data.recurring,
          recurrenceRule: data.recurrenceRule,
          sourceCalendarId: data.sourceCalendarId,
          sourceCalendarName: data.sourceCalendarName,
          course: data.course,
          createdAt: safeToDate(data.createdAt),
          updatedAt: safeToDate(data.updatedAt),
        });
      }
    });

    // Sort by start date
    availabilities.sort((a, b) => {
      const tA = a.startDateTime ? a.startDateTime.getTime() : 0;
      const tB = b.startDateTime ? b.startDateTime.getTime() : 0;
      return tA - tB;
    });

    return availabilities;
  } catch (error) {
    console.error('Error finding by course:', error);
    throw error;
  }
}

/**
 * Find availabilities in date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {number} limitCount - Maximum results
 * @returns {Promise<Array>}
 */
export async function findInDateRange(startDate, endDate, limitCount = 100) {
  try {
    const db = getFirestore();
    const startTimestamp = admin.firestore.Timestamp.fromDate(startDate);
    const endTimestamp = admin.firestore.Timestamp.fromDate(endDate);

    const snapshot = await db
      .collection(COLLECTION)
      .where('startDateTime', '>=', startTimestamp)
      .where('startDateTime', '<=', endTimestamp)
      .orderBy('startDateTime', 'asc')
      .limit(limitCount)
      .get();

    const availabilities = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      availabilities.push({
        id: doc.id,
        tutorId: data.tutorId,
        title: data.title,
        location: data.location,
        startDateTime: safeToDate(data.startDateTime),
        endDateTime: safeToDate(data.endDateTime),
        googleEventId: data.googleEventId,
        eventLink: data.eventLink || data.htmlLink || null,
        recurring: data.recurring,
        recurrenceRule: data.recurrenceRule,
        sourceCalendarId: data.sourceCalendarId,
        sourceCalendarName: data.sourceCalendarName,
        course: data.course,
        createdAt: safeToDate(data.createdAt),
        updatedAt: safeToDate(data.updatedAt),
      });
    });

    return availabilities;
  } catch (error) {
    console.error('Error finding in date range:', error);
    throw error;
  }
}

/**
 * Find availabilities by tutor and date range
 * @param {string} tutorId - The tutor ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>}
 */
export async function findByTutorAndDateRange(tutorId, startDate, endDate) {
  try {
    const db = getFirestore();
    const startTimestamp = admin.firestore.Timestamp.fromDate(startDate);
    const endTimestamp = admin.firestore.Timestamp.fromDate(endDate);

    const snapshot = await db
      .collection(COLLECTION)
      .where('tutorId', '==', tutorId)
      .where('startDateTime', '>=', startTimestamp)
      .where('startDateTime', '<=', endTimestamp)
      .orderBy('startDateTime', 'asc')
      .get();

    const availabilities = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      availabilities.push({
        id: doc.id,
        tutorId: data.tutorId,
        title: data.title,
        location: data.location,
        startDateTime: safeToDate(data.startDateTime),
        endDateTime: safeToDate(data.endDateTime),
        googleEventId: data.googleEventId,
        eventLink: data.eventLink || data.htmlLink || null,
        recurring: data.recurring,
        recurrenceRule: data.recurrenceRule,
        sourceCalendarId: data.sourceCalendarId,
        sourceCalendarName: data.sourceCalendarName,
        course: data.course,
        createdAt: safeToDate(data.createdAt),
        updatedAt: safeToDate(data.updatedAt),
      });
    });

    return availabilities;
  } catch (error) {
    console.error('Error finding by tutor and date range:', error);
    throw error;
  }
}

export default {
  findById,
  save,
  deleteAvailability,
  exists,
  findByTutor,
  findByCourse,
  findInDateRange,
  findByTutorAndDateRange,
};

