'use client';

import { useState, useEffect } from 'react';
import './GoogleCalendarButton.css';

export default function GoogleCalendarButton() {
  const [connectionStatus, setConnectionStatus] = useState('checking'); // 'checking', 'connected', 'disconnected', 'expired'
  const [isLoading, setIsLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  const checkConnectionStatus = async () => {
    try {
      setConnectionStatus('checking');
      const response = await fetch('/api/calendar/check-connection');
      const data = await response.json();
      
      if (data.connected) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('disconnected');
      }
      
      setLastChecked(new Date());
    } catch (error) {
      console.error('Error checking Google Calendar connection:', error);
      setConnectionStatus('disconnected');
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      // Redirigir a la autorización de Google Calendar
      window.location.href = '/api/calendar/auth';
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      
      // Limpiar cookies del lado del cliente si es posible
      document.cookie = 'calendar_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'calendar_refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      setConnectionStatus('disconnected');
      
      // Notificar a otros componentes que el estado cambió
      window.dispatchEvent(new CustomEvent('calendar-status-update'));
      
      console.log('Google Calendar desconectado');
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Intentar renovar token cuando sea necesario
  const tryRefreshToken = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/calendar/refresh-token', {
        method: 'POST'
      });

      if (response.ok) {
        setConnectionStatus('connected');
        alert('✅ Conexión renovada exitosamente');
        
        // Notificar a otros componentes
        window.dispatchEvent(new CustomEvent('calendar-status-update'));
      } else {
        const data = await response.json();
        if (data.needsReconnection) {
          setConnectionStatus('expired');
          
          const shouldReconnect = window.confirm(
            '🔑 Tu sesión de Google Calendar ha expirado.\n\n¿Quieres reconectar ahora?'
          );
          
          if (shouldReconnect) {
            handleConnect();
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      setConnectionStatus('expired');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkConnectionStatus();
    
    // Verificar cuando la ventana recibe foco (útil después de OAuth)
    const handleFocus = () => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('calendar_connected') === 'true') {
        checkConnectionStatus();
        // Limpiar el parámetro de la URL
        urlParams.delete('calendar_connected');
        const newUrl = window.location.pathname + 
          (urlParams.toString() ? '?' + urlParams.toString() : '');
        window.history.replaceState({}, '', newUrl);
      }
    };

    const handleStorageChange = () => {
      checkConnectionStatus();
    };

    // Escuchar eventos personalizados de cambio de estado
    const handleCalendarUpdate = () => {
      checkConnectionStatus();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('calendar-status-update', handleCalendarUpdate);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('calendar-status-update', handleCalendarUpdate);
    };
  }, []);

  const getButtonText = () => {
    if (isLoading) return '🔄 Cargando...';
    
    switch (connectionStatus) {
      case 'checking':
        return '🔄 Verificando...';
      case 'connected':
        return '✅ Conectado';
      case 'expired':
        return '🔑 Sesión Expirada';
      case 'disconnected':
      default:
        return '📅 Conectar Google Calendar';
    }
  };

  const getButtonClass = () => {
    const base = 'google-calendar-btn';
    switch (connectionStatus) {
      case 'connected':
        return `${base} connected`;
      case 'expired':
        return `${base} expired`;
      case 'disconnected':
      default:
        return `${base} disconnected`;
    }
  };

  const handleButtonClick = () => {
    if (isLoading) return;
    
    switch (connectionStatus) {
      case 'connected':
        handleDisconnect();
        break;
      case 'expired':
        tryRefreshToken();
        break;
      case 'disconnected':
      default:
        handleConnect();
        break;
    }
  };

  return (
    <div className="google-calendar-container">
      <button
        className={getButtonClass()}
        onClick={handleButtonClick}
        disabled={isLoading}
        title={
          connectionStatus === 'connected' 
            ? `Conectado a Google Calendar (verificado: ${lastChecked?.toLocaleTimeString()})`
            : connectionStatus === 'expired'
            ? 'Sesión expirada - Haz click para renovar'
            : 'Conectar con Google Calendar'
        }
      >
        {getButtonText()}
      </button>
      
      {connectionStatus === 'expired' && (
        <div className="token-expired-notice">
          <small>⚠️ Tu sesión ha expirado. Haz click para renovar la conexión.</small>
        </div>
      )}
    </div>
  );
} 