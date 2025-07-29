export class SlotService {
  
  // Dividir una disponibilidad en slots de 1 hora
  static generateHourlySlots(availability) {
    const slots = [];
    const startTime = new Date(availability.startDateTime);
    const endTime = new Date(availability.endDateTime);
    
    // Calcular la duración total en horas
    const totalHours = Math.floor((endTime - startTime) / (1000 * 60 * 60));
    
    // Generar slots de 1 hora
    for (let i = 0; i < totalHours; i++) {
      const slotStart = new Date(startTime.getTime() + (i * 60 * 60 * 1000));
      const slotEnd = new Date(slotStart.getTime() + (60 * 60 * 1000));
      
      // Crear ID único para este slot específico
      const slotId = `${availability.id}_slot_${i}`;
      
      const slot = {
        id: slotId,
        parentAvailabilityId: availability.id,
        slotIndex: i,
        tutorId: availability.tutorId,
        tutorEmail: availability.tutorEmail,
        title: availability.title,
        description: availability.description,
        startDateTime: slotStart,
        endDateTime: slotEnd,
        location: availability.location,
        subject: availability.subject,
        color: availability.color,
        googleEventId: availability.googleEventId,
        htmlLink: availability.htmlLink,
        status: availability.status,
        isBooked: false, // Por defecto no está reservado
        bookedBy: null,
        // Información adicional del slot
        originalStartDateTime: availability.startDateTime,
        originalEndDateTime: availability.endDateTime,
        slotDuration: 1, // 1 hora
        recurring: availability.recurring,
        recurrenceRule: availability.recurrenceRule
      };
      
      slots.push(slot);
    }
    
    return slots;
  }
  
  // Dividir múltiples disponibilidades en slots de 1 hora
  static generateHourlySlotsFromAvailabilities(availabilities) {
    const allSlots = [];
    
    availabilities.forEach(availability => {
      const slots = this.generateHourlySlots(availability);
      allSlots.push(...slots);
    });
    
    return allSlots;
  }
  
  // Filtrar slots disponibles (no reservados y futuros)
  static getAvailableSlots(slots) {
    const now = new Date();
    return slots.filter(slot => {
      const slotStart = new Date(slot.startDateTime);
      return slotStart > now && !slot.isBooked;
    });
  }
  
  // Agrupar slots por fecha
  static groupSlotsByDate(slots) {
    const grouped = {};
    
    slots.forEach(slot => {
      const date = new Date(slot.startDateTime);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: date,
          slots: []
        };
      }
      
      grouped[dateKey].slots.push(slot);
    });
    
    // Ordenar slots por hora dentro de cada día
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].slots.sort((a, b) => 
        new Date(a.startDateTime) - new Date(b.startDateTime)
      );
    });
    
    return grouped;
  }
  
  // Verificar si un slot específico está disponible
  static isSlotAvailable(slot) {
    const now = new Date();
    const slotStart = new Date(slot.startDateTime);
    return slotStart > now && !slot.isBooked;
  }
  
  // Formatear información del slot para display
  static formatSlotInfo(slot) {
    const startTime = new Date(slot.startDateTime);
    const endTime = new Date(slot.endDateTime);
    
    return {
      id: slot.id,
      date: startTime.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      startTime: startTime.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      endTime: endTime.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      duration: '1h',
      subject: slot.subject,
      location: slot.location,
      description: slot.description,
      tutorId: slot.tutorId,
      tutorEmail: slot.tutorEmail,
      isAvailable: this.isSlotAvailable(slot)
    };
  }
  
  // Aplicar reservas existentes a los slots generados
  static applySavedBookingsToSlots(slots, bookedSlots) {
    // bookedSlots sería un array de objetos con información sobre qué slots específicos están reservados
    if (!bookedSlots || bookedSlots.length === 0) return slots;
    
    return slots.map(slot => {
      const booking = bookedSlots.find(booking => 
        booking.parentAvailabilityId === slot.parentAvailabilityId &&
        booking.slotIndex === slot.slotIndex
      );
      
      if (booking) {
        return {
          ...slot,
          isBooked: true,
          bookedBy: booking.bookedBy,
          sessionId: booking.sessionId
        };
      }
      
      return slot;
    });
  }
  
  // Obtener slots consecutivos disponibles (para sesiones más largas en el futuro)
  static getConsecutiveAvailableSlots(slots, count = 1) {
    const availableSlots = this.getAvailableSlots(slots);
    const consecutiveGroups = [];
    
    for (let i = 0; i <= availableSlots.length - count; i++) {
      const group = [];
      let isConsecutive = true;
      
      for (let j = 0; j < count; j++) {
        const currentSlot = availableSlots[i + j];
        
        if (!currentSlot) {
          isConsecutive = false;
          break;
        }
        
        if (j > 0) {
          const prevSlot = availableSlots[i + j - 1];
          const currentStart = new Date(currentSlot.startDateTime);
          const prevEnd = new Date(prevSlot.endDateTime);
          
          // Verificar que sean consecutivos (diferencia máxima de 1 minuto para tolerancia)
          if (Math.abs(currentStart - prevEnd) > 60000) {
            isConsecutive = false;
            break;
          }
        }
        
        group.push(currentSlot);
      }
      
      if (isConsecutive && group.length === count) {
        consecutiveGroups.push(group);
      }
    }
    
    return consecutiveGroups;
  }
  
  // Validar que un slot puede ser reservado
  static validateSlotForBooking(slot) {
    const errors = [];
    
    if (!slot) {
      errors.push('Slot no encontrado');
      return { isValid: false, errors };
    }
    
    if (slot.isBooked) {
      errors.push('Este horario ya está reservado');
    }
    
    const now = new Date();
    const slotStart = new Date(slot.startDateTime);
    
    if (slotStart <= now) {
      errors.push('No se puede reservar un horario que ya pasó');
    }
    
    // Verificar que no sea muy pronto (mínimo 1 hora de anticipación)
    const oneHourFromNow = new Date(now.getTime() + (60 * 60 * 1000));
    if (slotStart < oneHourFromNow) {
      errors.push('Debe reservar con al menos 1 hora de anticipación');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 