"use client";

import React from "react";
import Image from "next/image";
import { CheckCircle, Calendar, Clock, User, BookOpen, MapPin } from "lucide-react";
import "./SessionBookedModal.css";
import { useI18n } from "app/lib/i18n";

export default function SessionBookedModal({ 
  isOpen, 
  onClose, 
  sessionData,
  userType = 'student' // 'student' or 'tutor'
}) {
  const { t, locale } = useI18n();
  

  if (!isOpen || !sessionData) return null;

  const formatDate = (dateTime) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString(locale === 'en' ? 'en-US' : 'es-ES', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString(locale === 'en' ? 'en-US' : 'es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const { date, time } = formatDate(sessionData.scheduledDateTime);

  // Determine content based on user type
  const isTutor = userType === 'tutor';
  const title = isTutor ? t('availability.bookedModal.approvedTitle') : t('availability.bookedModal.reservedTitle');
  const thankYouText = isTutor 
    ? t('availability.bookedModal.thanksTutor')
    : t('availability.bookedModal.thanksStudent');
  const statusText = isTutor
    ? t('availability.bookedModal.statusTutor')
    : t('availability.bookedModal.statusStudent');

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
              {thankYouText}
            </p>
            <p className="session-details">
              {isTutor 
                ? t('availability.bookedModal.scheduled', { date, time })
                : t('availability.bookedModal.seeYou', { date, time })}
            </p>
          </div>

          {/* Session details */}
          <div className="session-info-card">
            <h3 className="session-info-title">
              {isTutor ? t('availability.bookedModal.detailsApproved') : t('availability.bookedModal.detailsYour')}
            </h3>
            <div className="session-details-list">
              <div className="session-detail-item">
                <User className="detail-icon" size={16} />
                <span className="detail-label">{isTutor ? t('availability.bookedModal.labels.student') : t('availability.bookedModal.labels.tutor')}</span>
                <span className="detail-value">
                  {isTutor ? (sessionData.studentName || sessionData.studentEmail || t('common.student')) : (sessionData.tutorName || t('common.tutor'))}
                </span>
              </div>
              
              <div className="session-detail-item">
                <BookOpen className="detail-icon" size={16} />
                <span className="detail-label">{t('availability.bookedModal.labels.subject')}</span>
                <span className="detail-value">{sessionData.subject}</span>
              </div>
              
              <div className="session-detail-item">
                <Calendar className="detail-icon" size={16} />
                <span className="detail-label">{t('availability.bookedModal.labels.date')}</span>
                <span className="detail-value">{date}</span>
              </div>
              
              <div className="session-detail-item">
                <Clock className="detail-icon" size={16} />
                <span className="detail-label">{t('availability.bookedModal.labels.time')}</span>
                <span className="detail-value">{time}</span>
              </div>
              
              {sessionData.location && (
                <div className="session-detail-item">
                  <MapPin className="detail-icon" size={16} />
                  <span className="detail-label">{t('availability.bookedModal.labels.location')}</span>
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
              {t('availability.bookedModal.ok')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
