// Servicio para manejar la disponibilidad conjunta de múltiples tutores
import { UserRepository } from '../../repositories/user.repository';
import { AvailabilityRepository } from '../../repositories/availability.repository';

/**
 * @typedef {import('../models/user.model').User} User
 * @typedef {import('../models/availability.model').Availability} Availability
 * @typedef {import('../models/availability.model').AvailabilitySlot} AvailabilitySlot
 */

export class JointAvailabilityService {
  
  /**
   * Obtiene todos los tutores que enseñan una materia específica
   */
  static async getTutorsBySubject(subject) {
    try {
      // Use repository for data access
      const tutors = await UserRepository.findTutorsBySubject(subject);
      
      console.log(`[JointAvailabilityService] Found ${tutors.length} tutors for subject: ${subject}`);
      return tutors;
    } catch (error) {
      console.error('[JointAvailabilityService] Error getting tutors by subject:', error);
      throw error;
    }
  }

  /**
   * Obtiene la disponibilidad de múltiples tutores desde Firebase
   */
  static async getMultipleTutorsAvailability(tutorEmails) {
    try {
      const availabilityPromises = tutorEmails.map(async (email) => {
        try {
          // Obtener disponibilidad del tutor desde la API
          const response = await fetch(`/api/availability?tutorId=${encodeURIComponent(email)}&limit=100`);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          
          return {
            tutorEmail: email,
            slots: data.availabilitySlots || [],
            connected: true,
            error: null,
            totalSlots: data.totalEvents || 0
          };
        } catch (error) {
          console.warn(`Error loading availability for ${email}:`, error);
          
          // Intentar obtener directamente desde Firebase como fallback
          try {
            const firebaseSlots = await this.getAvailabilityFromFirebase(email);
            return {
              tutorEmail: email,
              slots: firebaseSlots,
              connected: false,
              error: `API error: ${error.message}`,
              totalSlots: firebaseSlots.length
            };
          } catch (firebaseError) {
            console.error(`Firebase fallback also failed for ${email}:`, firebaseError);
            return {
              tutorEmail: email,
              slots: [],
              connected: false,
              error: `Both API and Firebase failed: ${error.message}`,
              totalSlots: 0
            };
          }
        }
      });

      const results = await Promise.all(availabilityPromises);
      console.log('Multiple tutors availability loaded:', results.length);
      return results;
    } catch (error) {
      console.error('Error getting multiple tutors availability:', error);
      throw error;
    }
  }

  /**
   * Obtiene disponibilidad directamente desde Firebase como fallback
   */
  static async getAvailabilityFromFirebase(tutorEmail) {
    try {
      // Use repository for data access
      const availabilities = await AvailabilityRepository.findByTutor(tutorEmail);
      
      // Transform repository data to slot format for UI
      const slots = availabilities
        .filter(data => data.startDateTime && data.endDateTime)
        .map(data => ({
          id: data.id,
          title: data.title || 'Disponible',
          date: data.startDateTime.toISOString().split('T')[0],
          startTime: data.startDateTime.toTimeString().substring(0, 5),
          endTime: data.endDateTime.toTimeString().substring(0, 5),
          start: data.startDateTime.toISOString(),
          end: data.endDateTime.toISOString(),
          tutorEmail: data.tutorEmail,
          subject: data.subject,
          description: data.description,
          location: data.location,
          recurring: data.recurring || false,
          available: true,
          source: 'firebase'
        }));
      
      console.log(`[JointAvailabilityService] Firebase fallback found ${slots.length} slots for ${tutorEmail}`);
      return slots;
    } catch (error) {
      console.error('[JointAvailabilityService] Error getting availability from Firebase:', error);
      return [];
    }
  }

  /**
   * Combina la disponibilidad de múltiples tutores para un día específico
   */
  static generateJointSlotsForDay(tutorsAvailability, selectedDate) {
    const dayString = selectedDate.toISOString().split('T')[0];
    const timeSlotMap = new Map();

    tutorsAvailability.forEach(({ tutorEmail, slots }) => {
      slots.forEach(slot => {
        // Verificar si el slot corresponde al día seleccionado
        const isCorrectDay = slot.date === dayString || 
                           (slot.start && slot.start.startsWith(dayString));
        
        if (isCorrectDay) {
          const startTime = slot.startTime || this.extractTimeFromDateTime(slot.start);
          const endTime = slot.endTime || this.extractTimeFromDateTime(slot.end);
          
          if (startTime && endTime) {
            const hourlySlots = this.generateHourlySlotsFromTimeRange(startTime, endTime);
            
            hourlySlots.forEach(timeSlot => {
              const key = `${dayString}_${timeSlot}`;
              
              if (!timeSlotMap.has(key)) {
                timeSlotMap.set(key, {
                  date: dayString,
                  time: timeSlot,
                  tutors: [],
                  originalSlots: []
                });
              }
              
              const slotInfo = timeSlotMap.get(key);
              slotInfo.tutors.push({
                email: tutorEmail,
                slotId: slot.id,
                subject: slot.subject,
                location: slot.location
              });
              slotInfo.originalSlots.push(slot);
            });
          }
        }
      });
    });

    // Convertir a array y ordenar por hora
    const jointSlots = Array.from(timeSlotMap.values())
      .sort((a, b) => a.time.localeCompare(b.time));

    return jointSlots;
  }

  /**
   * Obtiene horarios disponibles para una semana específica
   */
  static generateJointSlotsForWeek(tutorsAvailability, startDate) {
    const weekSlots = {};
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const daySlots = this.generateJointSlotsForDay(tutorsAvailability, currentDate);
      const dayString = currentDate.toISOString().split('T')[0];
      
      weekSlots[dayString] = daySlots;
    }
    
    return weekSlots;
  }

  /**
   * Extrae la hora de una cadena de fecha-hora
   */
  static extractTimeFromDateTime(dateTimeString) {
    if (!dateTimeString) return null;
    const date = new Date(dateTimeString);
    return date.toTimeString().substring(0, 5); // Formato HH:MM
  }

  /**
   * Genera slots de 1 hora a partir de un rango de tiempo
   */
  static generateHourlySlotsFromTimeRange(startTime, endTime) {
    const slots = [];
    const start = this.parseTime(startTime);
    const end = this.parseTime(endTime);
    
    for (let hour = start; hour < end; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`;
      slots.push(timeString);
    }
    
    return slots;
  }

  /**
   * Convierte una cadena de tiempo en número de hora
   */
  static parseTime(timeString) {
    const [hours] = timeString.split(':').map(Number);
    return hours;
  }

  /**
   * Formatea una fecha para mostrar en español
   */
  static formatDateSpanish(date) {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Obtiene estadísticas de disponibilidad conjunta
   */
  static getAvailabilityStats(tutorsAvailability) {
    const totalTutors = tutorsAvailability.length;
    const connectedTutors = tutorsAvailability.filter(t => t.connected).length;
    const totalSlots = tutorsAvailability.reduce((acc, t) => acc + t.slots.length, 0);
    const tutorsWithSlots = tutorsAvailability.filter(t => t.slots.length > 0).length;
    
    return {
      totalTutors,
      connectedTutors,
      totalSlots,
      tutorsWithSlots,
      averageSlotsPerTutor: totalTutors > 0 ? Math.round(totalSlots / totalTutors) : 0
    };
  }

  /**
   * Filtra slots por fecha futura (no incluye fechas pasadas)
   */
  static filterFutureSlots(slots) {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().substring(0, 5);
    
    return slots.filter(slot => {
      if (slot.date > today) return true;
      if (slot.date === today && slot.startTime >= currentTime) return true;
      return false;
    });
  }

  /**
   * Agrupa slots por tutor para visualización
   */
  static groupSlotsByTutor(tutorsAvailability) {
    const grouped = {};
    
    tutorsAvailability.forEach(({ tutorEmail, slots, connected, error }) => {
      grouped[tutorEmail] = {
        slots: this.filterFutureSlots(slots),
        connected,
        error,
        totalSlots: slots.length
      };
    });
    
    return grouped;
  }
}