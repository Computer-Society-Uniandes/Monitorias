"use client";

import React, { useState } from "react";
import { X, Calendar, Clock, MapPin, User, BookOpen, MessageSquare } from "lucide-react";
import { TutoringSessionService } from "../../services/TutoringSessionService";
import "./TutorApprovalModal.css";

export default function TutorApprovalModal({ 
  session, 
  isOpen, 
  onClose, 
  onApprovalComplete 
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !session) return null;

  const formatDateTime = (dateTime) => {
    if (!dateTime) return '';
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

  const handleAccept = async () => {
    try {
      setLoading(true);
      setError(null);

      await TutoringSessionService.acceptTutoringSession(session.id, session.tutorEmail);
      
      if (onApprovalComplete) {
        onApprovalComplete();
      }
      
      onClose();
    } catch (error) {
      console.error('Error accepting session:', error);
      setError(error.message || 'Error accepting session');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    try {
      setLoading(true);
      setError(null);

      await TutoringSessionService.declineTutoringSession(session.id, session.tutorEmail);
      
      if (onApprovalComplete) {
        onApprovalComplete();
      }
      
      onClose();
    } catch (error) {
      console.error('Error declining session:', error);
      setError(error.message || 'Error declining session');
    } finally {
      setLoading(false);
    }
  };

  const { date, time } = formatDateTime(session.scheduledDateTime);

  return (
    <div className="tutor-approval-modal-overlay">
      <div className="tutor-approval-modal">
        <div className="modal-header">
          <h2>Session Request</h2>
          <button 
            className="close-btn" 
            onClick={onClose}
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="session-info">
            <div className="info-section">
              <div className="info-item">
                <User className="info-icon" size={16} />
                <div className="info-content">
                  <span className="info-label">Student</span>
                  <span className="info-value">{session.studentName || session.studentEmail}</span>
                </div>
              </div>

              <div className="info-item">
                <BookOpen className="info-icon" size={16} />
                <div className="info-content">
                  <span className="info-label">Subject</span>
                  <span className="info-value">{session.subject}</span>
                </div>
              </div>

              <div className="info-item">
                <Calendar className="info-icon" size={16} />
                <div className="info-content">
                  <span className="info-label">Date</span>
                  <span className="info-value">{date}</span>
                </div>
              </div>

              <div className="info-item">
                <Clock className="info-icon" size={16} />
                <div className="info-content">
                  <span className="info-label">Time</span>
                  <span className="info-value">{time}</span>
                </div>
              </div>

              {session.location && (
                <div className="info-item">
                  <MapPin className="info-icon" size={16} />
                  <div className="info-content">
                    <span className="info-label">Location</span>
                    <span className="info-value">{session.location}</span>
                  </div>
                </div>
              )}

              {session.notes && (
                <div className="info-item notes-item">
                  <MessageSquare className="info-icon" size={16} />
                  <div className="info-content">
                    <span className="info-label">Notes</span>
                    <span className="info-value notes-text">{session.notes}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="modal-actions">
            <button 
              className="decline-btn"
              onClick={handleDecline}
              disabled={loading}
            >
              {loading ? 'Declining...' : 'Decline'}
            </button>
            <button 
              className="accept-btn"
              onClick={handleAccept}
              disabled={loading}
            >
              {loading ? 'Accepting...' : 'Accept'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
