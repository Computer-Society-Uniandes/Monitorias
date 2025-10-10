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
        subject: availability.subject || this.extractSubjectFromTitle(availability.title) || 'Tutoría General',
        color: availability.color,
        googleEventId: availability.googleEventId,
        htmlLink: availability.htmlLink,
        status: availability.status,
        isBooked: false, // Por defecto no está reservado
        bookedBy: null,
        sessionId: null,
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
  
  // Aplicar reservas existentes a los slots generados - MEJORADO
  static applySavedBookingsToSlots(slots, bookedSlots) {
    if (!bookedSlots || bookedSlots.length === 0) {
      console.log('No hay reservas existentes para aplicar');
      return slots;
    }
    
    console.log(`Aplicando ${bookedSlots.length} reservas existentes a ${slots.length} slots`);
    
    return slots.map(slot => {
      // Buscar si este slot específico está reservado
      const booking = bookedSlots.find(booking => {
        const parentMatch = booking.parentAvailabilityId === slot.parentAvailabilityId;
        const indexMatch = booking.slotIndex === slot.slotIndex;
        
        // Log detallado para debugging
        if (parentMatch && indexMatch) {
          console.log(`✅ Slot encontrado como reservado:`, {
            slotId: slot.id,
            parentAvailabilityId: slot.parentAvailabilityId,
            slotIndex: slot.slotIndex,
            bookedBy: booking.studentEmail,
            sessionId: booking.sessionId
          });
        }
        
        return parentMatch && indexMatch;
      });
      
      if (booking) {
        return {
          ...slot,
          isBooked: true,
          bookedBy: booking.studentEmail,
          sessionId: booking.sessionId,
          bookingId: booking.id,
          bookedAt: booking.bookedAt
        };
      }
      
      return slot;
    });
  }
  
  // Filtrar slots disponibles (no reservados y futuros) - MEJORADO
  static getAvailableSlots(slots) {
    const now = new Date();
    const availableSlots = slots.filter(slot => {
      const slotStart = new Date(slot.startDateTime);
      const isFuture = slotStart > now;
      const isNotBooked = !slot.isBooked;
      
      // Log para debugging
      if (!isFuture) {
        console.log(`❌ Slot excluido (pasado):`, slot.id, slotStart);
      }
      if (slot.isBooked) {
        console.log(`❌ Slot excluido (reservado):`, slot.id, 'por', slot.bookedBy);
      }
      if (isFuture && isNotBooked) {
        console.log(`✅ Slot disponible:`, slot.id, slotStart);
      }
      
      return isFuture && isNotBooked;
    });
    
    console.log(`Filtrados ${availableSlots.length} slots disponibles de ${slots.length} slots totales`);
    return availableSlots;
  }
  
  // Obtener todas las reservas para múltiples disponibilidades - NUEVO
  static async getAllBookingsForAvailabilities(availabilities, TutoringSessionService) {
    const allBookings = [];
    
    console.log(`Obteniendo reservas para ${availabilities.length} disponibilidades`);
    
    for (const availability of availabilities) {
      try {
        const bookings = await TutoringSessionService.getSlotBookingsForAvailability(availability.id);
        if (bookings.length > 0) {
          console.log(`📅 Encontradas ${bookings.length} reservas para disponibilidad ${availability.id}`);
          allBookings.push(...bookings);
        }
      } catch (error) {
        console.warn(`Error obteniendo reservas para disponibilidad ${availability.id}:`, error);
      }
    }
    
    console.log(`📊 Total de reservas encontradas: ${allBookings.length}`);
    return allBookings;
  }
  
  // Verificar si un slot específico está disponible - MEJORADO
  static isSlotAvailable(slot) {
    const now = new Date();
    const slotStart = new Date(slot.startDateTime);
    const isFuture = slotStart > now;
    const isNotBooked = !slot.isBooked;
    
    return isFuture && isNotBooked;
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
      isAvailable: this.isSlotAvailable(slot),
      isBooked: slot.isBooked,
      bookedBy: slot.bookedBy
    };
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
  
  // Validar que un slot puede ser reservado - MEJORADO
  static validateSlotForBooking(slot) {
    const errors = [];
    
    if (!slot) {
      errors.push('Slot no encontrado');
      return { isValid: false, errors };
    }
    
    if (slot.isBooked) {
      errors.push(`Este horario ya está reservado por ${slot.bookedBy || 'otro estudiante'}`);
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
  
  // Verificar conflictos de reserva en tiempo real - NUEVO
  static async checkSlotAvailabilityRealTime(slot, TutoringSessionService) {
    try {
      // Verificar si el slot ya fue reservado por otro usuario
      const existingBooking = await TutoringSessionService.getSlotBooking(
        slot.parentAvailabilityId, 
        slot.slotIndex
      );
      
      if (existingBooking) {
        console.log(`❌ Slot ${slot.id} ya está reservado en tiempo real por ${existingBooking.studentEmail}`);
        return {
          available: false,
          reason: `Este horario ya fue reservado por otro estudiante`,
          booking: existingBooking
        };
      }
      
      console.log(`✅ Slot ${slot.id} disponible en tiempo real`);
      return {
        available: true,
        reason: 'Slot disponible',
        booking: null
      };
    } catch (error) {
      console.error('Error verificando disponibilidad en tiempo real:', error);
      return {
        available: false,
        reason: 'Error verificando disponibilidad',
        booking: null
      };
    }
  }

  // Método auxiliar para extraer materia del título del evento
  static extractSubjectFromTitle(title) {
    if (!title) return 'Tutoría General';
    
    const titleLower = title.toLowerCase();
    
    // Buscar palabras clave comunes de materias
    if (titleLower.includes('cálculo') || titleLower.includes('calculo')) return 'Cálculo';
    if (titleLower.includes('física') || titleLower.includes('fisica')) return 'Física';
    if (titleLower.includes('matemáticas') || titleLower.includes('matematicas') || titleLower.includes('math')) return 'Matemáticas';
    if (titleLower.includes('programación') || titleLower.includes('programacion') || titleLower.includes('programming')) return 'Programación';
    if (titleLower.includes('química') || titleLower.includes('quimica')) return 'Química';
    if (titleLower.includes('biología') || titleLower.includes('biologia')) return 'Biología';
    if (titleLower.includes('historia')) return 'Historia';
    if (titleLower.includes('inglés') || titleLower.includes('ingles') || titleLower.includes('english')) return 'Inglés';
    if (titleLower.includes('estadística') || titleLower.includes('estadistica') || titleLower.includes('statistics')) return 'Estadística';
    if (titleLower.includes('economía') || titleLower.includes('economia')) return 'Economía';
    if (titleLower.includes('algebra') || titleLower.includes('álgebra')) return 'Álgebra';
    if (titleLower.includes('geometría') || titleLower.includes('geometria')) return 'Geometría';
    if (titleLower.includes('trigonometría') || titleLower.includes('trigonometria')) return 'Trigonometría';
    
    // Si contiene "tutoria" o "tutoría", usar el título completo como materia
    if (titleLower.includes('tutoria') || titleLower.includes('tutoría')) {
      return title.replace(/tutoria|tutoría/gi, '').trim() || 'Tutoría General';
    }
    
    // Si no encuentra palabras clave específicas, usar el título como materia
    return title.length > 30 ? 'Tutoría General' : title;
  }
} 