"use client";

import React, { useState } from "react";
import { PaymentService } from "../../services/PaymentService";
import { useI18n } from "app/lib/i18n";

export default function SessionConfirmationModal({ 
  isOpen, 
  onClose, 
  session, 
  onConfirm, 
  confirmLoading = false 
}) {
  const { t, locale } = useI18n();
  const [studentEmail, setStudentEmail] = useState(session?.studentEmail || '');
  const [proofFile, setProofFile] = useState(null);
  const [proofFileName, setProofFileName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !session) return null;

  const localeStr = locale === 'en' ? 'en-US' : 'es-ES';
  const formattedDate = new Date(session.scheduledDateTime).toLocaleDateString(localeStr, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  const timeRange = `${new Date(session.scheduledDateTime).toLocaleTimeString(localeStr, { hour: '2-digit', minute: '2-digit' })} - ${new Date(session.endDateTime).toLocaleTimeString(localeStr, { hour: '2-digit', minute: '2-digit' })}`;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setError(t('availability.confirmationModal.errors.invalidType'));
        return;
      }
      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(t('availability.confirmationModal.errors.tooLarge'));
        return;
      }
      setProofFile(file);
      setProofFileName(file.name);
      setError('');
    }
  };

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const canConfirm = () => {
    return proofFile && isValidEmail(studentEmail) && !confirmLoading;
  };

  const handleConfirm = () => {
    if (!canConfirm()) {
      if (!proofFile) setError(t('availability.confirmationModal.errors.missingProof'));
      else if (!isValidEmail(studentEmail)) setError(t('availability.confirmationModal.errors.invalidEmail'));
      return;
    }
    
    // Pasar el archivo y email al componente padre
    onConfirm({ studentEmail, proofFile });
  };

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
          <button onClick={onClose} className="mr-3 text-gray-600 hover:text-gray-900" disabled={confirmLoading}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-gray-900">{t('availability.confirmationModal.title')}</h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Course */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('availability.confirmationModal.subject')}</h3>
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
            <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('availability.confirmationModal.tutor')}</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-lg">👨‍🏫</span>
              </div>
              <p className="font-medium text-gray-900">{session.tutorName || session.tutorEmail}</p>
            </div>
          </div>

          {/* Session Details */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('availability.confirmationModal.sessionDetails')}</h3>
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

          {/* Email for Google Meet */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('availability.confirmationModal.emailForMeet')}</h3>
            <p className="text-xs text-gray-500 mb-2">{t('availability.confirmationModal.emailHint')}</p>
            <input
              type="email"
              value={studentEmail}
              readOnly
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-900 cursor-not-allowed"
            />
          </div>

          {/* Payment Information */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {t('availability.confirmationModal.paymentInformation')}
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-blue-800">
                <strong>💳 Nequi/Daviplata:</strong> 310 7551592
              </p>
              <p className="text-xs text-blue-700">
                {t('availability.confirmationModal.paymentInstructions')}
              </p>
            </div>
          </div>

          {/* Payment Proof Upload */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('availability.confirmationModal.paymentProof')}</h3>
            <p className="text-xs text-gray-500 mb-2">{t('availability.confirmationModal.paymentProofHint')}</p>
            <label className="block">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
                disabled={confirmLoading}
              />
              <div className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-500 cursor-pointer hover:border-[#FF8C00] transition-colors flex items-center justify-between">
                <span className="text-sm">
                  {proofFileName || t('availability.confirmationModal.selectFile')}
                </span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
            </label>
            {proofFile && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('availability.confirmationModal.fileSelected', { name: proofFile.name })}
              </p>
            )}
          </div>

          {/* Cost */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('availability.confirmationModal.cost')}</h3>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">${session.price ? session.price.toLocaleString() : '25,000'} COP</span>
              <span className="text-sm text-gray-500">{t('availability.confirmationModal.total')}</span>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 pb-6 space-y-3">
          <button
            onClick={handleConfirm}
            disabled={!canConfirm()}
            className="w-full py-3 bg-[#FF8C00] text-white font-semibold rounded-lg hover:bg-[#e07d00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {confirmLoading ? t('availability.confirmationModal.confirming') : t('availability.confirmationModal.confirmAndSend')}
          </button>
          <button
            onClick={onClose}
            disabled={confirmLoading}
            className="w-full py-3 bg-white text-gray-700 font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {t('availability.confirmationModal.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
