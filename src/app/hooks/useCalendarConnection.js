"use client";

import { useEffect } from 'react';

/**
 * Hook personalizado para manejar la conexión de Google Calendar
 * Detecta el parámetro 'calendar_connected' en la URL y dispara eventos correspondientes
 * 
 * @returns {void}
 */
export const useCalendarConnection = () => {
  useEffect(() => {
    const checkAndHandleCalendarConnection = () => {
      // Verificar que estamos en el cliente
      if (typeof window === 'undefined') return;

      const urlParams = new URLSearchParams(window.location.search);
      
      if (urlParams.get('calendar_connected') === 'true') {
        // Limpiar el parámetro URL
        const newUrl = new URL(window.location);
        newUrl.searchParams.delete('calendar_connected');
        window.history.replaceState({}, '', newUrl);
        
        // Disparar evento personalizado después de un breve delay
        const timeoutId = setTimeout(() => {
          window.dispatchEvent(new CustomEvent('calendar-status-update', { 
            detail: { connected: true } 
          }));
        }, 500);

        // Cleanup function para limpiar el timeout si el componente se desmonta
        return () => clearTimeout(timeoutId);
      }
    };

    // Ejecutar inmediatamente
    const cleanup1 = checkAndHandleCalendarConnection();
    
    // Función para manejar cuando el DOM esté listo
    const handleDOMReady = () => {
      checkAndHandleCalendarConnection();
    };

    // Función para manejar cuando la página esté completamente cargada
    const handleLoad = () => {
      checkAndHandleCalendarConnection();
    };

    // Agregar event listeners solo si es necesario
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', handleDOMReady);
    }
    
    window.addEventListener('load', handleLoad);

    // Cleanup function
    return () => {
      if (cleanup1) cleanup1();
      document.removeEventListener('DOMContentLoaded', handleDOMReady);
      window.removeEventListener('load', handleLoad);
    };
  }, []); // Empty dependency array - solo ejecutar una vez al montar
};