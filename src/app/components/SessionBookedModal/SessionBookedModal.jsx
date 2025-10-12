"use client";

import React from "react";
import Image from "next/image";
import { CheckCircle, Calendar, Clock, User, BookOpen, MapPin } from "lucide-react";
import "./SessionBookedModal.css";

export default function SessionBookedModal({ 
  isOpen, 
  onClose, 
  sessionData,
  userType = 'student' // 'student' or 'tutor'
}) {
  

  if (!isOpen || !sessionData) return null;

  const formatDate = (dateTime) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('es-ES', { 
        weekday: 'long',
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

  const { date, time } = formatDate(sessionData.scheduledDateTime);

  // Determine content based on user type
  const isTutor = userType === 'tutor';
  const title = isTutor ? '¡Sesión Aprobada!' : '¡Sesión Reservada!';
  const thankYouText = isTutor 
    ? 'Gracias por aprobar la sesión de tutoría.'
    : 'Gracias por reservar con Calico.';
  const statusText = isTutor
    ? 'Has aprobado esta sesión de tutoría. El estudiante recibirá una notificación y el link de Google Meet para la sesión.'
    : 'Tu solicitud ha sido enviada al tutor. Recibirás un correo de confirmación cuando la acepte y el link de Google Meet una vez que sea aprobada.';

  return (
    <div className="session-booked-overlay" onClick={onClose}>
      <div className="session-booked-modal" onClick={(e) => e.stopPropagation()}>
        <div className="session-booked-content">
          {/* Header with title */}
          <div className="session-booked-header">
            <h1 className="session-booked-title">{title}</h1>
          </div>
          {/* Status message */}
          <div className="status-message">
            <p className="status-text">
              {statusText}
            </p>
          </div>
          {/* Calico Cat Image */}
          <div className="cat-illustration" onClick={onClose}>
            <Image
              src="/happy-calico.png"
              alt="Happy Calico Cat"
              width={200}
              height={200}
              className="calico-cat"
              priority
            />
          </div>

          {/* Thank you message */}
          <div className="thank-you-message">
            <p className="thank-you-text">
              {isTutor ? thankYouText : (
                <>
                  Gracias por reservar con <strong>Calico</strong>.
                </>
              )}
            </p>
            <p className="session-details">
              {isTutor ? `Sesión programada para el ${date} a las ${time}` : `Te vemos el ${date} a las ${time}`}
            </p>
          </div>

          {/* Session details */}
          <div className="session-info-card">
            <h3 className="session-info-title">
              {isTutor ? 'Detalles de la sesión aprobada:' : 'Detalles de tu sesión:'}
            </h3>
            <div className="session-details-list">
              <div className="session-detail-item">
                <User className="detail-icon" size={16} />
                <span className="detail-label">{isTutor ? 'Estudiante:' : 'Tutor:'}</span>
                <span className="detail-value">
                  {isTutor ? (sessionData.studentName || sessionData.studentEmail || 'Estudiante') : (sessionData.tutorName || 'Tutor')}
                </span>
              </div>
              
              <div className="session-detail-item">
                <BookOpen className="detail-icon" size={16} />
                <span className="detail-label">Materia:</span>
                <span className="detail-value">{sessionData.subject}</span>
              </div>
              
              <div className="session-detail-item">
                <Calendar className="detail-icon" size={16} />
                <span className="detail-label">Fecha:</span>
                <span className="detail-value">{date}</span>
              </div>
              
              <div className="session-detail-item">
                <Clock className="detail-icon" size={16} />
                <span className="detail-label">Hora:</span>
                <span className="detail-value">{time}</span>
              </div>
              
              {sessionData.location && (
                <div className="session-detail-item">
                  <MapPin className="detail-icon" size={16} />
                  <span className="detail-label">Ubicación:</span>
                  <span className="detail-value">{sessionData.location}</span>
                </div>
              )}
            </div>
          </div>

          

          {/* Close button */}
          <div className="modal-actions">
            <button 
              className="close-modal-btn"
              onClick={onClose}
            >
              ¡Perfecto!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
