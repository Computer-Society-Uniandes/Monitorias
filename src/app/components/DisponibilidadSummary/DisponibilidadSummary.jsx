"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import routes from "../../../routes";
import "./DisponibilidadSummary.css";
import { AvailabilityService } from "../../services/AvailabilityService";

export default function DisponibilidadSummary() {
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);

  useEffect(() => {
    loadAvailability();
    
    // Escuchar eventos de actualización de Google Calendar
    const handleCalendarUpdate = () => {
      loadAvailability();
    };
    
    window.addEventListener('calendar-status-update', handleCalendarUpdate);
    
    return () => {
      window.removeEventListener('calendar-status-update', handleCalendarUpdate);
      // No detenemos el auto-sync aquí ya que puede estar siendo usado por otros componentes
    };
  }, []);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      
      const result = await AvailabilityService.getAvailabilityWithFallback();
      
      setAvailabilitySlots(result.availabilitySlots);
      setIsConnected(result.connected);
      setUsingMockData(result.usingMockData || false);
      
      console.log('Availability summary loaded:', result);
    } catch (error) {
      console.error('Error loading availability summary:', error);
      // Fallback a mock data en caso de error
      setAvailabilitySlots(AvailabilityService.getMockAvailability());
      setUsingMockData(true);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
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

  const getDayOfWeek = (date) => {
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    return days[date.getDay()];
  };

  const getSlotsForDay = (dayName) => {
    return availabilitySlots.filter(slot => slot.day === dayName);
  };

  const getTotalHoursThisWeek = () => {
    return AvailabilityService.calculateTotalHours(availabilitySlots);
  };

  return (
    <div className="disponibilidad-summary">
      {/* Header */}
      <div className="summary-header">
        <div className="summary-title">
          <h2>⏰ Tu Disponibilidad</h2>
          <p>
            {loading ? 
              'Cargando disponibilidad...' :
              isConnected ? 
                'Horarios sincronizados desde Google Calendar' : 
                'Horarios de ejemplo - Conecta Google Calendar'
            }
          </p>
          {usingMockData && !loading && (
            <span className="mock-indicator">
              ℹ️ Datos de ejemplo
            </span>
          )}
        </div>
        <Link 
          href={routes.TUTOR_DISPONIBILIDAD}
          className="btn-manage-availability"
        >
          Gestionar Disponibilidad
        </Link>
      </div>

      {/* Estadísticas rápidas */}
      <div className="availability-stats">
        <div className="stat-item">
          <span className="stat-number">
            {loading ? '...' : availabilitySlots.length}
          </span>
          <span className="stat-label">Horarios</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">
            {loading ? '...' : getTotalHoursThisWeek()}
          </span>
          <span className="stat-label">Horas/Semana</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">
            {loading ? '...' : availabilitySlots.filter(slot => slot.recurring).length}
          </span>
          <span className="stat-label">Recurrentes</span>
        </div>
      </div>

      {/* Vista compacta de la semana */}
      <div className="week-compact">
        <h3>Esta Semana</h3>
        <div className="week-compact-grid">
          {getCurrentWeekDays().map((day, index) => {
            const dayName = getDayOfWeek(day);
            const slots = getSlotsForDay(dayName);
            const dayShort = dayName.substring(0, 3);
            
            return (
              <div key={index} className="day-compact">
                <div className="day-compact-header">
                  <span className="day-name">{dayShort}</span>
                  <span className="day-number">{day.getDate()}</span>
                </div>
                <div className="day-compact-slots">
                  {slots.length > 0 ? (
                    <div className="slots-indicator">
                      {slots.slice(0, 3).map(slot => (
                        <div 
                          key={slot.id}
                          className="slot-dot"
                          style={{ backgroundColor: slot.color }}
                          title={`${slot.startTime} - ${slot.endTime}`}
                        />
                      ))}
                      {slots.length > 3 && (
                        <span className="more-slots">+{slots.length - 3}</span>
                      )}
                    </div>
                  ) : (
                    <div className="no-slots-indicator">
                      <span className="no-slots-text">-</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Próximos horarios disponibles */}
      <div className="upcoming-slots">
        <h3>Próximos Horarios Disponibles</h3>
        {availabilitySlots.length > 0 ? (
          <div className="slots-list-compact">
            {availabilitySlots.slice(0, 3).map(slot => (
              <div key={slot.id} className="slot-compact">
                <div 
                  className="slot-color-indicator"
                  style={{ backgroundColor: slot.color }}
                />
                <div className="slot-info-compact">
                  <span className="slot-day">{slot.day}</span>
                  <span className="slot-time">{slot.startTime} - {slot.endTime}</span>
                </div>
                <div className="slot-title-compact">
                  {slot.title}
                </div>
              </div>
            ))}
            {availabilitySlots.length > 3 && (
              <Link 
                href={routes.TUTOR_DISPONIBILIDAD}
                className="view-all-slots"
              >
                Ver todos los horarios ({availabilitySlots.length})
              </Link>
            )}
          </div>
        ) : (
          <div className="no-availability">
            <p>No tienes horarios de disponibilidad configurados</p>
            <Link 
              href={routes.TUTOR_DISPONIBILIDAD}
              className="btn-setup-availability"
            >
              Configurar Disponibilidad
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 