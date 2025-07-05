"use client";

import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./Disponibilidad.css";
import { AvailabilityService } from "../../services/AvailabilityService";

export default function Disponibilidad() {
  const [date, setDate] = useState(new Date());
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);
  const [error, setError] = useState(null);
  const [newSlot, setNewSlot] = useState({
    startTime: "",
    endTime: "",
    day: "",
    title: "",
    recurring: true
  });

  useEffect(() => {
    loadAvailability();
    
    // Escuchar eventos de actualización de Google Calendar
    const handleCalendarUpdate = () => {
      loadAvailability();
    };
    
    window.addEventListener('calendar-status-update', handleCalendarUpdate);
    
    return () => {
      window.removeEventListener('calendar-status-update', handleCalendarUpdate);
    };
  }, []);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await AvailabilityService.getAvailabilityWithFallback();
      
      setAvailabilitySlots(result.availabilitySlots);
      setIsConnected(result.connected);
      setUsingMockData(result.usingMockData || false);
      
      if (result.error) {
        setError(result.error);
      }
      
      console.log('Availability loaded:', result);
    } catch (error) {
      console.error('Error loading availability:', error);
      setError(error.message);
      // Fallback a mock data en caso de error
      setAvailabilitySlots(AvailabilityService.getMockAvailability());
      setUsingMockData(true);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (newDate) => {
    setDate(newDate);
  };

  const handleAddSlot = () => {
    if (newSlot.title && newSlot.day && newSlot.startTime && newSlot.endTime) {
      const slot = {
        id: Date.now(),
        ...newSlot,
        color: getRandomColor()
      };
      setAvailabilitySlots([...availabilitySlots, slot]);
      setNewSlot({ startTime: "", endTime: "", day: "", title: "", recurring: true });
      setShowAddModal(false);
    }
  };

  const handleDeleteSlot = (slotId) => {
    setAvailabilitySlots(availabilitySlots.filter(slot => slot.id !== slotId));
  };

  const getRandomColor = () => {
    const colors = ["#4CAF50", "#2196F3", "#FF9800", "#9C27B0", "#607D8B", "#E91E63"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const getDayOfWeek = (date) => {
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    return days[date.getDay()];
  };

  const getSlotsForDay = (dayName) => {
    return availabilitySlots.filter(slot => slot.day === dayName);
  };

  const getCurrentWeekDays = () => {
    const today = new Date();
    const currentWeek = [];
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      currentWeek.push(day);
    }
    
    return currentWeek;
  };

  return (
    <div className="disponibilidad-container">
      {/* Header */}
      <div className="disponibilidad-header">
        <div className="header-left">
          <h1 className="disponibilidad-title">
            📅 Gestión de Disponibilidad
          </h1>
          <p className="disponibilidad-subtitle">
            {isConnected ? 
              'Horarios obtenidos desde tu Google Calendar' : 
              'Conecta tu Google Calendar para sincronizar disponibilidad'
            }
          </p>
          {/* Indicador de estado */}
          <div className="connection-status">
            {loading ? (
              <span className="status-indicator loading">
                🔄 Cargando...
              </span>
            ) : isConnected ? (
              <span className="status-indicator connected">
                ✅ Conectado a Google Calendar
              </span>
            ) : (
              <span className="status-indicator disconnected">
                ❌ No conectado - Usando datos de ejemplo
              </span>
            )}
            {usingMockData && (
              <span className="mock-data-indicator">
                ℹ️ Mostrando datos de ejemplo
              </span>
            )}
          </div>
        </div>
        
        <div className="header-buttons">
          <button 
            className="btn-refresh"
            onClick={loadAvailability}
            disabled={loading}
          >
            {loading ? '🔄' : '🔄'} Actualizar
          </button>
          <button 
            className="btn-add-slot"
            onClick={() => setShowAddModal(true)}
          >
            + Agregar Horario
          </button>
        </div>
      </div>

      <div className="disponibilidad-content">
        {/* Mensaje de error */}
        {error && (
          <div className="error-message">
            <p>⚠️ Error al cargar disponibilidad: {error}</p>
            <button className="btn-retry" onClick={loadAvailability}>
              Reintentar
            </button>
          </div>
        )}
        
        {/* Vista Semanal */}
        <div className="week-view">
          <h2 className="section-title">📊 Vista Semanal</h2>
          {loading ? (
            <div className="loading-skeleton">
              <div className="skeleton-week-grid">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="skeleton-day">
                    <div className="skeleton-day-header"></div>
                    <div className="skeleton-slots">
                      <div className="skeleton-slot"></div>
                      <div className="skeleton-slot"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="week-grid">
              {getCurrentWeekDays().map((day, index) => {
                const dayName = getDayOfWeek(day);
                const slots = getSlotsForDay(dayName);
                
                return (
                  <div key={index} className="day-column">
                    <div className="day-header">
                      <h3>{dayName}</h3>
                      <span className="day-date">
                        {day.toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="day-slots">
                      {slots.length > 0 ? (
                        slots.map(slot => (
                          <div 
                            key={slot.id}
                            className="slot-card"
                            style={{ borderLeftColor: slot.color }}
                          >
                            <div className="slot-time">
                              {slot.startTime} - {slot.endTime}
                            </div>
                            <div className="slot-title">
                              {slot.title}
                            </div>
                            <button 
                              className="btn-delete-slot"
                              onClick={() => handleDeleteSlot(slot.id)}
                            >
                              ×
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="no-slots">
                          Sin horarios disponibles
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Calendario y Lista de Slots */}
        <div className="calendar-section">
          <div className="calendar-container">
            <h2 className="section-title">📅 Calendario</h2>
            <Calendar
              onChange={handleDateChange}
              value={date}
              className="custom-calendar"
              tileContent={({ date, view }) => {
                if (view === 'month') {
                  const dayName = getDayOfWeek(date);
                  const slots = getSlotsForDay(dayName);
                  if (slots.length > 0) {
                    return (
                      <div className="calendar-slots">
                        {slots.slice(0, 2).map(slot => (
                          <div 
                            key={slot.id}
                            className="calendar-slot-dot"
                            style={{ backgroundColor: slot.color }}
                          />
                        ))}
                      </div>
                    );
                  }
                }
                return null;
              }}
            />
          </div>

          <div className="slots-list">
            <h2 className="section-title">⏰ Horarios Configurados</h2>
            {availabilitySlots.length > 0 ? (
              <div className="slots-grid">
                {availabilitySlots.map(slot => (
                  <div 
                    key={slot.id}
                    className="slot-item"
                    style={{ borderLeftColor: slot.color }}
                  >
                    <div className="slot-info">
                      <h4>{slot.title}</h4>
                      <p className="slot-schedule">
                        {slot.day} • {slot.startTime} - {slot.endTime}
                      </p>
                      <span className="slot-recurring">
                        {slot.recurring ? "📅 Semanal" : "📅 Una vez"}
                      </span>
                      {slot.description && (
                        <p className="slot-description">{slot.description}</p>
                      )}
                      {slot.location && (
                        <p className="slot-location">📍 {slot.location}</p>
                      )}
                    </div>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDeleteSlot(slot.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-slots-message">
                <p>No tienes horarios de disponibilidad configurados.</p>
                <button 
                  className="btn-add-first"
                  onClick={() => setShowAddModal(true)}
                >
                  Agregar mi primer horario
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para agregar nuevo slot */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Agregar Nuevo Horario</h3>
            
            <div className="form-group">
              <label>Título del horario:</label>
              <input
                type="text"
                value={newSlot.title}
                onChange={(e) => setNewSlot({...newSlot, title: e.target.value})}
                placeholder="Ej: Disponible para Cálculo"
              />
            </div>

            <div className="form-group">
              <label>Día de la semana:</label>
              <select
                value={newSlot.day}
                onChange={(e) => setNewSlot({...newSlot, day: e.target.value})}
              >
                <option value="">Seleccionar día</option>
                <option value="Lunes">Lunes</option>
                <option value="Martes">Martes</option>
                <option value="Miércoles">Miércoles</option>
                <option value="Jueves">Jueves</option>
                <option value="Viernes">Viernes</option>
                <option value="Sábado">Sábado</option>
                <option value="Domingo">Domingo</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Hora de inicio:</label>
                <input
                  type="time"
                  value={newSlot.startTime}
                  onChange={(e) => setNewSlot({...newSlot, startTime: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Hora de fin:</label>
                <input
                  type="time"
                  value={newSlot.endTime}
                  onChange={(e) => setNewSlot({...newSlot, endTime: e.target.value})}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={newSlot.recurring}
                  onChange={(e) => setNewSlot({...newSlot, recurring: e.target.checked})}
                />
                Repetir cada semana
              </label>
            </div>

            <div className="modal-actions">
              <button 
                className="btn-cancel"
                onClick={() => setShowAddModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-confirm"
                onClick={handleAddSlot}
              >
                Agregar Horario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 