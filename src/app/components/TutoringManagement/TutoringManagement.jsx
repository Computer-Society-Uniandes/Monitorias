"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/SecureAuthContext";
import { TutoringSessionService } from "../../services/TutoringSessionService";
import TutoringDetailsModal from "../TutoringDetailsModal/TutoringDetailsModal";
import GoogleCalendarButton from "../GoogleCalendarButton/GoogleCalendarButton";
import "./TutoringManagement.css";

export default function TutoringManagement() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("todas");
  const [selectedSession, setSelectedSession] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    thisMonth: 0,
    averageRating: 0
  });

  useEffect(() => {
    fetchSessions();
  }, [user.email]);

  useEffect(() => {
    applyFilters();
    calculateStats();
  }, [sessions, filterStatus]);

  const fetchSessions = async () => {
    if (!user.email) return;

    try {
      setLoading(true);
      setError(null);

      const fetchedSessions = await TutoringSessionService.getTutorSessions(user.email);
      
      // Ordenar por fecha (más recientes primero)
      const sortedSessions = fetchedSessions.sort((a, b) => 
        new Date(b.scheduledDateTime) - new Date(a.scheduledDateTime)
      );

      setSessions(sortedSessions);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Error cargando las tutorías');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (filterStatus === "todas") {
      setFilteredSessions(sessions);
    } else {
      const filtered = sessions.filter(session => session.status === filterStatus);
      setFilteredSessions(filtered);
    }
  };

  const calculateStats = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonthSessions = sessions.filter(session => {
      const sessionDate = new Date(session.scheduledDateTime);
      return sessionDate.getMonth() === currentMonth && 
             sessionDate.getFullYear() === currentYear;
    });

    const completedSessions = sessions.filter(s => s.status === 'completed');
    const ratedSessions = completedSessions.filter(s => s.rating && s.rating.score);
    const averageRating = ratedSessions.length > 0 
      ? ratedSessions.reduce((sum, s) => sum + s.rating.score, 0) / ratedSessions.length 
      : 0;

    setStats({
      total: sessions.length,
      scheduled: sessions.filter(s => s.status === 'scheduled').length,
      completed: completedSessions.length,
      cancelled: sessions.filter(s => s.status === 'cancelled').length,
      thisMonth: thisMonthSessions.length,
      averageRating: Math.round(averageRating * 10) / 10
    });
  };

  const handleShowDetails = (session) => {
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSession(null);
  };

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
    } else if (sessionDate.getTime() === today.getTime() - 86400000) {
      dayText = 'Ayer';
    } else {
      dayText = date.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short' 
      });
    }
    
    const timeText = date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const endTime = new Date(date.getTime() + 60 * 60 * 1000);
    const endTimeText = endTime.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return {
      day: dayText,
      time: `${timeText} - ${endTimeText}`,
      fullDate: date.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      })
    };
  };

  const getStatusConfig = (status) => {
    const configs = {
      scheduled: { 
        text: 'Programada', 
        bg: 'bg-blue-100', 
        color: 'text-blue-800',
        icon: '📅'
      },
      completed: { 
        text: 'Completada', 
        bg: 'bg-green-100', 
        color: 'text-green-800',
        icon: '✅'
      },
      cancelled: { 
        text: 'Cancelada', 
        bg: 'bg-red-100', 
        color: 'text-red-800',
        icon: '❌'
      },
      pending: { 
        text: 'Pendiente', 
        bg: 'bg-yellow-100', 
        color: 'text-yellow-800',
        icon: '⏳'
      }
    };
    
    return configs[status] || configs.pending;
  };

  const getFilterCount = (status) => {
    if (status === "todas") return sessions.length;
    return sessions.filter(session => session.status === status).length;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Mis Tutorías 📚
          </h1>
          <p className="text-gray-600">
            Gestiona y supervisa todas tus sesiones de tutoría
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 mt-4 md:mt-0">
          <GoogleCalendarButton />
                     <button 
             onClick={fetchSessions}
             className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors refresh-button"
           >
             🔄 Actualizar
           </button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm text-center tutoring-stat-card">
          <p className="text-2xl font-bold text-blue-600">{stats.thisMonth}</p>
          <p className="text-sm text-gray-600">Este mes</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center tutoring-stat-card">
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          <p className="text-sm text-gray-600">Completadas</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center tutoring-stat-card">
          <p className="text-2xl font-bold text-yellow-600">{stats.scheduled}</p>
          <p className="text-sm text-gray-600">Programadas</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center tutoring-stat-card">
          <p className="text-2xl font-bold text-purple-600">{stats.averageRating || 'N/A'}</p>
          <p className="text-sm text-gray-600">Calificación ⭐</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <span className="text-gray-700 font-medium">Filtrar por estado:</span>
          
          {[
            { key: "todas", label: "Todas" },
            { key: "scheduled", label: "Programadas" },
            { key: "completed", label: "Completadas" },
            { key: "cancelled", label: "Canceladas" }
          ].map((filter) => (
                         <button
               key={filter.key}
               onClick={() => setFilterStatus(filter.key)}
               className={`px-4 py-2 rounded-lg font-medium transition-colors relative filter-button ${
                 filterStatus === filter.key
                   ? "bg-blue-600 text-white"
                   : "bg-gray-100 text-gray-700 hover:bg-gray-200"
               }`}
             >
               {filter.label}
               <span className={`ml-2 px-2 py-1 text-xs rounded-full count-badge ${
                 filterStatus === filter.key
                   ? "bg-blue-700 text-white"
                   : "bg-gray-200 text-gray-600"
               }`}>
                 {getFilterCount(filter.key)}
               </span>
             </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchSessions}
            className="mt-2 text-red-600 hover:text-red-800 font-medium"
          >
            Intentar de nuevo
          </button>
        </div>
      )}

      {/* Lista de tutorías */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {filterStatus === "todas" 
              ? "No tienes tutorías registradas" 
              : `No tienes tutorías ${filterStatus === "scheduled" ? "programadas" : filterStatus === "completed" ? "completadas" : "canceladas"}`
            }
          </h3>
          <p className="text-gray-600">
            {filterStatus === "todas" 
              ? "Las tutorías que tengas agendadas aparecerán aquí"
              : "Prueba con otro filtro o actualiza la página"
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => {
            const dateTime = formatDateTime(session.scheduledDateTime);
            const statusConfig = getStatusConfig(session.status);
            
            return (
              <div key={session.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 tutoring-session-card">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div className="flex-1">
                                         <div className="flex items-center gap-3 mb-2 flex-wrap">
                       <h3 className="text-lg font-semibold text-gray-800 session-subject">
                         {session.subject}
                       </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                        {statusConfig.icon} {statusConfig.text}
                      </span>
                      {session.location && (
                        <span className="text-sm text-gray-500">
                          📍 {session.location}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-4 text-gray-600 text-sm">
                      <span className="flex items-center gap-1">
                        👤 {session.studentEmail}
                      </span>
                      <span className="flex items-center gap-1">
                        📅 {dateTime.fullDate}
                      </span>
                      <span className="flex items-center gap-1">
                        ⏰ {dateTime.time}
                      </span>
                                             {session.price && (
                         <span className="flex items-center gap-1 price-highlight">
                           💰 ${session.price.toLocaleString()} COP
                         </span>
                       )}
                    </div>

                    {session.rating && (
                      <div className="mt-2">
                        <span className="text-sm text-orange-600">
                          ⭐ {session.rating.score}/5
                          {session.rating.comment && (
                            <span className="ml-2 text-gray-500">
                              "{session.rating.comment.substring(0, 50)}..."
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-4 md:mt-0">
                    <button 
                      onClick={() => handleShowDetails(session)}
                      className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium border border-blue-200 hover:border-blue-300"
                    >
                      Ver Detalles
                    </button>
                    {session.status === 'scheduled' && (
                      <button className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 hover:border-gray-300">
                        Gestionar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de detalles */}
      <TutoringDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        session={selectedSession}
        userType="tutor"
      />
    </div>
  );
} 