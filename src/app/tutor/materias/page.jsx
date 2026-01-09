"use client";

import React, { useState } from "react";
import { useI18n } from "../../../lib/i18n";
import './TutorMaterias.css';

export default function TutorMaterias() {
  const { t } = useI18n();
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
    { id: "todas", nombre: t('tutorCourses.categories.all'), icon: "📚" },
    { id: "matematicas", nombre: t('tutorCourses.categories.mathematics'), icon: "📊" },
    { id: "ciencias", nombre: t('tutorCourses.categories.sciences'), icon: "🔬" },
    { id: "ingenieria", nombre: t('tutorCourses.categories.engineering'), icon: "⚙️" }
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
    <div className="page-container">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-30 bg-white rounded-xl shadow-sm mb-4 sm:mb-6 md:mb-8 p-4 sm:p-5 md:p-6 backdrop-filter blur(10px)">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-1 sm:mb-2 break-words">
              {t('tutorCourses.title')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {t('tutorCourses.subtitle')}
            </p>
          </div>
          
          <button className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium transition-colors text-sm sm:text-base whitespace-nowrap flex-shrink-0">
            {t('tutorCourses.addCourse')}
          </button>
        </div>
      </div>

      {/* Filtros por categoría */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {categorias.map((categoria) => (
            <button
              key={categoria.id}
              onClick={() => setSelectedCategory(categoria.id)}
              className={`p-3 sm:p-4 rounded-lg text-left transition-all duration-300 ${
                selectedCategory === categoria.id
                  ? "bg-blue-100 border-2 border-blue-500 shadow-sm"
                  : "bg-gray-50 border-2 border-transparent hover:bg-gray-100 hover:shadow-sm"
              }`}
            >
              <div className="text-xl sm:text-2xl mb-1 sm:mb-2">{categoria.icon}</div>
              <div className="font-medium text-gray-800 text-xs sm:text-sm md:text-base break-words">{categoria.nombre}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Grid de materias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
        {filteredMaterias.map((materia) => (
          <div key={materia.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-4 sm:p-5 md:p-6 border border-gray-100">
            <div className="flex justify-between items-start mb-3 sm:mb-4 gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 break-words">
                  {materia.nombre}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500">{materia.codigo}</p>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getDemandaColor(materia.demanda)}`}>
                  {t(`tutorCourses.demand.${materia.demanda}`)}
                </span>
                {materia.activa ? (
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full flex-shrink-0"></span>
                ) : (
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gray-400 rounded-full flex-shrink-0"></span>
                )}
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-5">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm sm:text-base">{t('tutorCourses.card.students')}</span>
                <span className="font-semibold text-sm sm:text-base">{materia.estudiantes}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm sm:text-base">{t('tutorCourses.card.ratePerHour')}</span>
                <span className="font-semibold text-sm sm:text-base">${materia.tarifa.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-4 sm:mt-6">
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 sm:py-2.5 px-4 rounded-lg font-medium transition-colors text-sm sm:text-base">
                {t('tutorCourses.card.edit')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mt-6 sm:mt-8">
        <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow text-center border border-gray-100">
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-600 mb-1 sm:mb-2">4</p>
          <p className="text-xs sm:text-sm text-gray-600 break-words">{t('tutorCourses.stats.activeCourses')}</p>
        </div>
        <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow text-center border border-gray-100">
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-600 mb-1 sm:mb-2">48</p>
          <p className="text-xs sm:text-sm text-gray-600 break-words">{t('tutorCourses.stats.totalStudents')}</p>
        </div>
        <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow text-center border border-gray-100">
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-600 mb-1 sm:mb-2">$29,500</p>
          <p className="text-xs sm:text-sm text-gray-600 break-words">{t('tutorCourses.stats.averageRate')}</p>
        </div>
        <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow text-center border border-gray-100">
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-600 mb-1 sm:mb-2">85%</p>
          <p className="text-xs sm:text-sm text-gray-600 break-words">{t('tutorCourses.stats.successRate')}</p>
        </div>
      </div>

    </div>
  );
} 