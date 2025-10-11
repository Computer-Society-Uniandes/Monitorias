"use client";

import React from "react";
import "./TutoringDetailsModal.css";

export default function TutoringDetailsModal({ isOpen, onClose, session }) {
  if (!isOpen || !session) return null;

  const getPaymentStatusBadge = (paymentStatus) => {
    // Only show payment badge for meaningful states after booking
    const paymentConfig = {
      en_verificación: { text: 'En verificación', className: 'AccentBackground PrimaryText' },
      verificado: { text: 'Verificado', className: 'bg-green-100 text-green-800' },
      rechazado: { text: 'Rechazado', className: 'bg-red-100 text-red-800' }
    };

    if (!paymentStatus || !paymentConfig[paymentStatus]) return null;
    const config = paymentConfig[paymentStatus];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.text}
      </span>
    );
  };
  const formattedDate = new Date(session.scheduledDateTime).toLocaleDateString('es-ES', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  const timeRange = `${new Date(session.scheduledDateTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - ${new Date(session.endDateTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ 
        backgroundColor: 'rgba(17, 24, 39, 0.4)', 
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)' 
      }}
    >
      <div className="bg-[#FEF9F6] rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-white px-6 py-4 flex items-center border-b border-gray-100">
          <button onClick={onClose} className="mr-3 text-gray-600 hover:text-gray-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-gray-900">Detalles de la Sesión</h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Payment Status Badge */}
          {session.paymentStatus && (
            <div className="flex gap-2">
              {getPaymentStatusBadge(session.paymentStatus)}
            </div>
          )}

          {/* Course */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Materia</h3>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{session.subject}</p>
                {session.subjectCode && <p className="text-sm text-gray-500">{session.subjectCode}</p>}
              </div>
            </div>
          </div>

          {/* Tutor */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Tutor</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-lg">👨‍🏫</span>
              </div>
              <p className="font-medium text-gray-900">{session.tutorName || session.tutorEmail}</p>
            </div>
          </div>

          {/* Student */}
          {session.studentName && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Estudiante</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-lg">👨‍🎓</span>
                </div>
                <p className="font-medium text-gray-900">{session.studentName}</p>
              </div>
            </div>
          )}

          {/* Session Details */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Detalles de la Sesión</h3>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{timeRange}</p>
                <p className="text-sm text-[#FF8C00]">{formattedDate}</p>
              </div>
            </div>
          </div>

          {/* Location */}
          {session.location && session.location !== 'Por definir' && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Ubicación</h3>
              <p className="text-sm text-gray-700">{session.location}</p>
            </div>
          )}

          {/* Cost */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Costo</h3>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">${session.price ? session.price.toLocaleString() : '25,000'} COP</span>
              <span className="text-sm text-gray-500">Total</span>
            </div>
          </div>

          {/* Notes */}
          {session.notes && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Notas</h3>
              <p className="text-sm text-gray-700">{session.notes}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3 bg-white text-gray-700 font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
} 