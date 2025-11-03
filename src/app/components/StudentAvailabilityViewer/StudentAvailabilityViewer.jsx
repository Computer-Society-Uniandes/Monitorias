"use client";

import React, { useState, useEffect } from "react";
import { AvailabilityService } from "../../services/core/AvailabilityService";
import { SlotService } from "../../services/utils/SlotService";
import "./StudentAvailabilityViewer.css";

export default function StudentAvailabilityViewer() {
  const [availabilities, setAvailabilities] = useState([]);
  const [slots, setSlots] = useState([]);
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

      const availabilitySlots = result.availabilitySlots || [];
      setAvailabilities(availabilitySlots);

      // Generar slots de 1 hora
      const generatedSlots = SlotService.generateHourlySlotsFromAvailabilities(availabilitySlots);
      const availableSlots = SlotService.getAvailableSlots(generatedSlots);
      setSlots(availableSlots);

    } catch (error) {
      console.error('Error loading availabilities:', error);
      setError(error.message);
      setAvailabilities([]);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const groupSlotsByDate = (slots) => {
    return SlotService.groupSlotsByDate(slots);
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

  const groupedSlots = groupSlotsByDate(slots);

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
            `Se encontraron ${slots.length} horarios disponibles en ${Object.keys(groupedSlots).length} días`
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
        <div className="slots-grid">
          {Object.keys(groupedSlots).length === 0 ? (
            <div className="no-results">
              <p>📭 No se encontraron horarios disponibles</p>
              <p>Intenta cambiar los filtros o vuelve más tarde</p>
            </div>
          ) : (
            Object.entries(groupedSlots).map(([date, daySlots]) => (
              <div key={date} className="date-section">
                <div className="date-header">
                  <h4>{date}</h4>
                  <span className="slots-count">
                    {daySlots.length} horario{daySlots.length !== 1 ? 's' : ''} disponible{daySlots.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="time-slots">
                  {daySlots.map(slot => (
                    <div key={slot.id} className="time-slot">
                      <div className="slot-time">
                        {formatDateTime(slot.startDateTime)} - {formatDateTime(slot.endDateTime)}
                      </div>
                      {slot.location && <div className="slot-location"> {slot.location}</div>}
                      {slot.description && <div className="slot-description">{slot.description}</div>}
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