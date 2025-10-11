"use client";

import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { Clock, User, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import './AvailabilityCalendar.css';
import { AvailabilityService } from 'app/app/services/AvailabilityService';
import { SlotService } from 'app/app/services/SlotService';
import { TutoringSessionService } from 'app/app/services/TutoringSessionService';
import { useAuth } from 'app/app/context/SecureAuthContext';
import { TutorSearchService } from 'app/app/services/TutorSearchService';

const AvailabilityCalendar = ({ 
  tutorId = null,        // Para modo individual
  tutorName = null,      // Para modo individual  
  subject = null,        // Para modo conjunto
  mode = 'individual',   // 'individual' o 'joint'
  onDateSelect, 
  selectedDate, 
  loading = false 
}) => {
  const { user } = useAuth();
  const [date, setDate] = useState(selectedDate || new Date());
  const [selectedDaySlots, setSelectedDaySlots] = useState([]);
  const [availabilityData, setAvailabilityData] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState(null);
  const [availabilityDataReady, setAvailabilityDataReady] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadAvailabilityData();
  }, [tutorId, subject, mode]);

  useEffect(() => {
    if (Array.isArray(availabilityData) && availabilityData.length > 0) {
        console.log('availabilityData está listo y tiene datos:', availabilityData);
        setAvailabilityDataReady(true);
    } else {
        console.log('availabilityData no está listo o está vacío:', availabilityData);
        setAvailabilityDataReady(false);
    }
  }, [availabilityData]);

  useEffect(() => {
    if (availabilityDataReady) {
        console.log('Generando slots con availabilityData actualizado:', availabilityData);
        generateSlotsForSelectedDay();
    } else {
        console.log('availabilityData aún no está listo o está vacío:', availabilityData);
    }
  }, [availabilityDataReady, date]);

  const loadAvailabilityData = async () => {
    if (!tutorId && !subject) return;
    try {
      setLoadingData(true);
      setError(null);

      if (mode === 'individual' && tutorId) {
        const tutorAvailability = await TutorSearchService.getTutorAvailability(tutorId, 100);
        console.log('Tutor availability:', tutorAvailability);
        setAvailabilityData(tutorAvailability);
      } else if (mode === 'joint' && subject) {
        const data = await AvailabilityService.getAvailabilitiesBySubject(subject);
        console.log('Joint availability data:', data);
        setAvailabilityData(data.availabilitySlots || []);
      }
    } catch (error) {
      console.error('Error loading availability data:', error);
      setError('Error cargando disponibilidad. Por favor intenta de nuevo.');
      setAvailabilityData([]);
    } finally {
      setLoadingData(false);
    }
  };

  const generateSlotsForSelectedDay = async () => {
    try {
      console.log('Availability data:', availabilityData);
      if (!Array.isArray(availabilityData) || availabilityData.length === 0) {
        console.warn('generateSlotsForSelectedDay: availabilityData no es un array válido o está vacío');
        setSelectedDaySlots([]);
        return;
      }

      const generatedSlots = SlotService.generateHourlySlotsFromAvailabilities(availabilityData);
      const allBookings = await SlotService.getAllBookingsForAvailabilities(
        availabilityData,
        TutoringSessionService
      );
      const slotsWithBookings = SlotService.applySavedBookingsToSlots(generatedSlots, allBookings);
      const availableSlots = SlotService.getAvailableSlots(slotsWithBookings);

      const selectedDateStr = date.toISOString().split('T')[0];
      const daySlots = availableSlots.filter(slot => {
        const slotDateStr = new Date(slot.startDateTime).toISOString().split('T')[0];
        return slotDateStr === selectedDateStr;
      });

      setSelectedDaySlots(daySlots);
    } catch (error) {
      console.error('Error generando slots:', error);
      setError('Error generando horarios disponibles. Por favor intenta de nuevo.');
    }
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

  const handleSlotSelect = async (slot) => {
    try {
      const realTimeCheck = await SlotService.checkSlotAvailabilityRealTime(
        slot,
        TutoringSessionService
      );

      if (!realTimeCheck.available) {
        setError('El horario seleccionado ya no está disponible. Por favor selecciona otro.');
        await generateSlotsForSelectedDay();
        return;
      }

      console.log('Slot seleccionado:', slot);
    } catch (error) {
      console.error('Error seleccionando slot:', error);
      setError('Error seleccionando el horario. Por favor intenta de nuevo.');
    }
  };

  const getTileClassName = ({ date: tileDate, view }) => {
    if (view !== 'month') return '';

    const baseClass = 'calendar-tile';
    const selectedDateStr = date.toISOString().split('T')[0];
    const tileDateStr = tileDate instanceof Date && !isNaN(tileDate) ? tileDate.toISOString().split('T')[0] : null;

    const isSelected = tileDateStr && selectedDateStr === tileDateStr;
    const isPast = tileDate < new Date().setHours(0, 0, 0, 0);
    const hasAvailability = Array.isArray(availabilityData) && availabilityData.some(slot => {
      const slotDate = slot.startDateTime ? new Date(slot.startDateTime) : null;
      const slotDateStr = slotDate instanceof Date && !isNaN(slotDate) ? slotDate.toISOString().split('T')[0] : null;
      return slotDateStr === tileDateStr;
    });

    let classes = [baseClass];

    if (isSelected) classes.push('selected');
    if (hasAvailability && !isPast) classes.push('has-availability');
    if (isPast) classes.push('past-date');

    return classes.join(' ');
  };

  return (
    <div className="availability-calendar-container">
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
                  {`${new Date(slot.startDateTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - ${new Date(slot.endDateTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`}
                </div>
                <div className="slot-tutor">
                  <User size={14} />
                  <span>{slot.tutorName || 'Tutor disponible'}</span>
                </div>
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