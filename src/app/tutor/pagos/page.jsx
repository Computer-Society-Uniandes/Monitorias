"use client";

import React, { useState } from "react";

export default function TutorPagos() {
  const [selectedPeriod, setSelectedPeriod] = useState("mes");

  const mockTransacciones = [
    {
      id: 1,
      fecha: "2024-01-15",
      concepto: "Tutoría Cálculo Diferencial",
      estudiante: "María García",
      monto: 50000,
      estado: "completado",
      metodo: "transferencia"
    },
    {
      id: 2,
      fecha: "2024-01-14",
      concepto: "Tutoría Física I",
      estudiante: "Carlos López",
      monto: 45000,
      estado: "completado",
      metodo: "efectivo"
    },
    {
      id: 3,
      fecha: "2024-01-13",
      concepto: "Tutoría Programación",
      estudiante: "Ana Rodríguez",
      monto: 35000,
      estado: "pendiente",
      metodo: "tarjeta"
    }
  ];

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "completado": return "bg-green-100 text-green-800";
      case "pendiente": return "bg-yellow-100 text-yellow-800";
      case "fallido": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getMetodoIcon = (metodo) => {
    switch (metodo) {
      case "transferencia": return "🏦";
      case "efectivo": return "💵";
      case "tarjeta": return "💳";
      default: return "";
    }
  };

  const totalIngresos = mockTransacciones
    .filter(t => t.estado === "completado")
    .reduce((sum, t) => sum + t.monto, 0);

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Pagos y Ganancias 
          </h1>
          <p className="text-gray-600">
            Gestiona tus ingresos y historial de pagos
          </p>
        </div>
        
        <button className="mt-4 md:mt-0 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
          💸 Solicitar Retiro
        </button>
      </div>

      {/* Resumen financiero */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Ingresos del Mes</p>
              <p className="text-2xl font-bold">${totalIngresos.toLocaleString()}</p>
            </div>
            <span className="text-3xl"></span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">$35.000</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Comisión Plataforma</p>
              <p className="text-2xl font-bold text-blue-600">8%</p>
            </div>
            <span className="text-3xl">📊</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Balance Disponible</p>
              <p className="text-2xl font-bold text-purple-600">$385.000</p>
            </div>
            <span className="text-3xl">💳</span>
          </div>
        </div>
      </div>

      {/* Filtros de período */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4">
          <span className="text-gray-700 font-medium">Ver:</span>
          
          {["semana", "mes", "trimestre", "año"].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPeriod === period
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de transacciones */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          Historial de Transacciones
        </h2>
        
        <div className="space-y-4">
          {mockTransacciones.map((transaccion) => (
            <div key={transaccion.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border border-gray-100 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg">{getMetodoIcon(transaccion.metodo)}</span>
                  <h3 className="font-semibold text-gray-800">
                    {transaccion.concepto}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(transaccion.estado)}`}>
                    {transaccion.estado}
                  </span>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4 text-sm text-gray-600">
                  <span>👤 {transaccion.estudiante}</span>
                  <span>📅 {transaccion.fecha}</span>
                  <span>💳 {transaccion.metodo}</span>
                </div>
              </div>
              
              <div className="text-right mt-2 md:mt-0">
                <p className="text-lg font-bold text-green-600">
                  ${transaccion.monto.toLocaleString()}
                </p>
                <button className="text-blue-600 hover:text-blue-800 text-sm">
                  Ver detalles
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Configuración de pagos */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          Configuración de Pagos
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">
              🏦 Cuenta Bancaria Principal
            </h3>
            <p className="text-gray-600 text-sm">Banco: Bancolombia</p>
            <p className="text-gray-600 text-sm">Cuenta: ****-****-****-1234</p>
            <button className="text-blue-600 hover:text-blue-800 text-sm mt-2">
              Editar información
            </button>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">
              ⚙️ Configuración Automática
            </h3>
            <p className="text-gray-600 text-sm">Retiros automáticos: Habilitados</p>
            <p className="text-gray-600 text-sm">Frecuencia: Semanal</p>
            <button className="text-blue-600 hover:text-blue-800 text-sm mt-2">
              Modificar configuración
            </button>
          </div>
        </div>
      </div>

    </div>
  );
} 