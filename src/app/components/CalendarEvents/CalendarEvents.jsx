'use client';

import { useEffect, useState } from 'react';

export default function CalendarEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/calendar/events');
        if (!response.ok) {
          throw new Error('Error al obtener eventos');
        }
        const data = await response.json();
        setEvents(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) return <div className="p-4">Cargando eventos...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Eventos del Calendario</h2>
      {events.length === 0 ? (
        <p>No hay eventos para mostrar</p>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="border p-4 rounded-lg shadow hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-lg">{event.summary}</h3>
              <p className="text-gray-600">
                {new Date(event.start.dateTime || event.start.date).toLocaleString()}
              </p>
              {event.description && (
                <p className="mt-2 text-gray-700">{event.description}</p>
              )}
              {event.location && (
                <p className="mt-1 text-gray-600">
                  <span className="font-medium">Ubicación:</span> {event.location}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 