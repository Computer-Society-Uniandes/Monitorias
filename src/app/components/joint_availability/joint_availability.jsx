"use client";

import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./joint_availability.css";
import { Calendar as CalendarIcon, Users, Clock, ChevronRight, ArrowLeft, RefreshCw } from "lucide-react";
import { JointAvailabilityService } from "../../services/JointAvailabilityService";
import Header from "../Header/Header";
import { useRouter } from "next/navigation";

export default function JointAvailability({ subject = "Matemáticas" }) {
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDaySlots, setSelectedDaySlots] = useState([]);
  const [allAvailabilities, setAllAvailabilities] = useState([]);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadJointAvailability();
  }, [subject]);

  useEffect(() => {
    if (allAvailabilities.length > 0) {
      generateJointSlotsForDay(date);
    }
  }, [date, allAvailabilities]);

  const loadJointAvailability = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`🔍 Loading joint availability for subject: ${subject}`);

      // Usar la nueva API optimizada para disponibilidad conjunta
      const response = await fetch(`/api/joint-availability?subject=${encodeURIComponent(subject)}`);
      
      if (!response) {
        throw new Error('No response received from server');
      }
      
      console.log(`📡 API Response status: ${response.status}`);
      
      if (!response.ok) {
        // Intentar obtener el mensaje de error del servidor
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error('❌ Server error details:', errorData);
        } catch (parseError) {
          console.error('❌ Could not parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('📊 API Response data:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch joint availability');
      }

      // Establecer datos obtenidos de la API
      setTutors(data.tutors);
      setAllAvailabilities(data.availabilities);
      setStats(data.stats);

      console.log('📊 Joint availability loaded successfully:', {
        tutors: data.tutors.length,
        availabilities: data.availabilities.length,
        stats: data.stats,
        details: data.availabilities.map(a => ({
          tutor: a.tutorEmail,
          slots: a.slots.length,
          connected: a.connected,
          error: a.error
        }))
      });

      // Mostrar información detallada por tutor
      data.availabilities.forEach(({ tutorEmail, slots, connected, error }) => {
        const tutor = data.tutors.find(t => t.mail === tutorEmail);
        console.log(`👤 ${tutor?.name || tutorEmail}: ${slots.length} slots, connected: ${connected}${error ? `, error: ${error}` : ''}`);
      });

      // Si no hay tutores, mostrar mensaje apropiado
      if (data.tutors.length === 0) {
        setError(`No se encontraron tutores para la materia "${subject}". Verifica que la materia esté escrita correctamente.`);
      }

    } catch (error) {
      console.error('❌ Error loading joint availability:', error);
      setError(`Error cargando disponibilidad conjunta: ${error.message}`);
      
      // En caso de error, limpiar datos
      setTutors([]);
      setAllAvailabilities([]);
      setStats({ totalTutors: 0, connectedTutors: 0, totalSlots: 0, averageSlotsPerTutor: 0, tutorsWithSlots: 0 });
    } finally {
      setLoading(false);
    }
  };

  const generateJointSlotsForDay = (selectedDate) => {
    if (!allAvailabilities.length) {
      setSelectedDaySlots([]);
      return;
    }

    console.log(`📅 Generating slots for ${selectedDate.toISOString().split('T')[0]}`);
    
    const jointSlots = JointAvailabilityService.generateJointSlotsForDay(allAvailabilities, selectedDate);
    
    // Enriquecer los slots con información detallada de los tutores
    const enrichedSlots = jointSlots.map(slot => ({
      ...slot,
      tutors: slot.tutors.map(tutorRef => {
        const tutor = tutors.find(t => t.mail === tutorRef.email);
        return {
          ...tutorRef,
          name: tutor?.name || 'Tutor desconocido',
          rating: tutor?.rating || 4.5,
          totalSessions: tutor?.totalSessions || 0
        };
      })
    }));

    console.log(`⏰ Generated ${enrichedSlots.length} joint slots for selected day`);
    setSelectedDaySlots(enrichedSlots);
  };

  const handleDateChange = (newDate) => {
    setDate(newDate);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    console.log('🔄 Refreshing joint availability data...');
    await loadJointAvailability();
    setRefreshing(false);
    console.log('✅ Joint availability data refreshed');
  };

  const handleBackToSearch = () => {
    router.back();
  };

  const formatDate = (date) => {
    return JointAvailabilityService.formatDateSpanish(date);
  };

  const getTutorInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getTutorSummarySlots = (tutorEmail) => {
    const tutorAvailability = allAvailabilities.find(a => a.tutorEmail === tutorEmail);
    if (!tutorAvailability || !tutorAvailability.slots || tutorAvailability.slots.length === 0) {
      return [];
    }
    
    // Filtrar slots futuros y obtener algunos ejemplos para mostrar
    const futureSlots = JointAvailabilityService.filterFutureSlots(tutorAvailability.slots);
    
    // Obtener las primeras 3 horas disponibles como resumen
    return futureSlots.slice(0, 3).map(slot => {
      const timeStr = slot.startTime || JointAvailabilityService.extractTimeFromDateTime(slot.start);
      const dateStr = slot.date || slot.start?.split('T')[0];
      
      // Mostrar solo la hora para el resumen
      return timeStr || 'N/A';
    });
  };

  if (loading) {
    return (
      <div className="joint-availability-container">
        <Header />
        <div className="joint-availability-header">
          <div className="header-content">
            <h1 className="main-title">Disponibilidad Conjunta</h1>
            <p className="subtitle">Cargando disponibilidad de tutores...</p>
          </div>
        </div>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Cargando información de tutores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="joint-availability-container">
      <Header />
      
      <div className="joint-availability-header">
        <div className="header-content">
          <div className="header-actions-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button 
                onClick={handleBackToSearch}
                className="back-button text-[#FF9505] hover:text-[#FDAE1E] transition-colors"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <ArrowLeft size={24} />
              </button>
              <div className="header-text">
                <h1 className="main-title">Disponibilidad Conjunta</h1>
                <p className="subtitle">Encuentra horarios disponibles de todos los tutores</p>
              </div>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="refresh-button bg-white border-2 border-[#FDAE1E] text-[#FF9505] px-4 py-2 rounded-lg hover:bg-[#FFF8F0] transition-all flex items-center gap-2"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </div>
      </div>

      <div className="joint-availability-content">
        {/* Panel Izquierdo - Lista de Tutores */}
        <div className="tutors-panel">
          <div className="panel-header">
            <h2 className="panel-title">
              <Users size={24} />
              Tutores Disponibles
            </h2>
            <div className="subject-badge">{subject}</div>
          </div>

          {stats && (
            <div style={{ 
              background: '#FFF8F0', 
              border: '2px solid #FDAE1E', 
              borderRadius: '8px', 
              padding: '1rem', 
              marginBottom: '1.5rem',
              fontSize: '0.9rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span><strong>{stats.totalTutors}</strong> tutores encontrados</span>
                <span><strong>{stats.tutorsWithSlots}</strong> con disponibilidad</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span><strong>{stats.totalSlots}</strong> slots disponibles</span>
                <span><strong>{stats.connectedTutors}</strong> conectados a Calendar</span>
              </div>
            </div>
          )}

          {error && (
            <div className="error-state">
              <p>{error}</p>
            </div>
          )}

          <div className="tutors-list">
            {tutors.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👨‍🏫</div>
                <p>No hay tutores disponibles para {subject}</p>
              </div>
            ) : (
              tutors.map((tutor) => {
                const availability = allAvailabilities.find(a => a.tutorEmail === tutor.mail);
                const isConnected = availability?.connected || false;
                const hasError = availability?.error;
                const slotsCount = availability?.slots?.length || 0;
                
                return (
                  <div key={tutor.id} className="tutor-card">
                    <div className="tutor-info">
                      <div className="tutor-avatar">
                        {getTutorInitials(tutor.name)}
                      </div>
                      <div className="tutor-details">
                        <h4>{tutor.name}</h4>
                        <p>
                          ★ {tutor.rating || 4.5} • {tutor.totalSessions || 0} sesiones
                          {isConnected && <span style={{ color: '#10B981', marginLeft: '0.5rem' }}>• 📅 Conectado</span>}
                          {hasError && <span style={{ color: '#EF4444', marginLeft: '0.5rem' }}>• ⚠️ Error</span>}
                        </p>
                        {slotsCount > 0 && (
                          <p style={{ fontSize: '0.8rem', color: '#FF9505', margin: '0.25rem 0 0 0' }}>
                            {slotsCount} horarios disponibles
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="availability-summary">
                      {slotsCount === 0 ? (
                        <span className="time-slot-chip" style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA', color: '#DC2626' }}>
                          Sin disponibilidad
                        </span>
                      ) : (
                        <>
                          {getTutorSummarySlots(tutor.mail).map((time, index) => (
                            <span key={index} className="time-slot-chip">
                              {time}
                            </span>
                          ))}
                          {slotsCount > 3 && (
                            <span className="time-slot-chip" style={{ backgroundColor: '#FDAE1E', color: '#FFFFFF', borderColor: '#FDAE1E' }}>
                              +{slotsCount - 3} más
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Panel Derecho - Calendario */}
        <div className="calendar-panel">
          <div className="panel-header">
            <h2 className="panel-title">
              <CalendarIcon size={24} />
              Calendario de Disponibilidad
            </h2>
          </div>

          <Calendar
            onChange={handleDateChange}
            value={date}
            locale="es-ES"
            minDate={new Date()}
          />

          {/* Horarios del día seleccionado */}
          <div className="selected-day-schedule">
            <div className="schedule-header">
              <Clock size={20} />
              {formatDate(date)}
            </div>

            <div className="time-slots-grid">
              {selectedDaySlots.length === 0 ? (
                <div className="empty-state">
                  <p>No hay horarios disponibles para este día</p>
                </div>
              ) : (
                selectedDaySlots.map((slot, index) => (
                  <div key={index} className="joint-time-slot">
                    <div className="slot-time">
                      {slot.time}
                    </div>
                    <div className="slot-tutors">
                      {slot.tutors.length} tutor{slot.tutors.length !== 1 ? 'es' : ''} disponible{slot.tutors.length !== 1 ? 's' : ''}
                      <br />
                      <small style={{ color: '#101F24', fontSize: '0.7rem' }}>
                        {slot.tutors.slice(0, 2).map(t => t.name).join(', ')}
                        {slot.tutors.length > 2 && ` +${slot.tutors.length - 2} más`}
                      </small>
                    </div>
                    <ChevronRight size={16} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}