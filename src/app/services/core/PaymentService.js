"use client";

import { db } from '../../../firebaseConfig';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import app from '../../../firebaseConfig';

/**
 * @typedef {import('../../models/payment.model').Payment} Payment
 * @typedef {import('../../models/payment.model').PaymentDetails} PaymentDetails
 */

/**
 * Payment Service - Gestiona pagos y comprobantes
 * Fusión de PaymentService.js y PaymentsService.js
 */
export class PaymentService {
  static COLLECTION_NAME = 'payments';

  /**
   * Sube un archivo de comprobante de pago a Firebase Storage
   * @param {string} sessionId - ID de la sesión de tutoría
   * @param {File} file - Archivo de comprobante
   * @returns {Promise<{success: boolean, url?: string, error?: string}>}
   */
  static async uploadPaymentProofFile(sessionId, file) {
    try {
      if (!app) throw new Error('Firebase app no inicializado');
      if (!sessionId) throw new Error('sessionId es requerido');
      if (!file) throw new Error('file es requerido');

      const storage = getStorage(app);
      const storageRef = ref(storage, `payment_proofs/${sessionId}/${Date.now()}_${file.name}`);

      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);

      return { success: true, url, path: snapshot.ref.fullPath, fileName: file.name };
    } catch (error) {
      console.error('Error subiendo comprobante:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene pagos por email del estudiante
   * @param {string} studentEmail - Email del estudiante
   * @param {{startDate?: Date, endDate?: Date, limit?: number}} options - Opciones de filtro
   * @returns {Promise<PaymentDetails[]>}
   */
  static async getPaymentsByStudent(studentEmail, options = {}) {
    if (!studentEmail) return [];
    const { startDate = null, endDate = null } = options;
    const normalizedEmail = String(studentEmail).trim().toLowerCase();

    try {
      console.log('[PaymentService] getPaymentsByStudent for:', normalizedEmail);
      
      let snapshot = null;
      try {
        const q = query(
          collection(db, this.COLLECTION_NAME),
          where('studentEmail', '==', normalizedEmail),
          orderBy('date_payment', 'desc')
        );
        snapshot = await getDocs(q);
        console.log('[PaymentService] primary query size:', snapshot.size);
      } catch (eOrder) {
        console.warn('[PaymentService] orderBy(date_payment) no disponible, usando fallback sin orderBy', eOrder);
        const q = query(
          collection(db, this.COLLECTION_NAME),
          where('studentEmail', '==', normalizedEmail)
        );
        snapshot = await getDocs(q);
        console.log('[PaymentService] fallback (no orderBy) size:', snapshot.size);
      }

      const results = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const storedEmail = (data.studentEmail ? String(data.studentEmail) : '').trim().toLowerCase();
        if (storedEmail !== normalizedEmail) return;

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

        if (startDate && datePayment && datePayment < startDate) return;
        if (endDate && datePayment && datePayment > endDate) return;

        results.push({
          id: docSnap.id,
          amount: typeof data.amount === 'number' ? data.amount : Number(data.amount) || 0,
          date_payment: datePayment,
          method: data.method || '',
          studentEmail: data.studentEmail || '',
          subject: data.subject || '',
          transactionID: data.transactionID || data.transactionId || '',
          tutorEmail: data.tutorEmail || '',
          raw: data
        });
      });

      // Fallback con 'in' query si no hay resultados
      if (results.length === 0) {
        try {
          const variants = [
            String(studentEmail),
            String(studentEmail).trim(),
            String(studentEmail).toLowerCase(),
            String(studentEmail).trim().toLowerCase()
          ];
          const unique = Array.from(new Set(variants));
          console.log('[PaymentService] IN variants:', unique);
          
          const qIn = query(
            collection(db, this.COLLECTION_NAME),
            where('studentEmail', 'in', unique)
          );
          const snapIn = await getDocs(qIn);
          console.log('[PaymentService] IN query size:', snapIn.size);
          
          snapIn.forEach((docSnap) => {
            const data = docSnap.data();
            const rawDate = data.date_payment;
            let datePayment = null;
            
            if (rawDate?.toDate) datePayment = rawDate.toDate();
            else if (typeof rawDate === 'string') {
              const parsed = new Date(rawDate);
              datePayment = isNaN(parsed) ? null : parsed;
            } else if (rawDate instanceof Date) datePayment = rawDate;
            
            if (startDate && datePayment && datePayment < startDate) return;
            if (endDate && datePayment && datePayment > endDate) return;
            
            results.push({
              id: docSnap.id,
              amount: typeof data.amount === 'number' ? data.amount : Number(data.amount) || 0,
              date_payment: datePayment,
              method: data.method || '',
              studentEmail: data.studentEmail || '',
              subject: data.subject || '',
              transactionID: data.transactionID || data.transactionId || '',
              tutorEmail: data.tutorEmail || '',
              raw: data
            });
          });
        } catch (eIn) {
          console.warn('[PaymentService] Fallback IN query failed:', eIn);
        }
      }

      // Ordenar por fecha descendente
      results.sort((a, b) => {
        const ad = a.date_payment ? a.date_payment.getTime() : 0;
        const bd = b.date_payment ? b.date_payment.getTime() : 0;
        return bd - ad;
      });

      return results;
    } catch (error) {
      console.error('[PaymentService] Error obteniendo pagos:', error);
      return [];
    }
  }

  /**
   * Obtiene pagos por email del tutor
   * @param {string} tutorEmail - Email del tutor
   * @param {{startDate?: Date, endDate?: Date}} options - Opciones de filtro
   * @returns {Promise<Array>}
   */
  static async getPaymentsByTutor(tutorEmail, options = {}) {
    if (!tutorEmail) return [];
    const { startDate = null, endDate = null } = options;
    const normalizedEmail = String(tutorEmail).trim().toLowerCase();

    try {
      console.log('[PaymentService] getPaymentsByTutor for:', normalizedEmail);
      
      let snapshot = null;
      try {
        const q = query(
          collection(db, this.COLLECTION_NAME),
          where('tutorEmail', '==', normalizedEmail),
          orderBy('date_payment', 'desc')
        );
        snapshot = await getDocs(q);
        console.log('[PaymentService] tutor primary query size:', snapshot.size);
      } catch (eOrder) {
        console.warn('[PaymentService] tutor orderBy(date_payment) no disponible, fallback sin orderBy', eOrder);
        const q = query(
          collection(db, this.COLLECTION_NAME),
          where('tutorEmail', '==', normalizedEmail)
        );
        snapshot = await getDocs(q);
        console.log('[PaymentService] tutor fallback (no orderBy) size:', snapshot.size);
      }

      const results = [];
      const normalizeBool = (val) => {
        if (typeof val === 'boolean') return val;
        if (typeof val === 'string') return val.toLowerCase() === 'true';
        if (typeof val === 'number') return val === 1;
        return Boolean(val);
      };

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const storedEmail = (data.tutorEmail ? String(data.tutorEmail) : '').trim().toLowerCase();
        if (storedEmail !== normalizedEmail) {
          console.log('[PaymentService] Skipping doc, email mismatch:', storedEmail, 'vs', normalizedEmail);
          return;
        }

        const rawDate = data.date_payment;
        let datePayment = null;
        
        if (rawDate?.toDate) datePayment = rawDate.toDate();
        else if (typeof rawDate === 'string') {
          const parsed = new Date(rawDate);
          datePayment = isNaN(parsed) ? null : parsed;
        } else if (rawDate instanceof Date) datePayment = rawDate;

        if (startDate && datePayment && datePayment < startDate) {
          console.log('[PaymentService] Skipping doc, before startDate:', datePayment, '<', startDate);
          return;
        }
        if (endDate && datePayment && datePayment > endDate) {
          console.log('[PaymentService] Skipping doc, after endDate:', datePayment, '>', endDate);
          return;
        }

        console.log('[PaymentService] Adding payment:', docSnap.id, data);
        results.push({
          id: docSnap.id,
          amount: typeof data.amount === 'number' ? data.amount : Number(data.amount) || 0,
          date_payment: datePayment,
          method: data.method || '',
          studentEmail: data.studentEmail || '',
          studentName: data.studentName || '',
          subject: data.subject || '',
          transactionID: data.transactionID || data.transactionId || '',
          tutorEmail: data.tutorEmail || '',
          pagado: normalizeBool(data.pagado),
          raw: data
        });
      });

      // Ordenar por fecha desc
      results.sort((a, b) => {
        const ad = a.date_payment ? a.date_payment.getTime() : 0;
        const bd = b.date_payment ? b.date_payment.getTime() : 0;
        return bd - ad;
      });

      return results;
    } catch (error) {
      console.error('[PaymentService] Error obteniendo pagos por tutor:', error);
      return [];
    }
  }
}

export default PaymentService;

