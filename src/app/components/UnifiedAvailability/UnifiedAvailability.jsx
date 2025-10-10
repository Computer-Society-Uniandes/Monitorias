"use client";

import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Calendar as CalendarIcon, Plus, Edit, Bell, ArrowRight, Clock, RefreshCw } from "lucide-react";
import "./UnifiedAvailability.css";
import { AvailabilityService } from "../../services/AvailabilityService";
import { TutoringSessionService } from "../../services/TutoringSessionService";
import { useAuth } from "../../context/SecureAuthContext";
import GoogleCalendarButton from "../GoogleCalendarButton/GoogleCalendarButton";
import TutoringDetailsModal from "../TutoringDetailsModal/TutoringDetailsModal";

export default function UnifiedAvailability() {
  const { user } = useAuth();
  const [date, setDate] = useState(new Date());
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);
  const [error, setError] = useState(null);
  
  // Session management
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedSession, setSelectedSession] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Availability management
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSlot, setNewSlot] = useState({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    description: "",
    location: "",
    recurring: false
  });
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [selectedDaySlots, setSelectedDaySlots] = useState([]);

  useEffect(() => {
    loadData();
    
    // Listen for calendar updates
    const handleCalendarUpdate = () => {
      loadData();
    };
    
    window.addEventListener('calendar-status-update', handleCalendarUpdate);
    
    return () => {
      window.removeEventListener('calendar-status-update', handleCalendarUpdate);
      AvailabilityService.stopAutoSync();
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load availability
      const availabilityResult = await AvailabilityService.getAvailabilityWithFallback();
      setAvailabilitySlots(availabilityResult.availabilitySlots);
      setIsConnected(availabilityResult.connected);
      setUsingMockData(availabilityResult.usingMockData || false);
      
      // Filter slots for currently selected day
      filterSlotsForSelectedDay(date);
      
      // Load sessions
      if (user.email) {
        const fetchedSessions = await TutoringSessionService.getTutorSessions(user.email);
        const sortedSessions = fetchedSessions.sort((a, b) => 
          new Date(b.scheduledDateTime) - new Date(a.scheduledDateTime)
        );
        setSessions(sortedSessions);
      }
      
      console.log('Unified data loaded successfully');
    } catch (error) {
      console.error('Error loading unified data:', error);
      setError(error.message);
      
      // Fallback to mock data
      setAvailabilitySlots(AvailabilityService.getMockAvailability());
      setUsingMockData(true);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (newDate) => {
    setDate(newDate);
    filterSlotsForSelectedDay(newDate);
  };

  const filterSlotsForSelectedDay = (selectedDate) => {
    if (!selectedDate || !availabilitySlots.length) {
      setSelectedDaySlots([]);
      return;
    }

    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    const daySlots = availabilitySlots.filter(slot => {
      return slot.date === selectedDateStr;
    });

    // Ordenar por hora de inicio
    daySlots.sort((a, b) => {
      const timeA = a.startTime || '00:00';
      const timeB = b.startTime || '00:00';
      return timeA.localeCompare(timeB);
    });

    setSelectedDaySlots(daySlots);
  };

  const handleAddSlot = async () => {
    try {
      setCreatingEvent(true);
      setValidationErrors([]);
      
      // Validate data
      const validation = AvailabilityService.validateEventData(newSlot);
      
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        return;
      }
      
      if (!isConnected) {
        setValidationErrors(['Debes conectar tu Google Calendar para crear eventos']);
        return;
      }
      
      // Create event
      const result = await AvailabilityService.createAvailabilityEvent(newSlot);
      
      alert(`✅ ${result.message}`);
      
      // Reset form
      setNewSlot({
        title: "",
        date: "",
        startTime: "",
        endTime: "",
        description: "",
        location: "",
        recurring: false
      });
      
      setShowAddModal(false);
      await loadData();
      
    } catch (error) {
      console.error('Error creating event:', error);
      setValidationErrors([error.message || 'Error al crear el evento']);
    } finally {
      setCreatingEvent(false);
    }
  };

  const handleSessionClick = (session) => {
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  const handleSyncCalendar = async () => {
    if (!user.email || !isConnected) {
      alert('⚠️ Debes estar conectado a Google Calendar para sincronizar');
      return;
    }

    try {
      setSyncing(true);
      
      // Obtener el tutorId del usuario (puedes ajustar esto según tu estructura)
      const tutorId = user.uid || user.email; // Usar UID o email como ID
      
      const response = await fetch('/api/availability/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tutorId: tutorId,
          tutorEmail: user.email,
          forceSync: true
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert(`✅ Sincronización exitosa!\n\n- Eventos procesados: ${result.syncResults?.totalProcessed || 0}\n- Nuevos eventos: ${result.syncResults?.created || 0}\n- Actualizados: ${result.syncResults?.updated || 0}`);
        
        // Recargar los datos para mostrar los cambios
        await loadData();
      } else {
        throw new Error(result.error || 'Error en la sincronización');
      }
    } catch (error) {
      console.error('Error syncing calendar:', error);
      alert(`❌ Error al sincronizar: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const getUpcomingSessions = () => {
    const now = new Date();
    return sessions.filter(session => 
      new Date(session.scheduledDateTime) > now && 
      session.status !== 'cancelled'
    );
  };

  const getPastSessions = () => {
    const now = new Date();
    return sessions.filter(session => 
      new Date(session.scheduledDateTime) <= now || 
      session.status === 'cancelled'
    );
  };

  const formatSessionDateTime = (dateTime) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  if (loading) {
    return (
      <div className="unified-availability-loading">
        <div className="loading-spinner"></div>
        <p>Cargando disponibilidad y sesiones...</p>
      </div>
    );
  }

  return (
    <div className="unified-availability">
      <div className="unified-header">
        <h1 className="unified-title">Availability</h1>
        <GoogleCalendarButton />
      </div>

      <div className="unified-content">
        {/* Left Section - Calendar and Availability */}
        <div className="calendar-section">
          <div className="calendar-container">
            <Calendar
              onChange={handleDateChange}
              value={date}
              className="availability-calendar"
            />
          </div>

          <div className="availability-slots">
            <h3>Availability Slots</h3>
            <div className="slot-actions">
              <button 
                className="add-slot-btn"
                onClick={() => setShowAddModal(true)}
              >
                Add Slot
              </button>
              <button className="edit-slots-btn">
                Edit Slots
              </button>
              <button 
                className="sync-calendar-btn"
                onClick={handleSyncCalendar}
                disabled={syncing || !isConnected}
                title={!isConnected ? "Conecta tu Google Calendar primero" : "Sincronizar eventos de Google Calendar"}
              >
                <RefreshCw size={16} className={syncing ? "spinning" : ""} />
                {syncing ? "Syncing..." : "Sync Calendar"}
              </button>
            </div>

            {/* Selected Day Slots */}
            <div className="selected-day-slots">
              <h4>
                {date ? `Disponibilidad para ${date.toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}` : 'Selecciona un día'}
              </h4>
              
              {selectedDaySlots.length > 0 ? (
                <div className="slots-list">
                  {selectedDaySlots.map((slot, index) => (
                    <div key={slot.id || index} className="slot-item">
                      <div className="slot-time">
                        <Clock size={14} />
                        <span>{slot.startTime} - {slot.endTime}</span>
                      </div>
                      <div className="slot-details">
                        <h5>{slot.title}</h5>
                        {slot.description && (
                          <p className="slot-description">{slot.description}</p>
                        )}
                        {slot.location && (
                          <p className="slot-location">📍 {slot.location}</p>
                        )}
                      </div>
                      <div className="slot-status">
                        <span className={`status-badge ${slot.isBooked ? 'booked' : 'available'}`}>
                          {slot.isBooked ? 'Reservado' : 'Disponible'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-slots">
                  <CalendarIcon size={24} />
                  <p>No hay horarios disponibles para este día</p>
                  <small>Usa "Add Slot" para agregar disponibilidad</small>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Section - Sessions */}
        <div className="sessions-section">
          <div className="session-tabs">
            <button 
              className={`tab ${activeTab === "upcoming" ? "active" : ""}`}
              onClick={() => setActiveTab("upcoming")}
            >
              Upcoming Sessions
            </button>
            <button 
              className={`tab ${activeTab === "past" ? "active" : ""}`}
              onClick={() => setActiveTab("past")}
            >
              Past Sessions
            </button>
          </div>

          <div className="sessions-content">
            {activeTab === "upcoming" ? (
              <div className="upcoming-sessions">
                {getUpcomingSessions().map((session, index) => {
                  const { date: sessionDate, time } = formatSessionDateTime(session.scheduledDateTime);
                  return (
                    <div key={index} className="session-item" onClick={() => handleSessionClick(session)}>
                      <CalendarIcon className="session-icon" size={16} />
                      <div className="session-info">
                        <h4>{session.subject || "Introduction to Programming with Student"}</h4>
                        <p>{sessionDate} - {time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="past-sessions">
                {getPastSessions().map((session, index) => {
                  const { date: sessionDate, time } = formatSessionDateTime(session.scheduledDateTime);
                  return (
                    <div key={index} className="session-item" onClick={() => handleSessionClick(session)}>
                      <CalendarIcon className="session-icon" size={16} />
                      <div className="session-info">
                        <h4>{session.subject || "Introduction to Programming with Student"}</h4>
                        <p>{sessionDate} - {time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Notifications */}
            <div className="notifications">
              <div className="notification-item">
                <Bell className="notification-icon" size={16} />
                <div className="notification-content">
                  <p>New session request from Ethan. Click to view details.</p>
                </div>
                <ArrowRight className="notification-arrow" size={16} />
              </div>
              <div className="notification-item">
                <Bell className="notification-icon" size={16} />
                <div className="notification-content">
                  <p>Session with Olivia starts in 15 minutes. Prepare materials.</p>
                </div>
                <ArrowRight className="notification-arrow" size={16} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Slot Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add Availability Slot</h3>
            
            {validationErrors.length > 0 && (
              <div className="validation-errors">
                {validationErrors.map((error, index) => (
                  <p key={index} className="error-text">{error}</p>
                ))}
              </div>
            )}
            
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={newSlot.title}
                onChange={(e) => setNewSlot({...newSlot, title: e.target.value})}
                placeholder="Availability Slot"
              />
            </div>
            
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={newSlot.date}
                onChange={(e) => setNewSlot({...newSlot, date: e.target.value})}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Start Time</label>
                <input
                  type="time"
                  value={newSlot.startTime}
                  onChange={(e) => setNewSlot({...newSlot, startTime: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>End Time</label>
                <input
                  type="time"
                  value={newSlot.endTime}
                  onChange={(e) => setNewSlot({...newSlot, endTime: e.target.value})}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newSlot.description}
                onChange={(e) => setNewSlot({...newSlot, description: e.target.value})}
                placeholder="Optional description"
              />
            </div>
            
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button 
                className="save-btn"
                onClick={handleAddSlot}
                disabled={creatingEvent}
              >
                {creatingEvent ? "Creating..." : "Save Slot"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Details Modal */}
      {isModalOpen && selectedSession && (
        <TutoringDetailsModal
          session={selectedSession}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSession(null);
          }}
          onSessionUpdate={loadData}
        />
      )}
    </div>
  );
}
