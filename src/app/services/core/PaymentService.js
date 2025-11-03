"use client";

import { PaymentRepository } from '../../repositories/payment.repository';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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

    try {
      console.log('[PaymentService] getPaymentsByStudent for:', studentEmail);
      
      let payments = [];
      
      // Use repository with date filtering if specified
      if (startDate && endDate) {
        payments = await PaymentRepository.findByStudentAndDateRange(
          studentEmail,
          startDate,
          endDate
        );
      } else {
        payments = await PaymentRepository.findByStudent(studentEmail);
        
        // Apply date filters if only one is specified
        if (startDate || endDate) {
          payments = payments.filter(payment => {
            if (!payment.date_payment) return false;
            if (startDate && payment.date_payment < startDate) return false;
            if (endDate && payment.date_payment > endDate) return false;
            return true;
          });
        }
      }

      console.log('[PaymentService] Found payments:', payments.length);

      // Normalize and format results for UI
      const results = payments.map(payment => ({
        id: payment.id,
        amount: typeof payment.amount === 'number' ? payment.amount : Number(payment.amount) || 0,
        date_payment: payment.date_payment,
        method: payment.method || '',
        studentEmail: payment.studentEmail || '',
        subject: payment.subject || '',
        transactionID: payment.transactionID || payment.transactionId || '',
        tutorEmail: payment.tutorEmail || '',
        raw: payment
      }));

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

    try {
      console.log('[PaymentService] getPaymentsByTutor for:', tutorEmail);
      
      let payments = [];
      
      // Use repository with date filtering if specified
      if (startDate && endDate) {
        payments = await PaymentRepository.findByTutorAndDateRange(
          tutorEmail,
          startDate,
          endDate
        );
      } else {
        payments = await PaymentRepository.findByTutor(tutorEmail);
        
        // Apply date filters if only one is specified
        if (startDate || endDate) {
          payments = payments.filter(payment => {
            if (!payment.date_payment) return false;
            if (startDate && payment.date_payment < startDate) return false;
            if (endDate && payment.date_payment > endDate) return false;
            return true;
          });
        }
      }

      console.log('[PaymentService] Found payments:', payments.length);

      // Normalize boolean values
      const normalizeBool = (val) => {
        if (typeof val === 'boolean') return val;
        if (typeof val === 'string') return val.toLowerCase() === 'true';
        if (typeof val === 'number') return val === 1;
        return Boolean(val);
      };

      // Normalize and format results for UI
      const results = payments.map(payment => ({
        id: payment.id,
        amount: typeof payment.amount === 'number' ? payment.amount : Number(payment.amount) || 0,
        date_payment: payment.date_payment,
        method: payment.method || '',
        studentEmail: payment.studentEmail || '',
        studentName: payment.studentName || '',
        subject: payment.subject || '',
        transactionID: payment.transactionID || payment.transactionId || '',
        tutorEmail: payment.tutorEmail || '',
        pagado: normalizeBool(payment.pagado),
        raw: payment
      }));

      return results;
    } catch (error) {
      console.error('[PaymentService] Error obteniendo pagos por tutor:', error);
      return [];
    }
  }
}

export default PaymentService;

