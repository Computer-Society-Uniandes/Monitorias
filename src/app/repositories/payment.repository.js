import { db } from '../firebaseConfig';
import { 
  collection, 
  doc,
  addDoc,
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

/**
 * @typedef {import('../entities/payment.entity').Payment} Payment
 */

/**
 * PaymentRepository - Data access layer for Payment entity
 * Handles all Firebase operations for payments
 */
export class PaymentRepository {
  static COLLECTION = 'payments';

  /**
   * Create a new payment
   * @param {Partial<Payment>} paymentData - Payment data
   * @returns {Promise<string>} Payment ID
   */
  static async create(paymentData) {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTION), {
        ...paymentData,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('[PaymentRepository] Error creating payment:', error);
      throw error;
    }
  }

  /**
   * Find payments by student
   * @param {string} studentEmail - Student email
   * @returns {Promise<Payment[]>}
   */
  static async findByStudent(studentEmail) {
    try {
      const normalizedEmail = String(studentEmail).trim().toLowerCase();
      let snapshot = null;

      // Try with orderBy
      try {
        const q = query(
          collection(db, this.COLLECTION),
          where('studentEmail', '==', normalizedEmail),
          orderBy('date_payment', 'desc')
        );
        snapshot = await getDocs(q);
      } catch (error) {
        // Fallback without orderBy if index doesn't exist
        const q = query(
          collection(db, this.COLLECTION),
          where('studentEmail', '==', normalizedEmail)
        );
        snapshot = await getDocs(q);
      }

      const payments = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Normalize email for comparison
        const storedEmail = (data.studentEmail || '').trim().toLowerCase();
        
        if (storedEmail === normalizedEmail) {
          const rawDate = data.date_payment;
          let datePayment = null;
          
          if (rawDate?.toDate) {
            datePayment = rawDate.toDate();
          } else if (typeof rawDate === 'string') {
            const parsed = new Date(rawDate);
            datePayment = isNaN(parsed) ? null : parsed;
          } else if (rawDate instanceof Date) {
            datePayment = rawDate;
          }

          payments.push({
            id: doc.id,
            ...data,
            date_payment: datePayment,
            createdAt: data.createdAt?.toDate(),
          });
        }
      });

      // Sort by date descending
      payments.sort((a, b) => {
        const dateA = a.date_payment ? a.date_payment.getTime() : 0;
        const dateB = b.date_payment ? b.date_payment.getTime() : 0;
        return dateB - dateA;
      });

      return payments;
    } catch (error) {
      console.error('[PaymentRepository] Error finding by student:', error);
      throw error;
    }
  }

  /**
   * Find payments by tutor
   * @param {string} tutorEmail - Tutor email
   * @returns {Promise<Payment[]>}
   */
  static async findByTutor(tutorEmail) {
    try {
      const normalizedEmail = String(tutorEmail).trim().toLowerCase();
      let snapshot = null;

      // Try with orderBy
      try {
        const q = query(
          collection(db, this.COLLECTION),
          where('tutorEmail', '==', normalizedEmail),
          orderBy('date_payment', 'desc')
        );
        snapshot = await getDocs(q);
      } catch (error) {
        // Fallback without orderBy if index doesn't exist
        const q = query(
          collection(db, this.COLLECTION),
          where('tutorEmail', '==', normalizedEmail)
        );
        snapshot = await getDocs(q);
      }

      const payments = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Normalize email for comparison
        const storedEmail = (data.tutorEmail || '').trim().toLowerCase();
        
        if (storedEmail === normalizedEmail) {
          const rawDate = data.date_payment;
          let datePayment = null;
          
          if (rawDate?.toDate) {
            datePayment = rawDate.toDate();
          } else if (typeof rawDate === 'string') {
            const parsed = new Date(rawDate);
            datePayment = isNaN(parsed) ? null : parsed;
          } else if (rawDate instanceof Date) {
            datePayment = rawDate;
          }

          payments.push({
            id: doc.id,
            ...data,
            date_payment: datePayment,
            createdAt: data.createdAt?.toDate(),
          });
        }
      });

      // Sort by date descending
      payments.sort((a, b) => {
        const dateA = a.date_payment ? a.date_payment.getTime() : 0;
        const dateB = b.date_payment ? b.date_payment.getTime() : 0;
        return dateB - dateA;
      });

      return payments;
    } catch (error) {
      console.error('[PaymentRepository] Error finding by tutor:', error);
      throw error;
    }
  }

  /**
   * Find payment by transaction ID
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Payment|null>}
   */
  static async findByTransactionId(transactionId) {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('transactionID', '==', transactionId)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      const rawDate = data.date_payment;
      let datePayment = null;
      
      if (rawDate?.toDate) {
        datePayment = rawDate.toDate();
      } else if (typeof rawDate === 'string') {
        const parsed = new Date(rawDate);
        datePayment = isNaN(parsed) ? null : parsed;
      } else if (rawDate instanceof Date) {
        datePayment = rawDate;
      }

      return {
        id: doc.id,
        ...data,
        date_payment: datePayment,
        createdAt: data.createdAt?.toDate(),
      };
    } catch (error) {
      console.error('[PaymentRepository] Error finding by transaction ID:', error);
      throw error;
    }
  }

  /**
   * Find payments by student and date range
   * @param {string} studentEmail - Student email
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Payment[]>}
   */
  static async findByStudentAndDateRange(studentEmail, startDate, endDate) {
    try {
      const allPayments = await this.findByStudent(studentEmail);
      
      return allPayments.filter(payment => {
        if (!payment.date_payment) return false;
        return payment.date_payment >= startDate && payment.date_payment <= endDate;
      });
    } catch (error) {
      console.error('[PaymentRepository] Error finding by student and date range:', error);
      throw error;
    }
  }

  /**
   * Find payments by tutor and date range
   * @param {string} tutorEmail - Tutor email
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Payment[]>}
   */
  static async findByTutorAndDateRange(tutorEmail, startDate, endDate) {
    try {
      const allPayments = await this.findByTutor(tutorEmail);
      
      return allPayments.filter(payment => {
        if (!payment.date_payment) return false;
        return payment.date_payment >= startDate && payment.date_payment <= endDate;
      });
    } catch (error) {
      console.error('[PaymentRepository] Error finding by tutor and date range:', error);
      throw error;
    }
  }
}

