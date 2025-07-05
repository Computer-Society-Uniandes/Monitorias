'use client';

import { useState, useEffect } from 'react';

export default function GoogleCalendarButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);

  // Verificar el estado de conexión al montar el componente
  useEffect(() => {
    checkConnectionStatus();
    
    // Agregar listener para cuando el usuario regresa a la ventana
    const handleFocus = () => {
      console.log('🔍 Window focus event - rechecking connection...');
      checkConnectionStatus();
    };
    
    // Agregar listener para eventos personalizados de actualización
    const handleCalendarUpdate = () => {
      console.log('🔄 Calendar status update event received - rechecking connection...');
      checkConnectionStatus();
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('calendar-status-update', handleCalendarUpdate);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('calendar-status-update', handleCalendarUpdate);
    };
  }, []);

  const checkConnectionStatus = async () => {
    try {
      setCheckingConnection(true);
      console.log('🔍 Checking Google Calendar connection status...');
      const response = await fetch('/api/calendar/check-connection');
      const data = await response.json();
      console.log('Connection status response:', data);
      setIsConnected(data.connected || false);
      console.log('Connection status updated:', data.connected || false);
    } catch (error) {
      console.error('Error checking connection status:', error);
      setIsConnected(false);
    } finally {
      setCheckingConnection(false);
    }
  };

  const handleConnectCalendar = () => {
    setIsLoading(true);
    window.location.href = '/api/calendar/auth';
  };

  const handleDisconnectCalendar = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/calendar/disconnect', {
        method: 'POST',
      });
      
      if (response.ok) {
        setIsConnected(false);
        // Disparar evento personalizado para actualizar otros botones
        window.dispatchEvent(new CustomEvent('calendar-status-update', { 
          detail: { connected: false } 
        }));
        // Opcional: mostrar mensaje de éxito
        alert('Desconectado de Google Calendar exitosamente');
      } else {
        throw new Error('Error al desconectar');
      }
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      alert('Error al desconectar de Google Calendar');
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingConnection) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
      >
        <svg
          className="w-5 h-5 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <span>Verificando...</span>
      </button>
    );
  }

  return (
    <button
      onClick={isConnected ? handleDisconnectCalendar : handleConnectCalendar}
      disabled={isLoading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        isConnected
          ? 'bg-red-600 text-white hover:bg-red-700'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
    >
      {isLoading ? (
        <>
          <svg
            className="w-5 h-5 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>{isConnected ? 'Desconectando...' : 'Conectando...'}</span>
        </>
      ) : (
        <>
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            {isConnected ? (
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            ) : (
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
            )}
          </svg>
          <span>
            {isConnected ? 'Desconectar Google Calendar' : 'Conectar con Google Calendar'}
          </span>
        </>
      )}
    </button>
  );
} 