"use client";

import React, { useState, useEffect } from "react";
import { TutorSearchService } from "../../services/TutorSearchService";
import "./TutorAvailabilityCard.css";

export default function TutorAvailabilityCard({ tutor, materia }) {
  const [availabilities, setAvailabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadTutorAvailability();
  }, [tutor.id]);

  const loadTutorAvailability = async () => {
    try {
      setLoading(true);
      const availability = await TutorSearchService.getTutorAvailability(tutor.id, 10);
      
      // Filtrar solo las disponibilidades futuras y para la materia actual
      const now = new Date();
      const filtered = availability.filter(avail => {
        const startDate = new Date(avail.startDateTime);
        const isUpcoming = startDate > now;
        const isRelevantSubject = !materia || avail.subject === materia || !avail.subject;
        return isUpcoming && isRelevantSubject;
      });
      
      setAvailabilities(filtered);
    } catch (error) {
      console.error("Error cargando disponibilidad:", error);
      setAvailabilities([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
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

  const getDayFromDate = (dateTime) => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return date.toLocaleDateString('es-ES', { weekday: 'long' });
  };

  const groupAvailabilitiesByDay = (availabilities) => {
    const grouped = {};
    availabilities.forEach(avail => {
      const day = getDayFromDate(avail.startDateTime);
      if (!grouped[day]) {
        grouped[day] = [];
      }
      grouped[day].push(avail);
    });
    return grouped;
  };

  const groupedAvailabilities = groupAvailabilitiesByDay(availabilities);
  const visibleAvailabilities = expanded ? availabilities : availabilities.slice(0, 3);

  return (
    <div className="tutor-card">
      <div className="tutor-card-header">
        <div className="tutor-avatar">
          <span className="avatar-icon">👨‍🏫</span>
        </div>
        <div className="tutor-info">
          <h3 className="tutor-name">{tutor.name || 'Tutor'}</h3>
          <p className="tutor-email">{tutor.email}</p>
          {tutor.stats && (
            <div className="tutor-stats">
              <span className="stat-item">
                📚 {tutor.stats.subjectCount} materia{tutor.stats.subjectCount !== 1 ? 's' : ''}
              </span>
              <span className="stat-item">
                ⏰ {tutor.stats.upcomingSessions} sesiones disponibles
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="availability-section">
        <h4 className="availability-title">
          Disponibilidad próxima
          {loading && <span className="loading-spinner">🔄</span>}
        </h4>

        {loading ? (
          <div className="availability-skeleton">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton-slot"></div>
            ))}
          </div>
        ) : availabilities.length === 0 ? (
          <div className="no-availability">
            <p>No hay disponibilidad próxima para esta materia</p>
          </div>
        ) : (
          <>
            <div className="availability-grid">
              {visibleAvailabilities.map((availability, index) => {
                const { date, time } = formatDateTime(availability.startDateTime);
                return (
                  <div key={availability.id || index} className="availability-slot">
                    <div className="slot-header">
                      <span className="slot-date">{date}</span>
                      <span className="slot-time">{time}</span>
                    </div>
                    
                    {availability.subject && (
                      <div 
                        className="subject-badge"
                        style={{ backgroundColor: availability.color || '#FF7A7A' }}
                      >
                        {availability.subject}
                      </div>
                    )}
                    
                    {availability.location && (
                      <div className="location-info">
                        📍 {availability.location}
                      </div>
                    )}
                    
                    {availability.description && (
                      <div className="description-info">
                        {availability.description.length > 50 
                          ? `${availability.description.substring(0, 50)}...`
                          : availability.description
                        }
                      </div>
                    )}
                    
                    {availability.recurring && (
                      <div className="recurring-badge">
                        🔄 Semanal
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {availabilities.length > 3 && (
              <button 
                className="view-more-btn"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? 'Ver menos' : `Ver ${availabilities.length - 3} más`}
              </button>
            )}
          </>
        )}
      </div>

      <div className="availability-summary">
        <h5>Horarios por día:</h5>
        <div className="day-summary">
          {Object.keys(groupedAvailabilities).length === 0 ? (
            <p className="no-schedule">Sin horarios disponibles</p>
          ) : (
            Object.entries(groupedAvailabilities).map(([day, dayAvails]) => (
              <div key={day} className="day-item">
                <span className="day-name">{day}</span>
                <span className="day-count">{dayAvails.length} sesión{dayAvails.length !== 1 ? 'es' : ''}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="tutor-actions">
        <button className="contact-btn">
          💬 Contactar Tutor
        </button>
        <button className="view-profile-btn">
          👤 Ver Perfil
        </button>
      </div>
    </div>
  );
} 