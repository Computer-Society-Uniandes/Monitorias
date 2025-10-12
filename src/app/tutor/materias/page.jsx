"use client";

import React, { useState } from "react";

export default function TutorMaterias() {
  const [selectedCategory, setSelectedCategory] = useState("todas");

  const mockMaterias = [
    {
      id: 1,
      nombre: "Cálculo Diferencial",
      codigo: "MATE1105",
      categoria: "matematicas",
      estudiantes: 15,
      activa: true,
      tarifa: 50000,
      demanda: "alta"
    },
    {
      id: 2,
      nombre: "Física I",
      codigo: "FISI1018",
      categoria: "ciencias",
      estudiantes: 8,
      activa: true,
      tarifa: 30000,
      demanda: "media"
    },
    {
      id: 3,
      nombre: "Programación",
      codigo: "ISIS1204",
      categoria: "ingenieria",
      estudiantes: 22,
      activa: true,
      tarifa: 35000,
      demanda: "alta"
    }
  ];

  const categorias = [
    { id: "todas", nombre: "Todas las materias", icon: "📚" },
    { id: "matematicas", nombre: "Matemáticas", icon: "📊" },
    { id: "ciencias", nombre: "Ciencias", icon: "🔬" },
    { id: "ingenieria", nombre: "Ingeniería", icon: "⚙️" }
  ];

  const getDemandaColor = (demanda) => {
    switch (demanda) {
      case "alta": return "bg-green-100 text-green-800";
      case "media": return "bg-yellow-100 text-yellow-800";
      case "baja": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredMaterias = selectedCategory === "todas" 
    ? mockMaterias 
    : mockMaterias.filter(m => m.categoria === selectedCategory);

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Mis Materias 📖
          </h1>
          <p className="text-gray-600">
            Administra las materias que enseñas y sus configuraciones
          </p>
        </div>
        
        <button className="mt-4 md:mt-0 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
          + Agregar Materia
        </button>
      </div>

      {/* Filtros por categoría */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categorias.map((categoria) => (
            <button
              key={categoria.id}
              onClick={() => setSelectedCategory(categoria.id)}
              className={`p-4 rounded-lg text-left transition-colors ${
                selectedCategory === categoria.id
                  ? "bg-blue-100 border-2 border-blue-500"
                  : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
              }`}
            >
              <div className="text-2xl mb-2">{categoria.icon}</div>
              <div className="font-medium text-gray-800">{categoria.nombre}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Grid de materias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaterias.map((materia) => (
          <div key={materia.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {materia.nombre}
                </h3>
                <p className="text-sm text-gray-500">{materia.codigo}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDemandaColor(materia.demanda)}`}>
                  {materia.demanda}
                </span>
                {materia.activa ? (
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                ) : (
                  <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">👥 Estudiantes</span>
                <span className="font-semibold">{materia.estudiantes}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">💰 Tarifa/hora</span>
                <span className="font-semibold">${materia.tarifa.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
        <div className="bg-white rounded-xl p-6 shadow-sm text-center">
          <p className="text-2xl font-bold text-blue-600">4</p>
          <p className="text-sm text-gray-600">Materias Activas</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm text-center">
          <p className="text-2xl font-bold text-green-600">48</p>
          <p className="text-sm text-gray-600">Total Estudiantes</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm text-center">
          <p className="text-2xl font-bold text-yellow-600">$29,500</p>
          <p className="text-sm text-gray-600">Tarifa Promedio</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm text-center">
          <p className="text-2xl font-bold text-purple-600">85%</p>
          <p className="text-sm text-gray-600">Tasa de Éxito</p>
        </div>
      </div>

    </div>
  );
} 