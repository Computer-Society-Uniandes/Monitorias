import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

/**
 * @typedef {import('../models/tutoring_session.model').TutoringSession} TutoringSession
 * @typedef {import('../models/tutoring_session.model').TutoringSessionDetails} TutoringSessionDetails
 */

class TutoringHistoryService {
  /**
   * Obtiene todas las tutorías de un estudiante específico
   * @param {string} studentEmail - Email del estudiante
   * @returns {Promise<TutoringSessionDetails[]>} Lista de tutorías del estudiante
   */
  async getStudentTutoringHistory(studentEmail) {
    try {
      console.log('🔍 Buscando historial de tutorías para:', studentEmail);
      
      const tutoringSessionsRef = collection(db, 'tutoring_sessions');
      const q = query(
        tutoringSessionsRef,
        where('studentEmail', '==', studentEmail),
        orderBy('scheduledDateTime', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const tutoringSessions = [];

      for (const docSnap of querySnapshot.docs) {
        const sessionData = docSnap.data();
        
        // Obtener información adicional del tutor
        const tutorInfo = await this.getTutorInfo(sessionData.tutorEmail);
        
        tutoringSessions.push({
          id: docSnap.id,
          ...sessionData,
          tutorName: tutorInfo?.name || tutorInfo?.displayName || sessionData.tutorEmail,
          tutorProfilePicture: tutorInfo?.profilePicture || null,
        });
      }

      console.log('✅ Historial obtenido:', tutoringSessions.length, 'tutorías encontradas');
      return tutoringSessions;
    } catch (error) {
      console.error('❌ Error obteniendo historial de tutorías:', error);
      throw error;
    }
  }

  /**
   * Obtiene información del tutor desde la colección users
   * @param {string} tutorEmail - Email del tutor
   * @returns {Object|null} Información del tutor
   */
  async getTutorInfo(tutorEmail) {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', tutorEmail));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data();
      }
      
      return null;
    } catch (error) {
      console.error('Error obteniendo información del tutor:', error);
      return null;
    }
  }

  /**
   * Filtra tutorías por fecha
   * @param {Array} sessions - Lista de tutorías
   * @param {Date} startDate - Fecha de inicio (opcional)
   * @param {Date} endDate - Fecha de fin (opcional)
   * @returns {Array} Tutorías filtradas
   */
  filterByDate(sessions, startDate = null, endDate = null) {
    return sessions.filter(session => {
      const sessionDate = session.scheduledDateTime?.toDate?.() || new Date(session.scheduledDateTime);
      
      if (startDate && sessionDate < startDate) return false;
      if (endDate && sessionDate > endDate) return false;
      
      return true;
    });
  }

  /**
   * Filtra tutorías por materia
   * @param {Array} sessions - Lista de tutorías
   * @param {string} subject - Materia a filtrar
   * @returns {Array} Tutorías filtradas
   */
  filterBySubject(sessions, subject) {
    if (!subject || subject === 'Todas') return sessions;
    return sessions.filter(session => 
      session.subject?.toLowerCase() === subject.toLowerCase()
    );
  }

  /**
   * Obtiene las materias únicas del historial de tutorías
   * @param {Array} sessions - Lista de tutorías
   * @returns {Array} Lista de materias únicas
   */
  getUniqueSubjects(sessions) {
    const subjects = sessions.map(session => session.subject).filter(Boolean);
    return [...new Set(subjects)].sort();
  }

  /**
   * Formatea la fecha para mostrar (versión simple)
   * @param {Date|Object} date - Fecha a formatear
   * @returns {string} Fecha formateada
   */
  formatDate(date) {
    if (!date) return 'Fecha no disponible';
    
    let dateObj;
    if (date.toDate) {
      dateObj = date.toDate();
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      dateObj = new Date(date);
    }

    return dateObj.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  /**
   * Formatea el precio para mostrar
   * @param {number} price - Precio a formatear
   * @returns {string} Precio formateado
   */
  formatPrice(price) {
    if (!price && price !== 0) return 'Precio no disponible';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  }

  /**
   * Obtiene el color del estado de pago
   * @param {string} status - Estado del pago
   * @returns {Object} Objeto con colores para el estado
   */
  getPaymentStatusColor(status) {
    const statusColors = {
      'paid': { bg: '#DEF7EC', text: '#03543F', border: '#84E1BC' },
      'pending': { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' },
      'failed': { bg: '#FEE2E2', text: '#9B1C1C', border: '#F87171' },
      'cancelled': { bg: '#F3F4F6', text: '#374151', border: '#9CA3AF' }
    };

    return statusColors[status] || statusColors['pending'];
  }

  /**
   * Traduce el estado de pago al español
   * @param {string} status - Estado en inglés
   * @returns {string} Estado en español
   */
  translatePaymentStatus(status) {
    const translations = {
      'paid': 'Pagado',
      'pending': 'Pendiente',
      'failed': 'Fallido',
      'cancelled': 'Cancelado'
    };

    return translations[status] || 'Desconocido';
  }

  /**
   * Obtiene estadísticas del historial
   * @param {Array} sessions - Lista de tutorías
   * @returns {Object} Estadísticas del historial
   */
  getHistoryStats(sessions) {
    const totalSessions = sessions.length;
    const totalSpent = sessions.reduce((sum, session) => sum + (session.price || 0), 0);
    const subjects = this.getUniqueSubjects(sessions);
    const paidSessions = sessions.filter(session => session.paymentStatus === 'paid').length;

    return {
      totalSessions,
      totalSpent,
      uniqueSubjects: subjects.length,
      paidSessions,
      pendingSessions: totalSessions - paidSessions
    };
  }
}

const tutoringHistoryService = new TutoringHistoryService();
export { TutoringHistoryService };
export default tutoringHistoryService;