"use client";

import React, { useState, useEffect } from "react";
import { TutoringSessionService } from "../../services/TutoringSessionService";
import { SlotService } from "../../services/SlotService";
import { useAuth } from "../../context/SecureAuthContext";
import { PaymentService } from "../../services/PaymentService";
import SessionConfirmationModal from "../SessionConfirmationModal/SessionConfirmationModal";
import "./CalendlyStyleScheduler.css";

export default function CalendlyStyleScheduler({ tutor, availabilities, materia, onBookingComplete }) {
  const { user } = useAuth();
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingNotes, setBookingNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [hourlySlots, setHourlySlots] = useState([]);

  useEffect(() => {
    generateHourlySlots();
  }, [availabilities]);

  const generateHourlySlots = async () => {
    try {
      setSlotsLoading(true);
      setError(null);
      console.log('🔄 Iniciando generación de slots de 1 hora...');
      console.log('📋 Disponibilidades recibidas:', availabilities.length);

      if (availabilities.length === 0) {
        console.log('❌ No hay disponibilidades para procesar');
        setHourlySlots([]);
        return;
      }

      // Generar slots de 1 hora a partir de las disponibilidades
      const generatedSlots = SlotService.generateHourlySlotsFromAvailabilities(availabilities);
      console.log('⚡ Slots generados:', generatedSlots.length);

      // Obtener las reservas existentes de manera más eficiente
      const allBookings = await SlotService.getAllBookingsForAvailabilities(
        availabilities, 
        TutoringSessionService
      );

      // Aplicar las reservas existentes a los slots
      const slotsWithBookings = SlotService.applySavedBookingsToSlots(generatedSlots, allBookings);
      console.log('🔗 Slots con reservas aplicadas:', slotsWithBookings.length);
      
      // Filtrar solo slots disponibles y futuros
      const availableSlots = SlotService.getAvailableSlots(slotsWithBookings);
      console.log('✅ Slots finalmente disponibles:', availableSlots.length);

      setHourlySlots(availableSlots);
    } catch (error) {
      console.error('❌ Error generando slots de 1 hora:', error);
      setError('Error cargando horarios disponibles. Por favor intenta de nuevo.');
    } finally {
      setSlotsLoading(false);
    }
  };

  // Agrupar slots por fecha usando el SlotService
  const groupedSlots = SlotService.groupSlotsByDate(hourlySlots);
  const sortedDates = Object.keys(groupedSlots).sort();

  // Debug: log grouping info whenever hourlySlots changes
  React.useEffect(() => {
    try {
      console.log('🧭 Debug groupedSlots keys:', Object.keys(groupedSlots));
      console.log('🧭 Debug sortedDates:', sortedDates);
      // Print each group's date header and first slot for quick inspection
      Object.keys(groupedSlots).forEach(key => {
        const g = groupedSlots[key];
        console.log(`Group ${key} -> header date:`, g.date, 'slots:', g.slots.length, g.slots.slice(0,2));
      });
    } catch (e) {
      console.warn('Error logging groupedSlots debug info', e);
    }
  }, [hourlySlots]);

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

  const handleSlotSelect = async (slot) => {
    console.log('🎯 Slot seleccionado:', slot.id);

    // Validar el slot básicamente
    const validation = SlotService.validateSlotForBooking(slot);
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }

    // Verificar disponibilidad en tiempo real
    const realTimeCheck = await SlotService.checkSlotAvailabilityRealTime(
      slot, 
      TutoringSessionService
    );

    if (!realTimeCheck.available) {
      setError(realTimeCheck.reason);
      // Regenerar slots para reflejar el cambio
      await generateHourlySlots();
      return;
    }

    setSelectedSlot(slot);
    setShowBookingForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleBooking = async ({ studentEmail, proofFile }) => {
    if (!user.isLoggedIn) {
      setError('Debes iniciar sesión para reservar una tutoría');
      return;
    }

    if (!selectedSlot) {
      setError('Por favor selecciona un horario');
      return;
    }

    if (!studentEmail || !proofFile) {
      setError('Email y comprobante de pago son requeridos');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🚀 Iniciando proceso de reserva para slot:', selectedSlot.id);

      // Verificación final antes de reservar
      const finalCheck = await SlotService.checkSlotAvailabilityRealTime(
        selectedSlot, 
        TutoringSessionService
      );

      if (!finalCheck.available) {
        setError('Lo sentimos, este horario acaba de ser reservado por otro estudiante. Por favor selecciona otro horario.');
        setShowBookingForm(false);
        setSelectedSlot(null);
        await generateHourlySlots();
        return;
      }

      // Proceder con la reserva usando la materia seleccionada por el estudiante
      const result = await TutoringSessionService.bookSpecificSlot(
        selectedSlot,
        studentEmail, // Use provided email for Google Calendar invite
        user.name,
        bookingNotes,
        materia // Pasar la materia que seleccionó el estudiante en buscar-tutores
      );

      console.log('✅ Reserva exitosa:', result);

      // Upload payment proof after successful booking
      if (result.sessionId && proofFile) {
        console.log('📤 Subiendo comprobante de pago...');
        const uploadResult = await PaymentService.uploadPaymentProofFile(result.sessionId, proofFile);
        
        if (uploadResult.success) {
          // Submit payment proof metadata to session
          await TutoringSessionService.submitPaymentProof(result.sessionId, {
            fileUrl: uploadResult.url,
            fileName: uploadResult.fileName,
            amountSent: null, // Can be added later by student/admin
            senderName: user.name,
            transactionNumber: null
          });
          console.log('✅ Comprobante de pago subido exitosamente');
        } else {
          console.warn('⚠️ Error subiendo comprobante:', uploadResult.error);
        }
      }

      setSuccess('¡Horario de 1 hora reservado exitosamente! 🎉');
      setShowBookingForm(false);
      setSelectedSlot(null);
      setBookingNotes('');
      
      // Regenerar slots para reflejar la nueva reserva
      console.log('🔄 Actualizando lista de slots disponibles...');
      await generateHourlySlots();
      
      if (onBookingComplete) {
        onBookingComplete();
      }
    } catch (error) {
      console.error('❌ Error en la reserva:', error);
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

  const handleRefreshSlots = async () => {
    console.log('🔄 Refrescando slots manualmente...');
    await generateHourlySlots();
  };

  if (slotsLoading) {
    return (
      <div className="calendly-scheduler">
        <div className="scheduler-header">
          <h3>Cargando horarios disponibles...</h3>
          <div className="loading-spinner-large">🔄</div>
          <p className="loading-text">Verificando disponibilidad en tiempo real</p>
        </div>
      </div>
    );
  }

  if (hourlySlots.length === 0) {
    return (
      <div className="calendly-scheduler">
        <div className="no-availability-message">
          <div className="icon">📅</div>
          <h3>No hay horarios de 1 hora disponibles</h3>
          <p>Este tutor no tiene horarios disponibles para {materia} en este momento.</p>
          <p className="hint">Los horarios se dividen automáticamente en sesiones de 1 hora.</p>
          <button 
            className="refresh-btn"
            onClick={handleRefreshSlots}
          >
            🔄 Actualizar disponibilidad
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="calendly-scheduler">
      <div className="scheduler-header">
        <h3>Selecciona un horario de 1 hora con {tutor.name}</h3>
        <p className="subject-info">Tutoría de {materia}</p>
        <p className="slot-info">💡 Cada sesión dura exactamente 1 hora</p>
        {tutor.hourlyRate && (
          <p className="price-info">Precio: ${tutor.hourlyRate.toLocaleString()} COP/hora</p>
        )}
        <div className="slots-summary">
          <span className="slots-count">{hourlySlots.length} horarios de 1 hora disponibles</span>
          <button 
            className="refresh-slots-btn"
            onClick={handleRefreshSlots}
            title="Actualizar disponibilidad"
          >
            🔄
          </button>
        </div>
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
          const dayData = groupedSlots[dateKey];
          return (
            <div key={dateKey} className="date-section">
              <div className="date-header">
                <h4>{formatDate(dayData.date)}</h4>
                <span className="slots-count">
                  {dayData.slots.length} sesión{dayData.slots.length !== 1 ? 'es' : ''} de 1h disponible{dayData.slots.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="time-slots">
                {dayData.slots.map((slot, index) => (
                  <div 
                    key={slot.id}
                    className={`time-slot hourly-slot ${selectedSlot?.id === slot.id ? 'selected' : ''}`}
                    onClick={() => handleSlotSelect(slot)}
                  >
                    <div className="slot-time">
                      <span className="start-time">{formatTime(new Date(slot.startDateTime))}</span>
                      <span className="end-time">- {formatTime(new Date(slot.endDateTime))}</span>
                      <span className="duration-badge">1h</span>
                    </div>
                    
                    {slot.location && (
                      <div className="slot-location">
                        📍 {slot.location}
                      </div>
                    )}
                    
                    {slot.description && (
                      <div className="slot-description">
                        {slot.description.length > 40 
                          ? `${slot.description.substring(0, 40)}...`
                          : slot.description
                        }
                      </div>
                    )}

                    <div className="slot-footer">
                      <span className="slot-index">Bloque {slot.slotIndex + 1}</span>
                      {slot.recurring && (
                        <span className="recurring-indicator">🔄</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showBookingForm && selectedSlot && (
        <SessionConfirmationModal
          isOpen={showBookingForm}
          onClose={handleCancelBooking}
          session={{
            subject: materia,
            subjectCode: selectedSlot.subjectCode || '',
            scheduledDateTime: selectedSlot.startDateTime,
            endDateTime: selectedSlot.endDateTime,
            tutorEmail: tutor.email,
            tutorName: tutor.name,
            price: tutor.hourlyRate || 25000,
            location: selectedSlot.location || 'Por definir'
          }}
          onConfirm={handleBooking}
          confirmLoading={loading}
        />
      )}
    </div>
  );
} 