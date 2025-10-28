'use client';

import { useState, useEffect } from 'react';
import { GoogleDriveService } from '@/app/services/integrations/GoogleDriveService';

/**
 * Componente para manejar la conexión de Google Drive
 * Muestra el estado de conexión y permite iniciar OAuth
 */
export default function GoogleDriveConnectionStatus({ className = '' }) {
  const [status, setStatus] = useState({
    loading: true,
    connected: false,
    email: null,
    error: null
  });

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true, error: null }));
      const result = await GoogleDriveService.checkConnection();
      setStatus({
        loading: false,
        connected: result.connected,
        email: result.email,
        error: null
      });
    } catch (error) {
      console.error('Error verificando conexión:', error);
      setStatus({
        loading: false,
        connected: false,
        email: null,
        error: error.message
      });
    }
  };

  const handleConnect = async () => {
    try {
      setStatus(prev => ({ ...prev, error: null }));
      await GoogleDriveService.initiateOAuth();
      
      // El popup se abre, esperamos a que el usuario complete OAuth
      // Después de que cierre el popup, verificamos el estado nuevamente
      setTimeout(checkConnectionStatus, 2000);
    } catch (error) {
      console.error('Error iniciando OAuth:', error);
      setStatus(prev => ({ ...prev, error: error.message }));
    }
  };

  if (status.loading) {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-500 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
        <span>Verificando conexión...</span>
      </div>
    );
  }

  if (status.connected) {
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        <div className="flex items-center gap-2 text-green-600">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">Drive conectado</span>
        </div>
        {status.email && (
          <span className="text-gray-600">({status.email})</span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span className="text-sm font-medium text-gray-700">
          Drive no conectado
        </span>
      </div>
      
      <button
        onClick={handleConnect}
        className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"/>
        </svg>
        Conectar Google Drive
      </button>

      {status.error && (
        <p className="text-xs text-red-600">
          Error: {status.error}
        </p>
      )}
      
      <p className="text-xs text-gray-500">
        Necesario para guardar comprobantes de pago
      </p>
    </div>
  );
}
