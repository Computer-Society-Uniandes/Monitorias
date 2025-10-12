"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Calendar as CalendarIcon, Plus, Edit, Bell, ArrowRight, Clock, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import "./UnifiedAvailability.css";
import { AvailabilityService } from "../../services/AvailabilityService";
import { TutoringSessionService } from "../../services/TutoringSessionService";
import { NotificationService } from "../../services/NotificationService";
import { useAuth } from "../../context/SecureAuthContext";
import { useI18n } from "../../../lib/i18n";
import GoogleCalendarButton from "../GoogleCalendarButton/GoogleCalendarButton";
import TutoringDetailsModal from "../TutoringDetailsModal/TutoringDetailsModal";
import TutorApprovalModal from "../TutorApprovalModal/TutorApprovalModal";

export default function UnifiedAvailability() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [date, setDate] = useState(new Date());
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [pendingSessions, setPendingSessions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);
  const [error, setError] = useState(null);
  
  // Session management
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedSession, setSelectedSession] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Approval modal
  const [selectedPendingSession, setSelectedPendingSession] = useState(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  
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
      console.log('Availability result:', {
        slotsCount: availabilityResult.availabilitySlots?.length || 0,
        connected: availabilityResult.connected,
        source: availabilityResult.source,
        slots: availabilityResult.availabilitySlots?.map(slot => ({
          id: slot.id,
          date: slot.date,
          title: slot.title,
          startTime: slot.startTime
        }))
      });
      
      setAvailabilitySlots(availabilityResult.availabilitySlots);
      setIsConnected(availabilityResult.connected);
      setUsingMockData(availabilityResult.usingMockData || false);
      
      // Filter slots for currently selected day
      filterSlotsForSelectedDay(date);
      
      // Load sessions
      if (user.email) {
        const [fetchedSessions, fetchedPendingSessions, fetchedNotifications] = await Promise.all([
          TutoringSessionService.getTutorSessions(user.email),
          TutoringSessionService.getPendingSessionsForTutor(user.email),
          NotificationService.getTutorNotifications(user.email)
        ]);
        
        const sortedSessions = fetchedSessions.sort((a, b) => 
          new Date(b.scheduledDateTime) - new Date(a.scheduledDateTime)
        );
        setSessions(sortedSessions);
        setPendingSessions(fetchedPendingSessions);
        setNotifications(fetchedNotifications);
      }
      else {
        console.error('Error loading unified data: user.email is undefined');
        setSessions([]);
        setPendingSessions([]);
        setNotifications([]);
      }
      
      console.log('Unified data loaded successfully');
    } catch (error) {
      console.error('Error loading unified data:', error);
      setError(error.message);
      
      // Fallback to mock data
      setAvailabilitySlots([]);

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
    console.log(`Filtering slots for date: ${selectedDateStr}`);
    console.log(`Total availability slots: ${availabilitySlots.length}`);
    console.log('Available slots dates:', availabilitySlots.map(slot => ({ id: slot.id, date: slot.date, title: slot.title })));
    
    const daySlots = availabilitySlots.filter(slot => {
      return slot.date === selectedDateStr;
    });

    console.log(`Found ${daySlots.length} slots for ${selectedDateStr}:`, daySlots.map(slot => ({ id: slot.id, title: slot.title, startTime: slot.startTime })));

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
        setValidationErrors([t('tutorAvailability.connectCalendarRequired')]);
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
      setValidationErrors([error.message || t('tutorAvailability.errorCreatingEvent')]);
    } finally {
      setCreatingEvent(false);
    }
  };

  const handleSessionClick = (session) => {
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  const handlePendingSessionClick = (session) => {
    setSelectedPendingSession(session);
    setIsApprovalModalOpen(true);
  };

  const handleNotificationClick = (notification) => {
    if (notification.type === 'pending_session_request') {
      // Find the corresponding pending session
      const pendingSession = pendingSessions.find(s => s.id === notification.sessionId);
      if (pendingSession) {
        handlePendingSessionClick(pendingSession);
      }
    }
  };

  const handleApprovalComplete = () => {
    // Reload data after approval/decline
    loadData();
  };

  const handleSyncCalendar = async () => {
    if (!user.email || !isConnected) {
      alert(`⚠️ ${t('tutorAvailability.mustBeConnectedToSync')}`);
      return;
    }

    try {
      setSyncing(true);
      
      // Obtener el tutorId del usuario (puedes ajustar esto según tu estructura)
      const tutorId = user.email; // Usar UID o email como ID
      
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
        alert(`✅ ${t('tutorAvailability.syncSuccess')}\n\n- ${t('tutorAvailability.eventsProcessed')}: ${result.syncResults?.totalProcessed || 0}\n- ${t('tutorAvailability.newEvents')}: ${result.syncResults?.created || 0}\n- ${t('tutorAvailability.updatedEvents')}: ${result.syncResults?.updated || 0}`);
        
        // Recargar los datos para mostrar los cambios
        await loadData();
      } else {
        throw new Error(result.error || t('tutorAvailability.syncError'));
      }
    } catch (error) {
      console.error('Error syncing calendar:', error);
      alert(`❌ ${t('tutorAvailability.syncFailed')}: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const getUpcomingSessions = () => {
    const now = new Date();
    return sessions.filter(session => 
      new Date(session.scheduledDateTime) > now && 
      session.status !== 'cancelled' &&
      session.status !== 'pending' // Exclude pending sessions from upcoming
    );
  };

  const getPendingSessionsForDisplay = () => {
    return pendingSessions.filter(session => 
      new Date(session.scheduledDateTime) > new Date()
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
    const localeStr = locale === 'en' ? 'en-US' : 'es-ES';
    return {
      date: date.toLocaleDateString(localeStr, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString(localeStr, { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  if (loading) {
    return (
      <div className="unified-availability-loading">
        <div className="loading-spinner"></div>
        <p>{t('tutorAvailability.loading')}</p>
      </div>
    );
  }

  return (
    <div className="unified-availability">
      <div className="unified-header">
        <h1 className="unified-title">{t('tutorAvailability.title')}</h1>
        <GoogleCalendarButton />
      </div>

      <div className="unified-content">
  {/* Sección izquierda - Calendario y disponibilidad */}
        <div className="calendar-section">
          <div className="calendar-container">
            <Calendar
              onChange={handleDateChange}
              value={date}
              locale={locale === 'en' ? 'en-US' : 'es-ES'}
              minDate={new Date()}
              className="availability-calendar"
              navigationLabel={({ date }) => (
                `${date.toLocaleDateString(locale === 'en' ? 'en-US' : 'es-ES', { month: 'long', year: 'numeric' })}`
              )}
              nextLabel={<ChevronRight size={16} />}
              prevLabel={<ChevronLeft size={16} />}
              next2Label={null}
              prev2Label={null}
            />
          </div>

          <div className="availability-slots">
            <h3>{t('tutorAvailability.availableSlots')}</h3>
            <div className="slot-actions">
              <button 
                id="add-slot-btn"
                className="add-slot-btn"
                onClick={() => setShowAddModal(true)}
              >
                {t('tutorAvailability.addSlot')}
              </button>
              <button 
                id="edit-slots-btn"
                className="edit-slots-btn"
              >
                {t('tutorAvailability.editSlots')}
              </button>
              <button 
                id="sync-calendar-btn"
                className="sync-calendar-btn"
                onClick={handleSyncCalendar}
                disabled={syncing || !isConnected}
                title={!isConnected ? t('tutorAvailability.connectCalendarFirst') : t('tutorAvailability.syncCalendarTitle')}
              >
                <RefreshCw size={16} className={syncing ? "spinning" : ""} />
                {syncing ? t('tutorAvailability.syncing') : t('tutorAvailability.syncCalendar')}
              </button>
            </div>

            {/* Selected Day Slots */}
            <div className="selected-day-slots">
              <h4>
                {date ? t('tutorAvailability.availabilityFor', { 
                  date: date.toLocaleDateString(locale === 'en' ? 'en-US' : 'es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })
                }) : t('tutorAvailability.selectDay')}
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
                          {slot.isBooked ? t('tutorAvailability.booked') : t('tutorAvailability.available')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-slots">
                  <CalendarIcon size={24} />
                  <p>{t('tutorAvailability.noSlotsForDay')}</p>
                  <small>{t('tutorAvailability.useAddSlotHint')}</small>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Section - Sessions */}
        <div className="sessions-section">
          <div className="session-tabs">
            <button 
              id="pending-tab"
              className={`tab ${activeTab === "pending" ? "active" : ""}`}
              onClick={() => setActiveTab("pending")}
            >
              {t('tutorAvailability.pending')} ({getPendingSessionsForDisplay().length})
            </button>
            <button 
              id="upcoming-tab"
              className={`tab ${activeTab === "upcoming" ? "active" : ""}`}
              onClick={() => setActiveTab("upcoming")}
            >
              {t('tutorAvailability.upcoming')}
            </button>
            <button 
              id="past-tab"
              className={`tab ${activeTab === "past" ? "active" : ""}`}
              onClick={() => setActiveTab("past")}
            >
              {t('tutorAvailability.past')}
            </button>
          </div>

          <div className="sessions-content">
            {activeTab === "pending" ? (
              <div className="pending-sessions">
                {getPendingSessionsForDisplay().length > 0 ? (
                  getPendingSessionsForDisplay().map((session, index) => {
                    const { date: sessionDate, time } = formatSessionDateTime(session.scheduledDateTime);
                    return (
                      <div key={index} className="session-item pending-item" onClick={() => handlePendingSessionClick(session)}>
                        <Bell className="session-icon pending-icon" size={16} />
                        <div className="session-info">
                          <h4>{session.subject} - {session.studentName || session.studentEmail}</h4>
                          <p>{sessionDate} - {time}</p>
                          <span className="pending-badge">{t('tutorAvailability.pendingApproval')}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                    <div className="no-sessions">
                    <Bell size={24} />
                    <p>{t('tutorAvailability.noPendingRequests')}</p>
                  </div>
                )}
              </div>
            ) : activeTab === "upcoming" ? (
              <div className="upcoming-sessions">
                {getUpcomingSessions().map((session, index) => {
                  const { date: sessionDate, time } = formatSessionDateTime(session.scheduledDateTime);
                  return (
                    <div key={index} className="session-item" onClick={() => handleSessionClick(session)}>
                      <CalendarIcon className="session-icon" size={16} />
                      <div className="session-info">
                        <h4>{session.subject || t('tutorAvailability.defaultSessionTitle')}</h4>
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
                        <h4>{session.subject || t('tutorAvailability.defaultSessionTitle')}</h4>
                        <p>{sessionDate} - {time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}            
          </div>
        </div>
      </div>

  {/* Modal para agregar horario */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{t('tutorAvailability.addAvailabilitySlot')}</h3>
            
            {validationErrors.length > 0 && (
              <div className="validation-errors">
                {validationErrors.map((error, index) => (
                  <p key={index} className="error-text">{error}</p>
                ))}
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="slot-title">{t('tutorAvailability.titleLabel')}</label>
              <input
                id="slot-title"
                type="text"
                value={newSlot.title}
                onChange={(e) => setNewSlot({...newSlot, title: e.target.value})}
                placeholder={t('tutorAvailability.titlePlaceholder')}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="slot-date">{t('tutorAvailability.dateLabel')}</label>
              <input
                id="slot-date"
                type="date"
                value={newSlot.date}
                onChange={(e) => setNewSlot({...newSlot, date: e.target.value})}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="slot-start-time">{t('tutorAvailability.startTimeLabel')}</label>
                <input
                  id="slot-start-time"
                  type="time"
                  value={newSlot.startTime}
                  onChange={(e) => setNewSlot({...newSlot, startTime: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label htmlFor="slot-end-time">{t('tutorAvailability.endTimeLabel')}</label>
                <input
                  id="slot-end-time"
                  type="time"
                  value={newSlot.endTime}
                  onChange={(e) => setNewSlot({...newSlot, endTime: e.target.value})}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="slot-description">{t('tutorAvailability.descriptionLabel')}</label>
              <textarea
                id="slot-description"
                value={newSlot.description}
                onChange={(e) => setNewSlot({...newSlot, description: e.target.value})}
                placeholder={t('tutorAvailability.descriptionPlaceholder')}
              />
            </div>
            
            <div className="modal-actions">
              <button 
                id="cancel-slot-btn"
                className="cancel-btn"
                onClick={() => setShowAddModal(false)}
              >
                {t('tutorAvailability.cancel')}
              </button>
              <button 
                id="save-slot-btn"
                className="save-btn"
                onClick={handleAddSlot}
                disabled={creatingEvent}
              >
                {creatingEvent ? t('tutorAvailability.creating') : t('tutorAvailability.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Details Modal renderizado con Portal */}
      {typeof window !== 'undefined' && isModalOpen && selectedSession && createPortal(
        <TutoringDetailsModal
          session={selectedSession}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSession(null);
          }}
          onSessionUpdate={loadData}
        />,
        document.body
      )}

      {/* Tutor Approval Modal */}
      {isApprovalModalOpen && selectedPendingSession && (
        <TutorApprovalModal
          session={selectedPendingSession}
          isOpen={isApprovalModalOpen}
          onClose={() => {
            setIsApprovalModalOpen(false);
            setSelectedPendingSession(null);
          }}
          onApprovalComplete={handleApprovalComplete}
        />
      )}
    </div>
  );
}
