'use client';

import { useState } from 'react';

export default function GoogleCalendarButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnectCalendar = () => {
    window.location.href = '/api/calendar/auth';
  };

  return (
    <button
      onClick={handleConnectCalendar}
      disabled={isLoading}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <span>Conectando...</span>
      ) : (
        <>
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
          </svg>
          <span>Conectar con Google Calendar</span>
        </>
      )}
    </button>
  );
} 