"use client";

import React, { useState } from "react";

export default function MisTutorias() {
  const [filterStatus, setFilterStatus] = useState("todas");

  const mockTutorias = [
    {
      id: 1,
      materia: "Cálculo Diferencial",
      estudiante: "María García",
      fecha: "2024-01-15",
      hora: "15:00 - 16:00",
      estado: "programada",
      modalidad: "presencial"
    },
    {
      id: 2,
      materia: "Física I",
      estudiante: "Carlos López",
      fecha: "2024-01-16",
      hora: "10:00 - 11:30",
      estado: "completada",
      modalidad: "virtual"
    },
    {
      id: 3,
      materia: "Programación",
      estudiante: "Ana Rodríguez",
      fecha: "2024-01-18",
      hora: "14:00 - 15:30",
      estado: "programada",
      modalidad: "presencial"
    }
  ];

  const getStatusColor = (estado) => {
    switch (estado) {
      case "programada": return "bg-blue-100 text-blue-800";
      case "completada": return "bg-green-100 text-green-800";
      case "cancelada": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getModalidadIcon = (modalidad) => {
    return modalidad === "virtual" ? "💻" : "🏫";
  };

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Mis Tutorías 📚
          </h1>
          <p className="text-gray-600">
            Gestiona y supervisa todas tus sesiones de tutoría
          </p>
        </div>
        
        <button className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
          + Nueva Tutoría
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <span className="text-gray-700 font-medium">Filtrar por estado:</span>
          
          {["todas", "programada", "completada", "cancelada"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de tutorías */}
      <div className="space-y-4">
        {mockTutorias.map((tutoria) => (
          <div key={tutoria.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {tutoria.materia}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(tutoria.estado)}`}>
                    {tutoria.estado}
                  </span>
                  <span className="text-lg">
                    {getModalidadIcon(tutoria.modalidad)}
                  </span>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4 text-gray-600">
                  <span>👤 {tutoria.estudiante}</span>
                  <span>📅 {tutoria.fecha}</span>
                  <span>⏰ {tutoria.hora}</span>
                  <span>{tutoria.modalidad === "virtual" ? "💻 Virtual" : "🏫 Presencial"}</span>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4 md:mt-0">
                <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  Ver Detalles
                </button>
                <button className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  Editar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-blue-600">8</p>
          <p className="text-sm text-gray-600">Este mes</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-green-600">12</p>
          <p className="text-sm text-gray-600">Completadas</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-yellow-600">3</p>
          <p className="text-sm text-gray-600">Programadas</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-purple-600">4.8</p>
          <p className="text-sm text-gray-600">Calificación ⭐</p>
        </div>
      </div>

      {/* Notas de desarrollo */}
      <div className="bg-gray-50 rounded-xl p-6 border-l-4 border-gray-400 mt-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          🚧 Funcionalidades a Implementar
        </h3>
        <ul className="list-disc list-inside text-gray-600 space-y-1">
          <li>CRUD completo de tutorías (crear, editar, cancelar)</li>
          <li>Calendario interactivo para gestionar horarios</li>
          <li>Sistema de notificaciones automáticas</li>
          <li>Chat integrado con estudiantes</li>
          <li>Reportes y análisis de sesiones</li>
          <li>Integración con sistema de pagos</li>
        </ul>
      </div>
    </div>
  );
} 