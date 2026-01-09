'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useI18n } from '../../../lib/i18n';
import CalendarService from '../../services/integrations/CalendarService';
import './GoogleCalendarButton.css';

export default function GoogleCalendarButton() {
  const { t } = useI18n();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [connectionStatus, setConnectionStatus] = useState('checking'); // 'checking', 'connected', 'disconnected', 'expired'
  const [isLoading, setIsLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const statusRef = useRef(connectionStatus);
  
  // Keep ref in sync with state
  useEffect(() => {
    statusRef.current = connectionStatus;
  }, [connectionStatus]);

  const checkConnectionStatus = useCallback(async () => {
    try {
      setConnectionStatus('checking');
      const data = await CalendarService.checkConnection();
      
      console.log('Calendar connection check result:', data);
      
      if (data.connected && data.tokenValid) {
        setConnectionStatus('connected');
      } else if (data.hasAccessToken && !data.tokenValid) {
        setConnectionStatus('expired');
      } else {
        setConnectionStatus('disconnected');
      }
      
      setLastChecked(new Date());
    } catch (error) {
      console.error('Error checking Google Calendar connection:', error);
      setConnectionStatus('disconnected');
    }
  }, []);

  // Check for calendar_connected parameter in URL when it changes
  useEffect(() => {
    const calendarConnected = searchParams?.get('calendar_connected');
    if (calendarConnected === 'true') {
      console.log('Detected calendar_connected parameter, checking status...');
      // Wait a bit for backend to process the callback
      setTimeout(() => {
        checkConnectionStatus();
      }, 1500);
      
      // Clean up the URL parameter
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.delete('calendar_connected');
        const newUrl = window.location.pathname + 
          (urlParams.toString() ? '?' + urlParams.toString() : '');
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [searchParams, pathname, checkConnectionStatus]);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      // Use CalendarService to redirect to auth
      CalendarService.initiateAuth();
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      
      // Use CalendarService to disconnect
      await CalendarService.disconnect();
      
      setConnectionStatus('disconnected');
      
      // Notify other components that the state changed
      window.dispatchEvent(new CustomEvent('calendar-status-update'));
      
      console.log('Google Calendar disconnected');
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Try to refresh token when necessary
  const tryRefreshToken = async () => {
    try {
      setIsLoading(true);
      
      const result = await CalendarService.refreshToken();

      if (result.success) {
        setConnectionStatus('connected');
        alert(` ${t('googleCalendar.connectionRenewed')}`);
        
        // Notify other components
        window.dispatchEvent(new CustomEvent('calendar-status-update'));
      } else {
        setConnectionStatus('expired');
        
        const shouldReconnect = window.confirm(
          `🔑 ${t('googleCalendar.sessionExpiredMessage')}\n\n${t('googleCalendar.reconnectNow')}`
        );
        
        if (shouldReconnect) {
          handleConnect();
        }
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      setConnectionStatus('expired');
      
      const shouldReconnect = window.confirm(
        `🔑 ${t('googleCalendar.sessionExpiredMessage')}\n\n${t('googleCalendar.reconnectNow')}`
      );
      
      if (shouldReconnect) {
        handleConnect();
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check connection status on mount
    checkConnectionStatus();
    
    // Check URL params immediately for OAuth callback
    const checkUrlParams = () => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('calendar_connected') === 'true') {
        // Wait a bit for backend to process the callback
        setTimeout(() => {
          checkConnectionStatus();
        }, 1000);
        
        // Clean up the URL parameter
        urlParams.delete('calendar_connected');
        const newUrl = window.location.pathname + 
          (urlParams.toString() ? '?' + urlParams.toString() : '');
        window.history.replaceState({}, '', newUrl);
      }
    };

    // Check immediately
    checkUrlParams();
    
    // Verificar cuando la ventana recibe foco (útil después de OAuth)
    const handleFocus = () => {
      checkUrlParams();
      // Also check connection status after a short delay
      setTimeout(() => {
        checkConnectionStatus();
      }, 500);
    };

    // Verificar cuando la página se hace visible (cuando vuelves de OAuth)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setTimeout(() => {
          checkConnectionStatus();
        }, 500);
      }
    };

    const handleStorageChange = () => {
      checkConnectionStatus();
    };

    // Escuchar eventos personalizados de cambio de estado
    const handleCalendarUpdate = () => {
      // Add a small delay to ensure backend has processed the connection
      setTimeout(() => {
        checkConnectionStatus();
      }, 500);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('calendar-status-update', handleCalendarUpdate);

    // Also check periodically when window is focused (in case of missed events)
    const intervalId = setInterval(() => {
      if (document.hasFocus() && statusRef.current === 'disconnected') {
        checkConnectionStatus();
      }
    }, 5000); // Check every 5 seconds if still disconnected

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('calendar-status-update', handleCalendarUpdate);
      clearInterval(intervalId);
    };
  }, [checkConnectionStatus]); // Include checkConnectionStatus in deps

  const getButtonText = () => {
    if (isLoading) return `🔄 ${t('googleCalendar.loading')}`;
    
    switch (connectionStatus) {
      case 'checking':
        return `🔄 ${t('googleCalendar.checking')}`;
      case 'connected':
        return ` ${t('googleCalendar.connected')}`;
      case 'expired':
        return `🔑 ${t('googleCalendar.sessionExpired')}`;
      case 'disconnected':
      default:
        return `📅 ${t('googleCalendar.connect')}`;
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
            ? t('googleCalendar.connectedTooltip', { time: lastChecked?.toLocaleTimeString() })
            : connectionStatus === 'expired'
            ? t('googleCalendar.expiredTooltip')
            : t('googleCalendar.connectTooltip')
        }
      >
        {getButtonText()}
      </button>
      
      {connectionStatus === 'expired' && (
        <div className="token-expired-notice">
          <small>⚠️ {t('googleCalendar.sessionExpiredNotice')}</small>
        </div>
      )}
    </div>
  );
} 