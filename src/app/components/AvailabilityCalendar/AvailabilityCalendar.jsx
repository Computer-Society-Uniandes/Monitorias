"use client";

import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { Clock, User, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import './AvailabilityCalendar.css';
import { AvailabilityService } from 'app/app/services/AvailabilityService';
import { SlotService } from 'app/app/services/SlotService';
import { TutoringSessionService } from 'app/app/services/TutoringSessionService';
import { GoogleDriveService } from 'app/app/services/GoogleDriveService';
import { useAuth } from 'app/app/context/SecureAuthContext';
import { TutorSearchService } from 'app/app/services/TutorSearchService';
import SessionConfirmationModal from '../SessionConfirmationModal/SessionConfirmationModal';

const AvailabilityCalendar = ({ 
  tutorId = null,        // Para modo individual
  tutorName = null,      // Para modo individual  
  subject = null,        // Para modo conjunto
  mode = 'individual',   // 'individual' o 'joint'
  onDateSelect, 
  selectedDate, 
  loading = false 
}) => {
  const { user } = useAuth();
  const [date, setDate] = useState(selectedDate || new Date());
  const [selectedDaySlots, setSelectedDaySlots] = useState([]);
  const [availabilityData, setAvailabilityData] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState(null);
  const [availabilityDataReady, setAvailabilityDataReady] = useState(false);
  
  // Estados para el modal de confirmación
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadAvailabilityData();
  }, [tutorId, subject, mode]);

  useEffect(() => {
    if (Array.isArray(availabilityData) && availabilityData.length > 0) {
        console.log('availabilityData está listo y tiene datos:', availabilityData);
        setAvailabilityDataReady(true);
    } else {
        console.log('availabilityData no está listo o está vacío:', availabilityData);
        setAvailabilityDataReady(false);
    }
  }, [availabilityData]);

  useEffect(() => {
    if (availabilityDataReady) {
        console.log('Generando slots con availabilityData actualizado:', availabilityData);
        generateSlotsForSelectedDay();
    } else {
        console.log('availabilityData aún no está listo o está vacío:', availabilityData);
    }
  }, [availabilityDataReady, date]);

  const loadAvailabilityData = async () => {
    if (!tutorId && !subject) return;
    try {
      setLoadingData(true);
      setError(null);

      if (mode === 'individual' && tutorId) {
        const tutorAvailability = await TutorSearchService.getTutorAvailability(tutorId, 100);
        console.log('Tutor availability:', tutorAvailability);
        setAvailabilityData(tutorAvailability);
      } else if (mode === 'joint' && subject) {
        // Use joint-availability API to aggregate across all tutors teaching the subject
        const response = await fetch(`/api/joint-availability?subject=${encodeURIComponent(subject)}`);
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Error al obtener disponibilidad conjunta');
        }

        // Flatten tutor slots into availability items expected by SlotService
        const tutors = Array.isArray(data.tutors) ? data.tutors : [];
        const tutorNameByEmail = {};
        tutors.forEach(t => {
          if (t?.mail) tutorNameByEmail[t.mail] = t.name || t.mail;
        });

        const flattened = (data.availabilities || []).flatMap(item => {
          const email = item.tutorEmail;
          const name = tutorNameByEmail[email] || email;
          return (item.slots || []).map(slot => ({
            id: slot.id || `${email}-${slot.start || Math.random()}`,
            tutorId: email,
            tutorEmail: email,
            tutorName: name,
            title: slot.title || 'Disponible',
            description: slot.description || '',
            startDateTime: slot.start,
            endDateTime: slot.end,
            location: slot.location || 'Virtual',
            subject: slot.subject || subject,
            color: '#2196F3',
            googleEventId: slot.id
          }));
        });

        console.log('Joint availability flattened:', flattened.length);
        setAvailabilityData(flattened);
      }
    } catch (error) {
      console.error('Error loading availability data:', error);
      setError('Error cargando disponibilidad. Por favor intenta de nuevo.');
      setAvailabilityData([]);
    } finally {
      setLoadingData(false);
    }
  };

  const generateSlotsForSelectedDay = async () => {
    try {
      console.log('Availability data:', availabilityData);
      if (!Array.isArray(availabilityData) || availabilityData.length === 0) {
        console.warn('generateSlotsForSelectedDay: availabilityData no es un array válido o está vacío');
        setSelectedDaySlots([]);
        return;
      }

      const generatedSlots = SlotService.generateHourlySlotsFromAvailabilities(availabilityData);
      const allBookings = await SlotService.getAllBookingsForAvailabilities(
        availabilityData,
        TutoringSessionService
      );
      const slotsWithBookings = SlotService.applySavedBookingsToSlots(generatedSlots, allBookings);
      const availableSlots = SlotService.getAvailableSlots(slotsWithBookings);

      // Usar componentes de fecha local para evitar problemas con UTC
      const selectedYear = date.getFullYear();
      const selectedMonth = String(date.getMonth() + 1).padStart(2, '0');
      const selectedDay = String(date.getDate()).padStart(2, '0');
      const selectedDateStr = `${selectedYear}-${selectedMonth}-${selectedDay}`;

      console.log('🗓️ Fecha seleccionada (local):', selectedDateStr);

      const daySlots = availableSlots.filter(slot => {
        const slotDate = new Date(slot.startDateTime);
        const slotYear = slotDate.getFullYear();
        const slotMonth = String(slotDate.getMonth() + 1).padStart(2, '0');
        const slotDay = String(slotDate.getDate()).padStart(2, '0');
        const slotDateStr = `${slotYear}-${slotMonth}-${slotDay}`;
        
        const matches = slotDateStr === selectedDateStr;
        if (matches) {
          console.log('✅ Slot coincide:', slotDateStr, slot.startDateTime);
        }
        
        return matches;
      });

      console.log(`📊 Slots encontrados para ${selectedDateStr}:`, daySlots.length);
      setSelectedDaySlots(daySlots);
    } catch (error) {
      console.error('Error generando slots:', error);
      setError('Error generando horarios disponibles. Por favor intenta de nuevo.');
    }
  };

  const handleDateChange = (newDate) => {
    setDate(newDate);
    if (onDateSelect) {
      onDateSelect(newDate);
    }
  };

  const formatSelectedDate = (date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSlotSelect = async (slot) => {
    try {
      const realTimeCheck = await SlotService.checkSlotAvailabilityRealTime(
        slot,
        TutoringSessionService
      );

      if (!realTimeCheck.available) {
        setError('El horario seleccionado ya no está disponible. Por favor selecciona otro.');
        await generateSlotsForSelectedDay();
        return;
      }

      console.log('Slot seleccionado:', slot);
      
      // Abrir modal de confirmación
      setSelectedSlotForBooking(slot);
      setShowConfirmationModal(true);
      setError(null);
    } catch (error) {
      console.error('Error seleccionando slot:', error);
      setError('Error seleccionando el horario. Por favor intenta de nuevo.');
    }
  };

  const handleBookingConfirm = async ({ studentEmail, proofFile }) => {
    if (!selectedSlotForBooking || !user) {
      setError('Información de sesión incompleta');
      return;
    }

    try {
      setConfirmLoading(true);
      setError(null);

      console.log('📝 Iniciando proceso de reserva...');
      console.log('Slot seleccionado:', selectedSlotForBooking);
      console.log('Email del estudiante:', studentEmail);
      console.log('Archivo de comprobante:', proofFile);

      // 1. Crear la sesión de tutoría primero (sin el comprobante aún)
      const sessionData = {
        tutorEmail: selectedSlotForBooking.tutorEmail || tutorId,
        studentEmail: studentEmail,
        studentName: user.displayName || user.email,
        subject: subject || selectedSlotForBooking.subject || 'Tutoría',
        scheduledDateTime: selectedSlotForBooking.startDateTime,
        endDateTime: selectedSlotForBooking.endDateTime,
        location: selectedSlotForBooking.location || 'Virtual',
        notes: selectedSlotForBooking.description || '',
        price: selectedSlotForBooking.price || 25000,
        parentAvailabilityId: selectedSlotForBooking.parentAvailabilityId || selectedSlotForBooking.id,
        slotIndex: selectedSlotForBooking.slotIndex || 0,
        slotId: selectedSlotForBooking.id,
        googleEventId: selectedSlotForBooking.googleEventId,
        status: 'pending',
        tutorApprovalStatus: 'pending',
        paymentStatus: 'pending',
        requestedAt: new Date()
      };

      console.log('📋 Datos de la sesión:', sessionData);
      console.log('💾 Creando sesión en Firestore...');
      
      // Usar el método correcto que ya existe
      const createdSession = await TutoringSessionService.bookSpecificSlot(
        selectedSlotForBooking,
        studentEmail,
        user.displayName || user.email,
        selectedSlotForBooking.description || '',
        subject || selectedSlotForBooking.subject
      );
      
      console.log('✅ Sesión creada exitosamente:', createdSession);

      // 2. Subir comprobante de pago a Google Drive usando el sessionId
      if (proofFile && createdSession.id) {
        console.log('📤 Subiendo comprobante de pago a Google Drive...');
        const paymentProofResult = await GoogleDriveService.uploadPaymentProofFile(createdSession.id, proofFile);
        
        if (paymentProofResult.success) {
          console.log('✅ Comprobante subido a Google Drive:', paymentProofResult);
          
          // 3. Actualizar la sesión con la URL del comprobante
          await TutoringSessionService.updateTutoringSession(createdSession.id, {
            paymentProofUrl: paymentProofResult.url,
            paymentProofFileId: paymentProofResult.fileId,
            paymentProofFileName: paymentProofResult.fileName,
            paymentProofThumbnail: paymentProofResult.thumbnailLink,
            paymentStatus: 'en_verificación'
          });
          
          console.log('✅ Sesión actualizada con comprobante de pago de Google Drive');
        } else {
          console.error('⚠️ Error subiendo comprobante:', paymentProofResult.error);
          // No fallar la reserva si el comprobante no se sube
          alert(`⚠️ La reserva se creó pero hubo un problema al subir el comprobante: ${paymentProofResult.error}\n\nPuedes enviar el comprobante después.`);
        }
      }

      // 4. Cerrar modal y mostrar mensaje de éxito
      setShowConfirmationModal(false);
      setSelectedSlotForBooking(null);
      
      alert(`✅ ¡Reserva exitosa!
      
Tu solicitud de tutoría ha sido enviada al tutor.
      
📧 Recibirás un correo de confirmación a: ${studentEmail}
⏰ Fecha: ${new Date(sessionData.scheduledDateTime).toLocaleString('es-ES')}
📚 Materia: ${sessionData.subject}
      
El tutor revisará tu solicitud y recibirás el link de Google Meet una vez aprobada.`);

      // 5. Recargar la disponibilidad
      await loadAvailabilityData();
      
    } catch (error) {
      console.error('❌ Error creando la sesión:', error);
      setError(`Error al crear la sesión: ${error.message}`);
      alert(`❌ Error al reservar: ${error.message}\n\nPor favor intenta nuevamente.`);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleCloseConfirmationModal = () => {
    setShowConfirmationModal(false);
    setSelectedSlotForBooking(null);
    setError(null);
  };

  const getTileClassName = ({ date: tileDate, view }) => {
    if (view !== 'month') return '';

    const baseClass = 'calendar-tile';
    
    // Usar componentes de fecha local para evitar problemas con UTC
    const selectedYear = date.getFullYear();
    const selectedMonth = String(date.getMonth() + 1).padStart(2, '0');
    const selectedDay = String(date.getDate()).padStart(2, '0');
    const selectedDateStr = `${selectedYear}-${selectedMonth}-${selectedDay}`;
    
    let tileDateStr = null;
    if (tileDate instanceof Date && !isNaN(tileDate)) {
      const tileYear = tileDate.getFullYear();
      const tileMonth = String(tileDate.getMonth() + 1).padStart(2, '0');
      const tileDay = String(tileDate.getDate()).padStart(2, '0');
      tileDateStr = `${tileYear}-${tileMonth}-${tileDay}`;
    }

    const isSelected = tileDateStr && selectedDateStr === tileDateStr;
    const isPast = tileDate < new Date().setHours(0, 0, 0, 0);
    const hasAvailability = Array.isArray(availabilityData) && availabilityData.some(slot => {
      const slotDate = slot.startDateTime ? new Date(slot.startDateTime) : null;
      if (!slotDate || !(slotDate instanceof Date) || isNaN(slotDate)) return false;
      
      const slotYear = slotDate.getFullYear();
      const slotMonth = String(slotDate.getMonth() + 1).padStart(2, '0');
      const slotDay = String(slotDate.getDate()).padStart(2, '0');
      const slotDateStr = `${slotYear}-${slotMonth}-${slotDay}`;
      
      return slotDateStr === tileDateStr;
    });

    let classes = [baseClass];

    if (isSelected) classes.push('selected');
    if (hasAvailability && !isPast) classes.push('has-availability');
    if (isPast) classes.push('past-date');

    return classes.join(' ');
  };

  return (
    <div className="availability-calendar-container">
      <div className="calendar-panel">
        <div className="calendar-header">
          <h3 className="calendar-title">
            {mode === 'joint' ? (
              <>
                <Users size={24} />
                Disponibilidad Conjunta
              </>
            ) : (
              <>
                <User size={24} />
                {tutorName ? `Disponibilidad de ${tutorName}` : 'Disponibilidad Individual'}
              </>
            )}
          </h3>
        </div>

        {loadingData || loading ? (
          <div className="calendar-loading">
            <div className="loading-spinner"></div>
            <p>Cargando disponibilidad...</p>
          </div>
        ) : (
          <Calendar
            onChange={handleDateChange}
            value={date}
            locale="es-ES"
            minDate={new Date()}
            tileClassName={getTileClassName}
            navigationLabel={({ date }) => (
              `${date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`
            )}
            nextLabel={<ChevronRight size={16} />}
            prevLabel={<ChevronLeft size={16} />}
            next2Label={null}
            prev2Label={null}
          />
        )}
      </div>

      <div className="slots-panel">
        <div className="slots-header">
          <h3 className="slots-title">
            <Clock size={20} />
            Horarios Disponibles
          </h3>
          <p className="selected-date">{formatSelectedDate(date)}</p>
        </div>

        <div className="slots-list">
          {selectedDaySlots.length === 0 ? (
            <div className="no-slots">
              <div className="no-slots-icon">📅</div>
              <h4>No hay horarios disponibles</h4>
              <p>Selecciona otro día en el calendario</p>
            </div>
          ) : (
            selectedDaySlots.map((slot) => (
              <div 
                key={slot.id} 
                className="slot-item"
                onClick={() => handleSlotSelect(slot)}
              >
                <div className="slot-time">
                  <Clock size={16} />
                  {`${new Date(slot.startDateTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - ${new Date(slot.endDateTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`}
                </div>
                <div className="slot-tutor">
                  <User size={14} />
                  <span>{slot.tutorName || 'Tutor disponible'}</span>
                </div>
                <button className="book-slot-btn">
                  {mode === 'joint' ? 'Ver opciones' : 'Agendar'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de confirmación de reserva */}
      {showConfirmationModal && selectedSlotForBooking && (
        <SessionConfirmationModal
          isOpen={showConfirmationModal}
          onClose={handleCloseConfirmationModal}
          session={{
            tutorName: tutorName || selectedSlotForBooking.tutorName || 'Tutor',
            tutorEmail: tutorId || selectedSlotForBooking.tutorEmail,
            subject: subject || selectedSlotForBooking.subject || 'Tutoría',
            scheduledDateTime: selectedSlotForBooking.startDateTime,
            endDateTime: selectedSlotForBooking.endDateTime,
            location: selectedSlotForBooking.location || 'Virtual',
            price: selectedSlotForBooking.price || 25000,
            studentEmail: user?.email || '',
          }}
          onConfirm={handleBookingConfirm}
          confirmLoading={confirmLoading}
        />
      )}
    </div>
  );
};

export default AvailabilityCalendar;