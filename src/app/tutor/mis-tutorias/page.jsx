"use client";

import React from "react";
import TutoringManagement from "../../components/TutoringManagement/TutoringManagement";
import DisponibilidadSummary from "../../components/DisponibilidadSummary/DisponibilidadSummary";

export default function MisTutorias() {
  return (
    <div>
      {/* Componente principal de gestión de tutorías */}
      <TutoringManagement />

      {/* Resumen de Disponibilidad */}
      <div className="container mx-auto px-6 pb-8">
        <DisponibilidadSummary />
      </div>
    </div>
  );
} 