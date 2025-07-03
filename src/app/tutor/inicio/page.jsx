"use client";

import React from "react";
import { useAuth } from "../../context/AuthContext";

export default function TutorInicio() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header de bienvenida */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          ¡Bienvenido de vuelta, {user.name}! 👋
        </h1>
        <p className="text-gray-600 text-lg">
          Aquí tienes un resumen de tu actividad como tutor
        </p>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Tutorías Hoy</h3>
            <span className="text-2xl">📅</span>
          </div>
          <p className="text-3xl font-bold text-blue-600">3</p>
          <p className="text-sm text-gray-500">+1 desde ayer</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Estudiantes Activos</h3>
            <span className="text-2xl">👥</span>
          </div>
          <p className="text-3xl font-bold text-green-600">12</p>
          <p className="text-sm text-gray-500">+2 esta semana</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Ganancias del Mes</h3>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-3xl font-bold text-yellow-600">$450.000</p>
          <p className="text-sm text-gray-500">+15% vs mes anterior</p>
        </div>
      </div>

      {/* Próximas tutorías */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Próximas Tutorías 📚
        </h2>
        <div className="space-y-4">
          {/* Placeholder para próximas tutorías */}
          <div className="border-l-4 border-blue-500 pl-4 py-2">
            <p className="font-semibold text-gray-700">Cálculo Diferencial</p>
            <p className="text-sm text-gray-500">Hoy 3:00 PM - 4:00 PM</p>
            <p className="text-sm text-blue-600">Estudiante: María García</p>
          </div>
          
          <div className="border-l-4 border-green-500 pl-4 py-2">
            <p className="font-semibold text-gray-700">Física I</p>
            <p className="text-sm text-gray-500">Mañana 10:00 AM - 11:30 AM</p>
            <p className="text-sm text-green-600">Estudiante: Carlos López</p>
          </div>
          
          <div className="border-l-4 border-yellow-500 pl-4 py-2">
            <p className="font-semibold text-gray-700">Programación</p>
            <p className="text-sm text-gray-500">Viernes 2:00 PM - 3:30 PM</p>
            <p className="text-sm text-yellow-600">Estudiante: Ana Rodríguez</p>
          </div>
        </div>
      </div>

      {/* Notas de desarrollo */}
      <div className="bg-gray-50 rounded-xl p-6 border-l-4 border-gray-400">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          🚧 En Desarrollo
        </h3>
        <p className="text-gray-600 mb-3">
          Esta es la página de inicio para tutores. Aquí se implementarán:
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-1">
          <li>Dashboard en tiempo real con estadísticas</li>
          <li>Calendario de tutorías del día/semana</li>
          <li>Notificaciones y recordatorios</li>
          <li>Enlaces rápidos a acciones frecuentes</li>
          <li>Gráficos de rendimiento y ganancias</li>
        </ul>
      </div>
    </div>
  );
} 