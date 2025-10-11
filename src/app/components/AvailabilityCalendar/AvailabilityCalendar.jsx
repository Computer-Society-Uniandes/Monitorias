"use client";

import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { Clock, User, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import './AvailabilityCalendar.css';

const AvailabilityCalendar = ({ 
  tutorId = null,        // Para modo individual
  tutorName = null,      // Para modo individual  
  subject = null,        // Para modo conjunto
  mode = 'individual',   // 'individual' o 'joint'
  onDateSelect, 
  selectedDate, 
  loading = false 
}) => {
  const [date, setDate] = useState(selectedDate || new Date());
  const [selectedDaySlots, setSelectedDaySlots] = useState([]);
  const [availabilityData, setAvailabilityData] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadAvailabilityData();
  }, [tutorId, subject, mode]);

  useEffect(() => {
    generateSlotsForSelectedDay();
  }, [date, availabilityData]);

  const loadAvailabilityData = async () => {
    if (!tutorId && !subject) return;
    
    try {
      setLoadingData(true);
      let data = [];
      
      if (mode === 'individual' && tutorId) {
        // Cargar disponibilidad individual del tutor
        // Aquí deberías usar tu servicio de Firebase
        // data = await AvailabilityService.getTutorAvailability(tutorId);
        console.log('Loading individual availability for tutor:', tutorId);
      } else if (mode === 'joint' && subject) {
        // Cargar disponibilidad conjunta por materia
        // data = await AvailabilityService.getJointAvailability(subject);
        console.log('Loading joint availability for subject:', subject);
      }
      
      setAvailabilityData(data);
    } catch (error) {
      console.error('Error loading availability data:', error);
      setAvailabilityData([]);
    } finally {
      setLoadingData(false);
    }
  };

  const generateSlotsForSelectedDay = () => {
    if (!availabilityData || availabilityData.length === 0) {
      setSelectedDaySlots([]);
      return;
    }

    const selectedDateStr = date.toISOString().split('T')[0];
    const daySlots = [];

    // Filtrar slots para el día seleccionado
    availabilityData.forEach(slot => {
      let slotDate;
      if (slot.date) {
        slotDate = slot.date.toDate ? slot.date.toDate() : new Date(slot.date);
      } else if (slot.startTime) {
        slotDate = slot.startTime.toDate ? slot.startTime.toDate() : new Date(slot.startTime);
      }

      if (slotDate) {
        const slotDateStr = slotDate.toISOString().split('T')[0];
        if (slotDateStr === selectedDateStr) {
          daySlots.push({
            id: slot.id || `slot-${Math.random()}`,
            time: formatSlotTime(slotDate, slot.endTime),
            startTime: slotDate,
            endTime: slot.endTime?.toDate ? slot.endTime.toDate() : slot.endTime,
            tutorEmail: slot.tutorEmail || slot.email,
            tutorName: slot.tutorName || slot.name || tutorName,
            tutors: slot.tutors || (slot.tutorName ? [{ name: slot.tutorName, email: slot.tutorEmail }] : []),
            available: slot.available !== false
          });
        }
      }
    });

    // Ordenar por hora
    daySlots.sort((a, b) => a.startTime - b.startTime);
    setSelectedDaySlots(daySlots);
  };

  const formatSlotTime = (startTime, endTime) => {
    const start = startTime instanceof Date ? startTime : new Date(startTime);
    const end = endTime ? (endTime.toDate ? endTime.toDate() : new Date(endTime)) : null;
    
    const startStr = start.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    
    if (end) {
      const endStr = end.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      return `${startStr} - ${endStr}`;
    }
    
    return startStr;
  };

  const handleDateChange = (newDate) => {
    setDate(newDate);
    if (onDateSelect) {
      onDateSelect(newDate);
    }
  };

  const formatSelectedDate = (date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const hasAvailabilityOnDate = (date) => {
    if (!availabilityData || availabilityData.length === 0) return false;
    
    const dateStr = date.toISOString().split('T')[0];
    return availabilityData.some(slot => {
      let slotDate;
      if (slot.date) {
        slotDate = slot.date.toDate ? slot.date.toDate() : new Date(slot.date);
      } else if (slot.startTime) {
        slotDate = slot.startTime.toDate ? slot.startTime.toDate() : new Date(slot.startTime);
      }
      
      if (slotDate) {
        const slotDateStr = slotDate.toISOString().split('T')[0];
        return slotDateStr === dateStr && slot.available !== false;
      }
      return false;
    });
  };

  const getTileClassName = ({ date: tileDate, view }) => {
    if (view !== 'month') return '';
    
    const baseClass = 'calendar-tile';
    const hasAvailability = hasAvailabilityOnDate(tileDate);
    const isSelected = date.toDateString() === tileDate.toDateString();
    const isPast = tileDate < new Date().setHours(0, 0, 0, 0);
    
    let classes = [baseClass];
    
    if (isSelected) classes.push('selected');
    if (hasAvailability && !isPast) classes.push('has-availability');
    if (isPast) classes.push('past-date');
    
    return classes.join(' ');
  };

  const handleSlotSelect = (slot) => {
    // Aquí se puede agregar lógica para seleccionar un slot específico
    console.log('Slot seleccionado:', slot);
  };

  return (
    <div className="availability-calendar-container">
      {/* Panel del calendario */}
      <div className="calendar-panel">
        <div className="calendar-header">
          <h3 className="calendar-title">
            {mode === 'joint' ? (
              <>
                <Users size={24} />
                Disponibilidad Conjunta
              </>
            ) : (
              <>
                <User size={24} />
                {tutorName ? `Disponibilidad de ${tutorName}` : 'Disponibilidad Individual'}
              </>
            )}
          </h3>
        </div>

        {loadingData || loading ? (
          <div className="calendar-loading">
            <div className="loading-spinner"></div>
            <p>Cargando disponibilidad...</p>
          </div>
        ) : (
          <Calendar
            onChange={handleDateChange}
            value={date}
            locale="es-ES"
            minDate={new Date()}
            tileClassName={getTileClassName}
            navigationLabel={({ date }) => (
              `${date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`
            )}
            nextLabel={<ChevronRight size={16} />}
            prevLabel={<ChevronLeft size={16} />}
            next2Label={null}
            prev2Label={null}
          />
        )}
      </div>

      {/* Panel de horarios disponibles */}
      <div className="slots-panel">
        <div className="slots-header">
          <h3 className="slots-title">
            <Clock size={20} />
            Horarios Disponibles
          </h3>
          <p className="selected-date">{formatSelectedDate(date)}</p>
        </div>

        <div className="slots-list">
          {selectedDaySlots.length === 0 ? (
            <div className="no-slots">
              <div className="no-slots-icon">📅</div>
              <h4>No hay horarios disponibles</h4>
              <p>Selecciona otro día en el calendario</p>
            </div>
          ) : (
            selectedDaySlots.map((slot) => (
              <div 
                key={slot.id} 
                className="slot-item"
                onClick={() => handleSlotSelect(slot)}
              >
                <div className="slot-time">
                  <Clock size={16} />
                  {slot.time}
                </div>
                
                {isJointView && slot.tutors && slot.tutors.length > 0 ? (
                  <div className="slot-tutors">
                    <Users size={14} />
                    <span>
                      {slot.tutors.length} tutor{slot.tutors.length !== 1 ? 'es' : ''} disponible{slot.tutors.length !== 1 ? 's' : ''}
                    </span>
                    <div className="tutors-names">
                      {slot.tutors.slice(0, 2).map(tutor => tutor.name).join(', ')}
                      {slot.tutors.length > 2 && ` +${slot.tutors.length - 2} más`}
                    </div>
                  </div>
                ) : (
                  <div className="slot-tutor">
                    <User size={14} />
                    <span>{slot.tutorName || 'Tutor disponible'}</span>
                  </div>
                )}

                <button className="book-slot-btn">
                  {mode === 'joint' ? 'Ver opciones' : 'Agendar'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AvailabilityCalendar;