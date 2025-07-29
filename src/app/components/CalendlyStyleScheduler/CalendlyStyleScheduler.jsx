"use client";

import React, { useState, useEffect } from "react";
import { TutoringSessionService } from "../../services/TutoringSessionService";
import { useAuth } from "../../context/AuthContext";
import "./CalendlyStyleScheduler.css";

export default function CalendlyStyleScheduler({ tutor, availabilities, materia, onBookingComplete }) {
  const { user } = useAuth();
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingNotes, setBookingNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Filtrar solo disponibilidades futuras y no reservadas
  const availableSlots = availabilities.filter(avail => {
    const startDate = new Date(avail.startDateTime);
    const now = new Date();
    return startDate > now && !avail.isBooked;
  });

  // Agrupar disponibilidades por fecha
  const groupAvailabilitiesByDate = (availabilities) => {
    const grouped = {};
    availabilities.forEach(avail => {
      const date = new Date(avail.startDateTime);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: date,
          slots: []
        };
      }
      grouped[dateKey].slots.push(avail);
    });

    // Ordenar slots por hora dentro de cada día
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].slots.sort((a, b) => 
        new Date(a.startDateTime) - new Date(b.startDateTime)
      );
    });

    return grouped;
  };

  const groupedAvailabilities = groupAvailabilitiesByDate(availableSlots);
  const sortedDates = Object.keys(groupedAvailabilities).sort();

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

  const getDuration = (startDateTime, endDateTime) => {
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    const durationMs = end - start;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes > 0 ? minutes + 'm' : ''}`;
    }
    return `${minutes}m`;
  };

  const handleSlotSelect = (slot) => {
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

      await TutoringSessionService.bookAvailabilitySlot(
        selectedSlot,
        user.email,
        user.name,
        bookingNotes
      );

      setSuccess('¡Tutoría reservada exitosamente!');
      setShowBookingForm(false);
      setSelectedSlot(null);
      setBookingNotes('');
      
      if (onBookingComplete) {
        onBookingComplete();
      }
    } catch (error) {
      console.error('Error booking slot:', error);
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

  if (availableSlots.length === 0) {
    return (
      <div className="calendly-scheduler">
        <div className="no-availability-message">
          <div className="icon">📅</div>
          <h3>No hay horarios disponibles</h3>
          <p>Este tutor no tiene horarios disponibles para {materia} en este momento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="calendly-scheduler">
      <div className="scheduler-header">
        <h3>Selecciona un horario con {tutor.name}</h3>
        <p className="subject-info">Tutoría de {materia}</p>
        {tutor.hourlyRate && (
          <p className="price-info">Precio: ${tutor.hourlyRate.toLocaleString()} COP/hora</p>
        )}
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
          const dayData = groupedAvailabilities[dateKey];
          return (
            <div key={dateKey} className="date-section">
              <div className="date-header">
                <h4>{formatDate(dayData.date)}</h4>
                <span className="slots-count">{dayData.slots.length} horario{dayData.slots.length !== 1 ? 's' : ''} disponible{dayData.slots.length !== 1 ? 's' : ''}</span>
              </div>
              
              <div className="time-slots">
                {dayData.slots.map((slot, index) => (
                  <div 
                    key={slot.id || index}
                    className={`time-slot ${selectedSlot?.id === slot.id ? 'selected' : ''}`}
                    onClick={() => handleSlotSelect(slot)}
                  >
                    <div className="slot-time">
                      <span className="start-time">{formatTime(new Date(slot.startDateTime))}</span>
                      <span className="duration">({getDuration(slot.startDateTime, slot.endDateTime)})</span>
                    </div>
                    
                    {slot.location && (
                      <div className="slot-location">
                        📍 {slot.location}
                      </div>
                    )}
                    
                    {slot.description && (
                      <div className="slot-description">
                        {slot.description}
                      </div>
                    )}
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
              <h4>Confirmar reserva</h4>
              <button className="close-btn" onClick={handleCancelBooking}>×</button>
            </div>
            
            <div className="booking-details">
              <div className="selected-slot-info">
                <h5>Horario seleccionado:</h5>
                <p className="slot-datetime">
                  {formatDate(new Date(selectedSlot.startDateTime))} a las {formatTime(new Date(selectedSlot.startDateTime))}
                </p>
                <p className="slot-duration">
                  Duración: {getDuration(selectedSlot.startDateTime, selectedSlot.endDateTime)}
                </p>
                {selectedSlot.location && (
                  <p className="slot-location">📍 {selectedSlot.location}</p>
                )}
              </div>

              <div className="tutor-info">
                <h5>Tutor:</h5>
                <p>{tutor.name}</p>
                <p>{materia}</p>
              </div>

              <div className="notes-section">
                <label htmlFor="booking-notes">Notas adicionales (opcional):</label>
                <textarea
                  id="booking-notes"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="¿Hay algo específico que te gustaría trabajar en esta sesión?"
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
                  {loading ? 'Reservando...' : 'Confirmar Reserva'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 