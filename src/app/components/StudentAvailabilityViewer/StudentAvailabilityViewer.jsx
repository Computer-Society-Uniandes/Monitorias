"use client";

import React, { useState, useEffect } from "react";
import { AvailabilityService } from "../../services/AvailabilityService";
import "./StudentAvailabilityViewer.css";

export default function StudentAvailabilityViewer() {
  const [availabilities, setAvailabilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('week');
  const [error, setError] = useState(null);

  const subjects = [
    'Cálculo', 'Física', 'Matemáticas', 'Programación', 
    'Química', 'Biología', 'Historia', 'Inglés', 
    'Estadística', 'Economía', 'General'
  ];

  useEffect(() => {
    loadAvailabilities();
  }, [selectedSubject, selectedDateRange]);

  const loadAvailabilities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let result;
      
      if (selectedSubject) {
        // Buscar por materia
        result = await AvailabilityService.getAvailabilitiesBySubject(selectedSubject);
      } else {
        // Buscar por rango de fechas
        const now = new Date();
        let endDate;
        
        switch (selectedDateRange) {
          case 'week':
            endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        }
        
        result = await AvailabilityService.getAvailabilitiesInRange(
          now.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );
      }
      
      setAvailabilities(result.availabilitySlots || []);
      
    } catch (error) {
      console.error('Error loading availabilities:', error);
      setError(error.message);
      setAvailabilities([]);
    } finally {
      setLoading(false);
    }
  };

  const groupAvailabilitiesByTutor = (availabilities) => {
    const grouped = {};
    availabilities.forEach(availability => {
      const tutorEmail = availability.tutorEmail;
      if (!grouped[tutorEmail]) {
        grouped[tutorEmail] = [];
      }
      grouped[tutorEmail].push(availability);
    });
    return grouped;
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return date.toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const groupedAvailabilities = groupAvailabilitiesByTutor(availabilities);

  return (
    <div className="student-availability-viewer">
      <div className="viewer-header">
        <h1>🔍 Disponibilidad de Tutores</h1>
        <p>Encuentra tutores disponibles según tu materia y horario preferido</p>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label>Filtrar por materia:</label>
          <select 
            value={selectedSubject} 
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">Todas las materias</option>
            {subjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Rango de tiempo:</label>
          <select 
            value={selectedDateRange} 
            onChange={(e) => setSelectedDateRange(e.target.value)}
            disabled={!!selectedSubject}
          >
            <option value="week">Próxima semana</option>
            <option value="month">Próximo mes</option>
          </select>
        </div>

        <button 
          className="btn-refresh-availabilities"
          onClick={loadAvailabilities}
          disabled={loading}
        >
          {loading ? '🔄 Cargando...' : '🔄 Actualizar'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <p>⚠️ Error: {error}</p>
          <button onClick={loadAvailabilities}>Reintentar</button>
        </div>
      )}

      <div className="results-summary">
        <p>
          {loading ? 
            'Cargando disponibilidades...' : 
            `Se encontraron ${availabilities.length} horarios disponibles de ${Object.keys(groupedAvailabilities).length} tutores`
          }
        </p>
      </div>

      {loading ? (
        <div className="loading-skeleton">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton-tutor-card">
              <div className="skeleton-header"></div>
              <div className="skeleton-availability"></div>
              <div className="skeleton-availability"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="tutors-grid">
          {Object.keys(groupedAvailabilities).length === 0 ? (
            <div className="no-results">
              <p>📭 No se encontraron disponibilidades</p>
              <p>Intenta cambiar los filtros o vuelve más tarde</p>
            </div>
          ) : (
            Object.entries(groupedAvailabilities).map(([tutorEmail, tutorAvailabilities]) => (
              <div key={tutorEmail} className="tutor-card">
                <div className="tutor-header">
                  <h3>👨‍🏫 {tutorEmail}</h3>
                  <span className="availability-count">
                    {tutorAvailabilities.length} horarios disponibles
                  </span>
                </div>
                
                <div className="availabilities-list">
                  {tutorAvailabilities.map(availability => (
                    <div key={availability.id} className="availability-item">
                      <div className="availability-header">
                        <span 
                          className="subject-tag" 
                          style={{ backgroundColor: availability.color }}
                        >
                          {availability.subject}
                        </span>
                        <span className="availability-title">
                          {availability.title}
                        </span>
                      </div>
                      
                      <div className="availability-details">
                        <div className="availability-time">
                          📅 {formatDateTime(availability.startDateTime)} - {availability.endTime}
                        </div>
                        
                        {availability.location && (
                          <div className="availability-location">
                            📍 {availability.location}
                          </div>
                        )}
                        
                        {availability.description && (
                          <div className="availability-description">
                            {availability.description}
                          </div>
                        )}
                        
                        {availability.recurring && (
                          <span className="recurring-badge">
                            🔄 Semanal
                          </span>
                        )}
                      </div>
                      
                      <button className="btn-contact-tutor">
                        💬 Contactar Tutor
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
} 