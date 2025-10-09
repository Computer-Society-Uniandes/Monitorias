"use client";

import React, { useState, useEffect } from "react";
import { TutorSearchService } from "../../services/TutorSearchService";
import CalendlyStyleScheduler from "../CalendlyStyleScheduler/CalendlyStyleScheduler";
import "./TutorAvailabilityCard.css";

export default function TutorAvailabilityCard({ tutor, materia }) {
  const [availabilities, setAvailabilities] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduler, setShowScheduler] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTutorAvailability();
  }, [tutor.id]);

  const loadTutorAvailability = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`🔄 Cargando disponibilidad para tutor ${tutor.id} (${tutor.name})`);
      
      const availability = await TutorSearchService.getTutorAvailability(tutor.id, 50);
      console.log(`📋 Obtenidas ${availability.length} disponibilidades para ${tutor.name}`);
      console.log(availability);
      
      // Filtrar solo las disponibilidades futuras y para la materia actual si se especifica
      const now = new Date();
      const filtered = availability.filter(avail => {
        const startDate = new Date(avail.startDateTime);
        const isUpcoming = startDate > now;
        return isUpcoming;
      });
      
      console.log(`✅ Filtradas ${filtered.length} disponibilidades relevantes para ${tutor.name} en ${materia || 'cualquier materia'}`);
      setAvailabilities(filtered);
    } catch (error) {
      console.error(`❌ Error cargando disponibilidad para ${tutor.name}:`, error);
      setError("Error cargando disponibilidad del tutor");
      setAvailabilities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleClick = () => {
    console.log(`🎯 Abriendo scheduler para ${tutor.name} con ${availabilities.length} disponibilidades`);
    setShowScheduler(true);
  };

  const handleCloseScheduler = () => {
    console.log('❌ Cerrando scheduler');
    setShowScheduler(false);
  };

  const handleBookingComplete = () => {
    console.log('✅ Reserva completada - recargando disponibilidades');
    // Recargar la disponibilidad después de una reserva exitosa
    loadTutorAvailability();
    setShowScheduler(false);
  };

  const getAvailableHours = () => {
    if (!filtered.length) return 0;
    return filtered.filter(avail => !avail.isBooked).length;
  };

  const getNextAvailableSlot = () => {
    const availableSlots = filtered.filter(avail => !avail.isBooked);
    if (availableSlots.length === 0) return null;
    
    // Ordenar por fecha y tomar el primero
    const sorted = availableSlots.sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));
    return sorted[0];
  };

  const formatNextSlot = (slot) => {
    if (!slot) return null;
    const date = new Date(slot.startDateTime);
    return {
      date: date.toLocaleDateString('es-ES', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const nextSlot = getNextAvailableSlot();
  const nextSlotFormatted = formatNextSlot(nextSlot);

  if (showScheduler) {
    return (
      <div className="scheduler-overlay">
        <div className="scheduler-container">
          <div className="scheduler-header-bar">
            <h3>Reservar con {tutor.name}</h3>
            <button 
              className="close-scheduler-btn"
              onClick={handleCloseScheduler}
            >
              ✕
            </button>
          </div>
          <CalendlyStyleScheduler
            tutor={tutor}
            availabilities={availabilities}
            materia={materia}
            onBookingComplete={handleBookingComplete}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="tutor-card">
      <div className="tutor-card-header">
        <div className="tutor-avatar">
          <span className="avatar-icon">👨‍🏫</span>
        </div>
        <div className="tutor-info">
          <h3 className="tutor-name">{tutor.name || 'Tutor'}</h3>
          <p className="tutor-email">{tutor.email}</p>
          {tutor.subjects && tutor.subjects.length > 0 && (
            <div className="tutor-subjects">
              <span className="subjects-label">Materias:</span>
              <div className="subjects-list">
                {tutor.subjects.slice(0, 3).map((subject, index) => (
                  <span key={index} className="subject-tag">
                    {subject}
                  </span>
                ))}
                {tutor.subjects.length > 3 && (
                  <span className="more-subjects">+{tutor.subjects.length - 3} más</span>
                )}
              </div>
            </div>
          )}
          {tutor.rating && (
            <div className="tutor-rating">
              <span className="rating-stars">
                {'⭐'.repeat(Math.floor(tutor.rating))}
              </span>
              <span className="rating-number">
                {tutor.rating.toFixed(1)} ({tutor.totalSessions || 0} sesiones)
              </span>
            </div>
          )}
          {tutor.hourlyRate && (
            <div className="tutor-rate">
              <span className="rate-amount">${tutor.hourlyRate.toLocaleString()} COP/hora</span>
            </div>
          )}
        </div>
      </div>

      <div className="availability-section">
        <h4 className="availability-title">
          Disponibilidad
          {loading && <span className="loading-spinner">🔄</span>}
        </h4>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
            <button 
              className="retry-btn"
              onClick={loadTutorAvailability}
            >
              Reintentar
            </button>
          </div>
        )}

        {loading ? (
          <div className="availability-skeleton">
            <div className="skeleton-slot"></div>
            <div className="skeleton-slot"></div>
            <div className="skeleton-slot"></div>
          </div>
        ) : availabilities.length === 0 ? (
          <div className="no-availability">
            <div className="no-availability-icon">📅</div>
            <p>No hay disponibilidad próxima para esta materia</p>
          </div>
        ) : (
          <>
            <div className="availability-summary">
              <div className="summary-item">
                <span className="summary-number">{getAvailableHours()}</span>
                <span className="summary-label">horarios disponibles</span>
              </div>
              
              {nextSlotFormatted && (
                <div className="next-slot">
                  <span className="next-slot-label">Próximo horario:</span>
                  <span className="next-slot-info">
                    {nextSlotFormatted.date} a las {nextSlotFormatted.time}
                  </span>
                </div>
              )}
            </div>

            <div className="schedule-actions">
              <button 
                className="schedule-btn"
                onClick={handleScheduleClick}
              >
                📅 Ver todos los horarios
              </button>
            </div>
          </>
        )}
      </div>

      <div className="tutor-actions">
        <button 
          className="book-now-btn"
          onClick={handleScheduleClick}
          disabled={loading || availabilities.length === 0}
        >
          {availabilities.length > 0 ? '🚀 Reservar ahora' : '❌ Sin disponibilidad'}
        </button>
        <button className="contact-btn">
          💬 Contactar
        </button>
      </div>
    </div>
  );
} 