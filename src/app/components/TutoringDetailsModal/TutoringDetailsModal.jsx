"use client";

import React from "react";
import "./TutoringDetailsModal.css";

export default function TutoringDetailsModal({ isOpen, onClose, session, userType }) {
  if (!isOpen || !session) return null;

  const formatDateTime = (dateTime) => {
    if (!dateTime) return '';
    
    const date = new Date(dateTime);
    const formattedDate = date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const formattedTime = date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const endTime = new Date(date.getTime() + 60 * 60 * 1000);
    const endTimeFormatted = endTime.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return {
      date: formattedDate,
      time: `${formattedTime} - ${endTimeFormatted}`
    };
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      scheduled: { text: 'Programada', bg: 'bg-blue-100', color: 'text-blue-800' },
      completed: { text: 'Completada', bg: 'bg-green-100', color: 'text-green-800' },
      cancelled: { text: 'Cancelada', bg: 'bg-red-100', color: 'text-red-800' },
      pending: { text: 'Pendiente', bg: 'bg-yellow-100', color: 'text-yellow-800' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color} status-badge`}>
        {config.text}
      </span>
    );
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    const paymentConfig = {
      paid: { text: 'Pagado', bg: 'bg-green-100', color: 'text-green-800' },
      pending: { text: 'Pendiente', bg: 'bg-yellow-100', color: 'text-yellow-800' },
      refunded: { text: 'Reembolsado', bg: 'bg-gray-100', color: 'text-gray-800' }
    };
    
    const config = paymentConfig[paymentStatus] || paymentConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const dateTime = formatDateTime(session.scheduledDateTime);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-overlay">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto modal-content">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Detalles de la Tutoría</h2>
              <p className="text-sm text-gray-600">{session.subject}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors close-button"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Status and Payment */}
          <div className="flex gap-3 mb-6">
            {getStatusBadge(session.status)}
            {getPaymentStatusBadge(session.paymentStatus)}
          </div>

          {/* Main Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 info-grid">
            {/* Date and Time */}
            <div className="bg-blue-50 p-4 rounded-lg info-card">
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                📅 Fecha y Hora
              </h3>
              <p className="text-gray-700 font-medium">{dateTime.date}</p>
              <p className="text-blue-600 font-semibold">{dateTime.time}</p>
            </div>

            {/* Participants */}
            <div className="bg-green-50 p-4 rounded-lg info-card">
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                👥 Participantes
              </h3>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Tutor:</span> {session.tutorEmail}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Estudiante:</span> {session.studentEmail}
                </p>
              </div>
            </div>
          </div>

          {/* Location and Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {session.location && (
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                  📍 Ubicación
                </h3>
                <p className="text-gray-700">{session.location}</p>
              </div>
            )}

            {session.price && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                  💰 Precio
                </h3>
                <p className="text-2xl font-bold text-green-600">
                  ${session.price.toLocaleString()} COP
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          {session.notes && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                📝 Notas
              </h3>
              <p className="text-gray-700">{session.notes}</p>
            </div>
          )}

          {/* Session Details */}
          <div className="bg-indigo-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              ℹ️ Información de la Sesión
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">ID de Sesión:</span>
                <p className="text-gray-700 font-mono text-xs">{session.id}</p>
              </div>
              {session.slotId && (
                <div>
                  <span className="font-medium text-gray-600">ID de Slot:</span>
                  <p className="text-gray-700 font-mono text-xs">{session.slotId}</p>
                </div>
              )}
              {session.createdAt && (
                <div>
                  <span className="font-medium text-gray-600">Creada:</span>
                  <p className="text-gray-700">
                    {new Date(session.createdAt).toLocaleDateString('es-ES')}
                  </p>
                </div>
              )}
              {session.updatedAt && (
                <div>
                  <span className="font-medium text-gray-600">Actualizada:</span>
                  <p className="text-gray-700">
                    {new Date(session.updatedAt).toLocaleDateString('es-ES')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Rating */}
          {session.rating && (
            <div className="bg-orange-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                ⭐ Calificación
              </h3>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-bold text-orange-500">{session.rating.score}/5</span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <span 
                      key={i} 
                      className={`text-lg ${i < session.rating.score ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              {session.rating.comment && (
                <p className="text-gray-700 italic">"{session.rating.comment}"</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-200">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cerrar
            </button>
            {userType === 'tutor' && session.status === 'scheduled' && (
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Gestionar Sesión
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 