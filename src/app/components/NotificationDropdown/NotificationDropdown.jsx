"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Bell, 
  X, 
  Check, 
  Clock, 
  User, 
  Calendar,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { NotificationService } from "../../services/NotificationService";
import { TutoringSessionService } from "../../services/TutoringSessionService";
import { useAuth } from "../../context/SecureAuthContext";
import TutorApprovalModal from "../TutorApprovalModal/TutorApprovalModal";
import "./NotificationDropdown.css";
import { useRouter } from "next/navigation";
import routes from "../../../routes";

export default function NotificationDropdown({ userType = 'tutor' }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedPendingSession, setSelectedPendingSession] = useState(null);
  const dropdownRef = useRef(null);
  const router = useRouter();

  // Determine if user is tutor or student
  const isTutor = userType === 'tutor' || (user.isLoggedIn && user.isTutor);

  useEffect(() => {
    if (user.isLoggedIn && user.email) {
      loadNotifications();
    }
  }, [user.isLoggedIn, user.email, isTutor]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      // Load notifications based on user type
      const notificationList = isTutor 
        ? await NotificationService.getTutorNotifications(user.email)
        : await NotificationService.getStudentNotifications(user.email);
      
      setNotifications(notificationList);
      
      // Count unread notifications
      const unread = notificationList.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await NotificationService.markNotificationAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      
      for (const notification of unreadNotifications) {
        await NotificationService.markNotificationAsRead(notification.id);
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getPendingSessionData = async (sessionId) => {
    try {
      const pendingSessions = await TutoringSessionService.getPendingSessionsForTutor(user.email);
      const session = pendingSessions.find(s => s.id === sessionId);
      return session;
    } catch (error) {
      console.error('Error getting pending session data:', error);
      return null;
    }
  };

  const handleApprovalComplete = () => {
    // Reload notifications after approval/decline
    loadNotifications();
  };

  const handleCloseApprovalModal = () => {
    setIsApprovalModalOpen(false);
    setSelectedPendingSession(null);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      // Tutor notifications
      case 'pending_session_request':
        return <Clock className="notification-icon pending" />;
      case 'session_reminder':
        return <Calendar className="notification-icon reminder" />;
      case 'message':
      case 'tutor_message':
        return <MessageSquare className="notification-icon message" />;
      
      // Student notifications
      case 'session_accepted':
        return <CheckCircle className="notification-icon accepted" />;
      case 'session_rejected':
      case 'session_cancelled':
        return <XCircle className="notification-icon rejected" />;
      case 'payment_reminder':
        return <Clock className="notification-icon pending" />;
      
      // Common notifications
      default:
        return <Bell className="notification-icon default" />;
    }
  };

  const getNotificationTypeLabel = (type) => {
    switch (type) {
      // Tutor notifications
      case 'pending_session_request':
        return 'Solicitud de Tutoría';
      case 'session_reminder':
        return 'Recordatorio de Sesión';
      case 'message':
      case 'tutor_message':
        return 'Mensaje';
      
      // Student notifications
      case 'session_accepted':
        return 'Sesión Aprobada';
      case 'session_rejected':
        return 'Sesión Rechazada';
      case 'session_cancelled':
        return 'Sesión Cancelada';
      case 'payment_reminder':
        return 'Recordatorio de Pago';
      
      // Common notifications
      default:
        return 'Notificación';
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now - notificationDate) / 1000);

    if (diffInSeconds < 60) {
      return 'Hace un momento';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `Hace ${days} día${days > 1 ? 's' : ''}`;
    } else {
      return notificationDate.toLocaleDateString('es-ES');
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read when clicked
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Handle notification-specific actions based on user type
    if (isTutor) {
      // Tutor actions
      switch (notification.type) {
        case 'pending_session_request':
          // Get session data and open approval modal
          const sessionData = await getPendingSessionData(notification.sessionId);
          if (sessionData) {
            setSelectedPendingSession(sessionData);
            setIsApprovalModalOpen(true);
            setIsOpen(false); // Close notification dropdown
          }
          break;
        case 'session_reminder':
          // Navigate to upcoming sessions
          console.log('Navigate to upcoming session:', notification.sessionId);
          break;
        case 'message':
        case 'tutor_message':
          // Navigate to messages or chat
          console.log('Navigate to messages');
          break;
      }
    } else {
      // Student actions
      switch (notification.type) {
        case 'session_accepted':
          // Navigate to confirmed sessions
          console.log('Navigate to confirmed session:', notification.sessionId);
          break;
        case 'session_rejected':
          // Navigate to available slots or show alternative options
          console.log('Session rejected, show alternatives');
          break;
        case 'session_cancelled':
          // Navigate to available slots
          console.log('Session cancelled, show available slots');
          break;
        case 'payment_reminder':
          // Navigate to payment page
          console.log('Navigate to payment page');
          break;
        case 'tutor_message':
          // Navigate to messages or chat
          console.log('Navigate to tutor messages');
          break;
      }
    }
  };

  return (
    <div className="notification-dropdown-container" ref={dropdownRef}>
      {/* Notification Button */}
      <button 
        className="notification-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="notification-dropdown">
          {/* Header */}
          <div className="notification-header">
            <h3 className="notification-title">
              <Bell size={18} />
              Notificaciones
            </h3>
            <div className="notification-actions">
              {unreadCount > 0 && (
                <button 
                  className="mark-all-read-btn"
                  onClick={markAllAsRead}
                  title="Marcar todas como leídas"
                >
                  <Check size={16} />
                </button>
              )}
              <button 
                className="close-dropdown-btn"
                onClick={() => setIsOpen(false)}
                title="Cerrar"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="notification-loading">
              <div className="loading-spinner"></div>
              <p>Cargando notificaciones...</p>
            </div>
          )}

          {/* Notifications List */}
          {!loading && (
            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="notification-empty">
                  <Bell size={32} />
                  <p>No tienes notificaciones</p>
                  <span>Todas tus notificaciones aparecerán aquí</span>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-icon-container">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="notification-content">
                      <div className="notification-header-item">
                        <span className="notification-type">
                          {getNotificationTypeLabel(notification.type)}
                        </span>
                        <span className="notification-time">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                      </div>
                      
                      <p className="notification-message">
                        {notification.message}
                      </p>
                      
                      {(notification.studentName || notification.tutorName) && (
                        <div className="notification-student">
                          <User size={14} />
                          <span>{isTutor ? notification.studentName : notification.tutorName}</span>
                        </div>
                      )}
                    </div>
                    
                    {!notification.isRead && (
                      <div className="notification-unread-indicator"></div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="notification-footer">
              <button 
                className="view-all-btn" 
                onClick={() => {
                  // Navigate based on user type
                  if (isTutor) {
                    router.push(routes.TUTOR_DISPONIBILIDAD);
                  } else {
                    router.push(routes.AVAILABILITY);
                  }
                  setIsOpen(false); // Close dropdown after navigation
                }}
              >
                Ver todas las notificaciones
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tutor Approval Modal */}
      {isApprovalModalOpen && selectedPendingSession && (
        <TutorApprovalModal
          session={selectedPendingSession}
          isOpen={isApprovalModalOpen}
          onClose={handleCloseApprovalModal}
          onApprovalComplete={handleApprovalComplete}
        />
      )}
    </div>
  );
}
