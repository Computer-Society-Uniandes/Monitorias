"use client";

import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import UnifiedAvailability from "../../components/UnifiedAvailability/UnifiedAvailability";

export default function DisponibilidadPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if we just came from OAuth callback
    const calendarConnected = searchParams?.get('calendar_connected');
    if (calendarConnected === 'true') {
      // Dispatch event to trigger calendar status check
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('calendar-status-update', { 
          detail: { connected: true } 
        }));
      }, 500);
    }
  }, [searchParams]);

  return <UnifiedAvailability />;
} 