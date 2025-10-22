"use client";

import { db } from '../../firebaseConfig';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

/**
 * @typedef {import('../models/payment.model').Payment} Payment
 * @typedef {import('../models/payment.model').PaymentDetails} PaymentDetails
 */

export class PaymentsService {
  static COLLECTION_NAME = 'payments';

/**
 * Obtiene pagos por email del estudiante autenticado.
 * @param {string} studentEmail
 * @param {{ startDate?: Date|null, endDate?: Date|null, limit?: number }} options
 * @returns {Promise<PaymentDetails[]>} Lista de pagos normalizados
 */


  static async getPaymentsByStudent(studentEmail, options = {}) {
    if (!studentEmail) return [];
    const { startDate = null, endDate = null } = options;
    const normalizedEmail = String(studentEmail).trim().toLowerCase();

    try {
      console.log('[PaymentsService] getPaymentsByStudent for:', normalizedEmail);
      // Construir consulta base: por estudiante, ordenados por fecha
      // Nota: orderBy en Firestore requiere índices; si da error, hacemos fallback sin orderBy
      let snapshot = null;
      try {
        const q = query(
          collection(db, this.COLLECTION_NAME),
          where('studentEmail', '==', normalizedEmail),
          orderBy('date_payment', 'desc')
        );
        snapshot = await getDocs(q);
        console.log('[PaymentsService] primary query size:', snapshot.size);
      } catch (eOrder) {
        console.warn('[PaymentsService] orderBy(date_payment) no disponible, usando fallback sin orderBy', eOrder);
        const q = query(
          collection(db, this.COLLECTION_NAME),
          where('studentEmail', '==', normalizedEmail)
        );
        snapshot = await getDocs(q);
        console.log('[PaymentsService] fallback (no orderBy) size:', snapshot.size);
      }

      const results = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Normalizar email almacenado para evitar falsos negativos
        const storedEmail = (data.studentEmail ? String(data.studentEmail) : '').trim().toLowerCase();
        if (storedEmail !== normalizedEmail) {
          return; // Ignorar si no coincide tras normalizar
        }
        const rawDate = data.date_payment;
        let datePayment = null;
        // Fecha puede venir como Timestamp (toDate) o string/ISO
        if (rawDate?.toDate) {
          datePayment = rawDate.toDate();
        } else if (typeof rawDate === 'string') {
          const parsed = new Date(rawDate);
          datePayment = isNaN(parsed) ? null : parsed;
        } else if (rawDate instanceof Date) {
          datePayment = rawDate;
        }

        // Filtro por rango si aplica
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

      // Si no hubo resultados, intentar un fallback con 'in' y variantes comunes
      if (results.length === 0) {
        try {
          const variants = [
            String(studentEmail),
            String(studentEmail).trim(),
            String(studentEmail).toLowerCase(),
            String(studentEmail).trim().toLowerCase()
          ];
          // Remover duplicados
          const unique = Array.from(new Set(variants));
          console.log('[PaymentsService] IN variants:', unique);
          // Firestore 'in' limita a 10 elementos; aquí son <= 4
          const qIn = query(
            collection(db, this.COLLECTION_NAME),
            where('studentEmail', 'in', unique)
          );
          const snapIn = await getDocs(qIn);
          console.log('[PaymentsService] IN query size:', snapIn.size);
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
          console.warn('[PaymentsService] Fallback IN query failed, trying full scan (dev only):', eIn);
        }
      }

      // Último recurso en dev: escanear primeros 200 pagos y filtrar por email normalizado
      if (results.length === 0) {
        try {
          const snapAll = await getDocs(collection(db, this.COLLECTION_NAME));
          console.log('[PaymentsService] full scan size:', snapAll.size);
          snapAll.forEach((docSnap) => {
            const data = docSnap.data();
            const storedEmail = (data.studentEmail ? String(data.studentEmail) : '').trim().toLowerCase();
            if (storedEmail !== normalizedEmail) return;
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
        } catch (eAll) {
          console.warn('[PaymentsService] Full scan failed:', eAll);
        }
      }

      // Ordenar si no se pudo en la consulta
      results.sort((a, b) => {
        const ad = a.date_payment ? a.date_payment.getTime() : 0;
        const bd = b.date_payment ? b.date_payment.getTime() : 0;
        return bd - ad; // desc
      });

      return results;
    } catch (error) {
      console.error('[PaymentsService] Error obteniendo pagos:', error);
      return [];
    }
  }

  /**
   * Obtiene pagos por email del tutor autenticado.
   * @param {string} tutorEmail
   * @param {{ startDate?: Date|null, endDate?: Date|null }} options
   * @returns {Promise<Array>} Lista de pagos normalizados
   */
  static async getPaymentsByTutor(tutorEmail, options = {}) {
    if (!tutorEmail) return [];
    const { startDate = null, endDate = null } = options;
    const normalizedEmail = String(tutorEmail).trim().toLowerCase();

    try {
      console.log('[PaymentsService] getPaymentsByTutor for:', normalizedEmail);
      let snapshot = null;
      try {
        const q = query(
          collection(db, this.COLLECTION_NAME),
          where('tutorEmail', '==', normalizedEmail),
          orderBy('date_payment', 'desc')
        );
        snapshot = await getDocs(q);
        console.log('[PaymentsService] tutor primary query size:', snapshot.size);
      } catch (eOrder) {
        console.warn('[PaymentsService] tutor orderBy(date_payment) no disponible, fallback sin orderBy', eOrder);
        const q = query(
          collection(db, this.COLLECTION_NAME),
          where('tutorEmail', '==', normalizedEmail)
        );
        snapshot = await getDocs(q);
        console.log('[PaymentsService] tutor fallback (no orderBy) size:', snapshot.size);
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
          console.log('[PaymentsService] Skipping doc, email mismatch:', storedEmail, 'vs', normalizedEmail);
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
          console.log('[PaymentsService] Skipping doc, before startDate:', datePayment, '<', startDate);
          return;
        }
        if (endDate && datePayment && datePayment > endDate) {
          console.log('[PaymentsService] Skipping doc, after endDate:', datePayment, '>', endDate);
          return;
        }

        console.log('[PaymentsService] Adding payment:', docSnap.id, data);
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

      // Ordenar por fecha desc si no se pudo en la consulta
      results.sort((a, b) => {
        const ad = a.date_payment ? a.date_payment.getTime() : 0;
        const bd = b.date_payment ? b.date_payment.getTime() : 0;
        return bd - ad;
      });

      return results;
    } catch (error) {
      console.error('[PaymentsService] Error obteniendo pagos por tutor:', error);
      return [];
    }
  }
}

export default PaymentsService;
