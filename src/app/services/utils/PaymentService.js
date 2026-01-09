import { API_URL } from '../../../config/api';

export const PaymentService = {
  /**
   * Crea una intención de pago con Wompi en el backend.
   * Retorna los datos necesarios para configurar el Widget (referencia, firma, etc).
   * @param {Object} paymentData - { amount, currency, email, ... }
   */
  createWompiPayment: async (paymentData) => {
    try {
      const response = await fetch(`${API_URL}/payments/wompi/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al iniciar el pago con Wompi');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating Wompi payment:', error);
      throw error;
    }
  },

  getPaymentHistory: async (studentId) => {
    try {
      const response = await fetch(`${API_URL}/payments/student/${studentId}`);
      if (!response.ok) return [];
      const data = await response.json();
      console.log("Data", data)
      if (!Array.isArray(data.payments)) {
        console.warn('Payment history data is not an array:', data);
        return [];
      }

      return data.payments.map(p => ({
        ...p,
        date_payment: p.date_payment ? new Date(p.date_payment) : new Date()
      }));
    } catch (error) {
      console.error('Error getting payment history:', error);
      return [];
    }
  },

  getPaymentsByStudent: async (studentId) => {
    return PaymentService.getPaymentHistory(studentId);
  },

  getTutorPayments: async (tutorId) => {
    try {
      const url = `${API_URL}/payments/tutor/${tutorId}`;
      console.log('[PaymentService] Fetching tutor payments from:', url);

      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`[PaymentService] Failed to fetch payments: ${response.status} ${response.statusText}`);
        return [];
      }
      const data = await response.json();
      console.log('[PaymentService] Raw response:', data);

      let paymentsList = [];
      if (Array.isArray(data)) {
        paymentsList = data;
      } else if (data && Array.isArray(data.payments)) {
        paymentsList = data.payments;
      } else if (data && Array.isArray(data.data)) {
        paymentsList = data.data;
      } else {
        console.warn('[PaymentService] Expected array but got:', typeof data);
        return [];
      }

      return paymentsList.map(p => ({
        ...p,
        date_payment: p.date_payment ? new Date(p.date_payment) : new Date()
      }));
    } catch (error) {
      console.error('Error getting tutor payments:', error);
      return [];
    }
  },

  getPaymentDetails: async (paymentId) => {
    try {
      const response = await fetch(`${API_URL}/payments/${paymentId}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error getting payment details:', error);
      return null;
    }
  },

  updatePayment: async (paymentId, updateData) => {
    try {
      const response = await fetch(`${API_URL}/payments/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error updating payment');
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  }
};
