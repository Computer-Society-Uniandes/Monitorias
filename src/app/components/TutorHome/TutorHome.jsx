"use client";

import React, { useEffect, useState } from "react";
import WelcomeBanner from "../Welcome/Welcome";
import BoxNewSubject from "../BoxNewSubject/BoxNewSubject";
import { getMaterias } from "../../services/HomeService.service";

export default function TutorHome({ userName }) {
  const [materias, setMaterias] = useState([]);

  useEffect(() => {
    getMaterias().then(setMaterias);
  }, []);

  return (
    <main className="min-h-screen">
      <WelcomeBanner usuario={userName} />
      <div className="container mx-auto pt-4">
        <h2 className="text-4xl font-bold mb-2 text-[#FF7A7A] pb-4">
          Materias disponibles para tutoría
        </h2>
        <p className="text-gray-600 mb-6">
          Como tutor, puedes ver las materias donde los estudiantes necesitan ayuda
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
          {materias.map(({ codigo, nombre }) => (
            <BoxNewSubject 
              key={codigo} 
              name={nombre} 
              number={Math.floor(Math.random() * 10) + 1} // Número aleatorio de estudiantes por ahora
            />
          ))}
        </div>

        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h3 className="text-2xl font-bold text-blue-800 mb-4">
            Panel de Tutor
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h4 className="font-bold text-lg text-gray-800">Sesiones Programadas</h4>
              <p className="text-3xl font-bold text-blue-600">0</p>
              <p className="text-sm text-gray-600">Para esta semana</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h4 className="font-bold text-lg text-gray-800">Estudiantes Activos</h4>
              <p className="text-3xl font-bold text-green-600">0</p>
              <p className="text-sm text-gray-600">Este mes</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h4 className="font-bold text-lg text-gray-800">Calificación</h4>
              <p className="text-3xl font-bold text-yellow-600">5.0</p>
              <p className="text-sm text-gray-600">⭐⭐⭐⭐⭐</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 