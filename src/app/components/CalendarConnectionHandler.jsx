"use client";

import { useCalendarConnection } from '../hooks/useCalendarConnection';

/**
 * Componente que maneja la conexión de Google Calendar
 * Utiliza el hook useCalendarConnection para procesar parámetros URL
 * y disparar eventos de estado de conexión
 */
export default function CalendarConnectionHandler() {
  // El hook maneja toda la lógica internamente
  useCalendarConnection();

  // Este componente no renderiza nada, solo maneja efectos
  return null;
}