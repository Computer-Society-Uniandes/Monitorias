"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { TutoringSessionService } from "../../services/TutoringSessionService";
import { useAuth } from "../../context/SecureAuthContext";
import TutoringDetailsModal from "../TutoringDetailsModal/TutoringDetailsModal";
import routes from "../../../routes";
import "./TutoringSummary.css";

export default function TutoringSummary({ userType, title, linkText, linkHref }) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user.email) return;

      try {
        setLoading(true);
        setError(null);

        let fetchedSessions = [];
        if (userType === 'tutor') {
          fetchedSessions = await TutoringSessionService.getTutorSessions(user.email);
        } else {
          fetchedSessions = await TutoringSessionService.getStudentSessions(user.email);
        }

        // Filtrar solo sesiones programadas y futuras
        const now = new Date();
        const upcomingSessions = fetchedSessions
          .filter(session => 
            session.status === 'scheduled' && 
            session.scheduledDateTime && 
            new Date(session.scheduledDateTime) > now
          )
          .sort((a, b) => new Date(a.scheduledDateTime) - new Date(b.scheduledDateTime))
          .slice(0, 3); // Mostrar solo las próximas 3

        setSessions(upcomingSessions);
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setError('Error cargando las tutorías');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [user.email, userType]);

  const formatDateTime = (dateTime) => {
    if (!dateTime) return '';
    
    const date = new Date(dateTime);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sessionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    let dayText = '';
    if (sessionDate.getTime() === today.getTime()) {
      dayText = 'Hoy';
    } else if (sessionDate.getTime() === today.getTime() + 86400000) {
      dayText = 'Mañana';
    } else {
      dayText = date.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'short' 
      });
    }
    
    const timeText = date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const endTime = new Date(date.getTime() + 60 * 60 * 1000); // Agregar 1 hora
    const endTimeText = endTime.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return `${dayText} ${timeText} - ${endTimeText}`;
  };

  const getSessionColor = (index) => {
    const colors = [
      { border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-600' },
      { border: 'border-green-500', bg: 'bg-green-50', text: 'text-green-600' },
      { border: 'border-purple-500', bg: 'bg-purple-50', text: 'text-purple-600' }
    ];
    return colors[index % colors.length];
  };

  const handleShowDetails = (session) => {
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSession(null);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8 tutoring-card">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 rounded-lg session-loading"></div>
          <div className="h-20 bg-gray-200 rounded-lg session-loading"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-8 tutoring-card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        {linkHref && linkText && (
          <Link 
            href={linkHref}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            {linkText} →
          </Link>
        )}
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No tienes tutorías programadas
          </h3>
          <p className="text-gray-600">
            {userType === 'tutor' 
              ? 'Las tutorías que tengas agendadas aparecerán aquí'
              : 'Cuando reserves una tutoría, la verás aquí'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session, index) => {
            const colors = getSessionColor(index);
            return (
              <div 
                key={session.id}
                className={`border-l-4 ${colors.border} pl-4 py-3 ${colors.bg} rounded-r-lg session-item relative`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 session-content">
                    <p className="font-semibold text-gray-700">{session.subject}</p>
                    <p className="text-sm text-gray-600">
                      {formatDateTime(session.scheduledDateTime)}
                    </p>
                    <p className={`text-sm ${colors.text}`}>
                      {userType === 'tutor' 
                        ? `Estudiante: ${session.studentEmail}`
                        : `Tutor: ${session.tutorEmail}`
                      }
                    </p>
                    {session.location && (
                      <p className="text-sm text-gray-500">
                        📍 {session.location}
                      </p>
                    )}
                    {session.price && (
                      <p className="text-sm text-gray-500">
                        💰 ${session.price.toLocaleString()}
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleShowDetails(session)}
                    className="ml-3 px-3 py-1 text-xs bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium text-gray-700 details-button"
                  >
                    Ver detalles
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de detalles renderizado con Portal */}
      {typeof window !== 'undefined' && isModalOpen && createPortal(
        <TutoringDetailsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          session={selectedSession}
          userType={userType}
        />,
        document.body
      )}
    </div>
  );
} 