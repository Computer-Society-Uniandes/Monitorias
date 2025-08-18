"use client";

import React, { useState, useEffect } from "react";
import { TutoringSessionService } from "../../services/TutoringSessionService";
import { SlotService } from "../../services/SlotService";
import { useAuth } from "../../context/SecureAuthContext";
import "./CalendlyStyleScheduler.css";

export default function CalendlyStyleScheduler({ tutor, availabilities, materia, onBookingComplete }) {
  const { user } = useAuth();
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingNotes, setBookingNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [hourlySlots, setHourlySlots] = useState([]);

  useEffect(() => {
    generateHourlySlots();
  }, [availabilities]);

  const generateHourlySlots = async () => {
    try {
      setSlotsLoading(true);
      setError(null);
      console.log('🔄 Iniciando generación de slots de 1 hora...');
      console.log('📋 Disponibilidades recibidas:', availabilities.length);

      if (availabilities.length === 0) {
        console.log('❌ No hay disponibilidades para procesar');
        setHourlySlots([]);
        return;
      }

      // Generar slots de 1 hora a partir de las disponibilidades
      const generatedSlots = SlotService.generateHourlySlotsFromAvailabilities(availabilities);
      console.log('⚡ Slots generados:', generatedSlots.length);

      // Obtener las reservas existentes de manera más eficiente
      const allBookings = await SlotService.getAllBookingsForAvailabilities(
        availabilities, 
        TutoringSessionService
      );

      // Aplicar las reservas existentes a los slots
      const slotsWithBookings = SlotService.applySavedBookingsToSlots(generatedSlots, allBookings);
      console.log('🔗 Slots con reservas aplicadas:', slotsWithBookings.length);
      
      // Filtrar solo slots disponibles y futuros
      const availableSlots = SlotService.getAvailableSlots(slotsWithBookings);
      console.log('✅ Slots finalmente disponibles:', availableSlots.length);

      setHourlySlots(availableSlots);
    } catch (error) {
      console.error('❌ Error generando slots de 1 hora:', error);
      setError('Error cargando horarios disponibles. Por favor intenta de nuevo.');
    } finally {
      setSlotsLoading(false);
    }
  };

  // Agrupar slots por fecha usando el SlotService
  const groupedSlots = SlotService.groupSlotsByDate(hourlySlots);
  const sortedDates = Object.keys(groupedSlots).sort();

  const formatDate = (date) => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('es-ES', options);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleSlotSelect = async (slot) => {
    console.log('🎯 Slot seleccionado:', slot.id);

    // Validar el slot básicamente
    const validation = SlotService.validateSlotForBooking(slot);
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }

    // Verificar disponibilidad en tiempo real
    const realTimeCheck = await SlotService.checkSlotAvailabilityRealTime(
      slot, 
      TutoringSessionService
    );

    if (!realTimeCheck.available) {
      setError(realTimeCheck.reason);
      // Regenerar slots para reflejar el cambio
      await generateHourlySlots();
      return;
    }

    setSelectedSlot(slot);
    setShowBookingForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleBooking = async () => {
    if (!user.isLoggedIn) {
      setError('Debes iniciar sesión para reservar una tutoría');
      return;
    }

    if (!selectedSlot) {
      setError('Por favor selecciona un horario');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🚀 Iniciando proceso de reserva para slot:', selectedSlot.id);

      // Verificación final antes de reservar
      const finalCheck = await SlotService.checkSlotAvailabilityRealTime(
        selectedSlot, 
        TutoringSessionService
      );

      if (!finalCheck.available) {
        setError('Lo sentimos, este horario acaba de ser reservado por otro estudiante. Por favor selecciona otro horario.');
        setShowBookingForm(false);
        setSelectedSlot(null);
        await generateHourlySlots();
        return;
      }

      // Proceder con la reserva
      const result = await TutoringSessionService.bookSpecificSlot(
        selectedSlot,
        user.email,
        user.name,
        bookingNotes,
        materia // Pasar la materia seleccionada
      );

      console.log('✅ Reserva exitosa:', result);

      setSuccess('¡Horario de 1 hora reservado exitosamente! 🎉');
      setShowBookingForm(false);
      setSelectedSlot(null);
      setBookingNotes('');
      
      // Regenerar slots para reflejar la nueva reserva
      console.log('🔄 Actualizando lista de slots disponibles...');
      await generateHourlySlots();
      
      if (onBookingComplete) {
        onBookingComplete();
      }
    } catch (error) {
      console.error('❌ Error en la reserva:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = () => {
    setShowBookingForm(false);
    setSelectedSlot(null);
    setBookingNotes('');
    setError(null);
  };

  const handleRefreshSlots = async () => {
    console.log('🔄 Refrescando slots manualmente...');
    await generateHourlySlots();
  };

  if (slotsLoading) {
    return (
      <div className="calendly-scheduler">
        <div className="scheduler-header">
          <h3>Cargando horarios disponibles...</h3>
          <div className="loading-spinner-large">🔄</div>
          <p className="loading-text">Verificando disponibilidad en tiempo real</p>
        </div>
      </div>
    );
  }

  if (hourlySlots.length === 0) {
    return (
      <div className="calendly-scheduler">
        <div className="no-availability-message">
          <div className="icon">📅</div>
          <h3>No hay horarios de 1 hora disponibles</h3>
          <p>Este tutor no tiene horarios disponibles para {materia} en este momento.</p>
          <p className="hint">Los horarios se dividen automáticamente en sesiones de 1 hora.</p>
          <button 
            className="refresh-btn"
            onClick={handleRefreshSlots}
          >
            🔄 Actualizar disponibilidad
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="calendly-scheduler">
      <div className="scheduler-header">
        <h3>Selecciona un horario de 1 hora con {tutor.name}</h3>
        <p className="subject-info">Tutoría de {materia}</p>
        <p className="slot-info">💡 Cada sesión dura exactamente 1 hora</p>
        {tutor.hourlyRate && (
          <p className="price-info">Precio: ${tutor.hourlyRate.toLocaleString()} COP/hora</p>
        )}
        <div className="slots-summary">
          <span className="slots-count">{hourlySlots.length} horarios de 1 hora disponibles</span>
          <button 
            className="refresh-slots-btn"
            onClick={handleRefreshSlots}
            title="Actualizar disponibilidad"
          >
            🔄
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          <span className="success-icon">✅</span>
          {success}
        </div>
      )}

      <div className="available-dates">
        {sortedDates.map(dateKey => {
          const dayData = groupedSlots[dateKey];
          return (
            <div key={dateKey} className="date-section">
              <div className="date-header">
                <h4>{formatDate(dayData.date)}</h4>
                <span className="slots-count">
                  {dayData.slots.length} sesión{dayData.slots.length !== 1 ? 'es' : ''} de 1h disponible{dayData.slots.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="time-slots">
                {dayData.slots.map((slot, index) => (
                  <div 
                    key={slot.id}
                    className={`time-slot hourly-slot ${selectedSlot?.id === slot.id ? 'selected' : ''}`}
                    onClick={() => handleSlotSelect(slot)}
                  >
                    <div className="slot-time">
                      <span className="start-time">{formatTime(new Date(slot.startDateTime))}</span>
                      <span className="end-time">- {formatTime(new Date(slot.endDateTime))}</span>
                      <span className="duration-badge">1h</span>
                    </div>
                    
                    {slot.location && (
                      <div className="slot-location">
                        📍 {slot.location}
                      </div>
                    )}
                    
                    {slot.description && (
                      <div className="slot-description">
                        {slot.description.length > 40 
                          ? `${slot.description.substring(0, 40)}...`
                          : slot.description
                        }
                      </div>
                    )}

                    <div className="slot-footer">
                      <span className="slot-index">Bloque {slot.slotIndex + 1}</span>
                      {slot.recurring && (
                        <span className="recurring-indicator">🔄</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showBookingForm && selectedSlot && (
        <div className="booking-modal">
          <div className="booking-form">
            <div className="booking-header">
              <h4>Confirmar reserva de 1 hora</h4>
              <button className="close-btn" onClick={handleCancelBooking}>×</button>
            </div>
            
            <div className="booking-details">
              <div className="selected-slot-info">
                <h5>Horario seleccionado:</h5>
                <p className="slot-datetime">
                  {formatDate(new Date(selectedSlot.startDateTime))}
                </p>
                <p className="slot-time-range">
                  {formatTime(new Date(selectedSlot.startDateTime))} - {formatTime(new Date(selectedSlot.endDateTime))}
                </p>
                <p className="slot-duration">
                  <strong>Duración: 1 hora exacta</strong>
                </p>
                {selectedSlot.location && (
                  <p className="slot-location">📍 {selectedSlot.location}</p>
                )}
              </div>

              <div className="tutor-info">
                <h5>Tutor:</h5>
                <p>{tutor.name}</p>
                <p>{materia}</p>
                <p className="session-price">Precio: $25,000 COP</p>
              </div>

              <div className="slot-details">
                <h5>Detalles del bloque:</h5>
                <p>Bloque #{selectedSlot.slotIndex + 1} de la disponibilidad original</p>
                {selectedSlot.recurring && (
                  <p>🔄 Este es un horario recurrente</p>
                )}
                <p className="availability-note">
                  ⚡ Este horario será marcado como no disponible una vez confirmado
                </p>
              </div>

              <div className="notes-section">
                <label htmlFor="booking-notes">Notas para la sesión (opcional):</label>
                <textarea
                  id="booking-notes"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="¿Hay algo específico que te gustaría trabajar en esta sesión de 1 hora?"
                  rows="3"
                />
              </div>

              <div className="booking-actions">
                <button 
                  className="cancel-btn" 
                  onClick={handleCancelBooking}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button 
                  className="confirm-btn" 
                  onClick={handleBooking}
                  disabled={loading}
                >
                  {loading ? 'Verificando y reservando...' : 'Confirmar Reserva de 1h'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 