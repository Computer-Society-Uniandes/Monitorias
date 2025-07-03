"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import WelcomeBanner from "../Welcome/Welcome";
import BoxNewSubject from "../BoxNewSubject/BoxNewSubject";
import TutorNavbar from "../TutorNavbar/TutorNavbar";
import { getMaterias } from "../../services/HomeService.service";
import routes from "../../../routes";

export default function TutorHome({ userName }) {
  const [materias, setMaterias] = useState([]);
  const router = useRouter();

  useEffect(() => {
    getMaterias().then(setMaterias);
  }, []);

  return (
    <main className="min-h-screen">
      {/* Navbar específico para tutores */}
      <TutorNavbar />
      
      <WelcomeBanner usuario={userName} />
      
      <div className="container mx-auto pt-4 px-6">
        {/* Banner de bienvenida con accesos rápidos */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Panel de Tutor 🎓
              </h2>
              <p className="text-gray-600 mb-4">
                Bienvenido a tu espacio de trabajo. Aquí puedes gestionar todo tu trabajo como tutor.
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-3">
              <Link 
                href={routes.TUTOR_MIS_TUTORIAS}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-center"
              >
                📚 Mis Tutorías
              </Link>
              <Link 
                href={routes.TUTOR_MATERIAS}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-center"
              >
                📖 Gestionar Materias
              </Link>
            </div>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-lg text-gray-800">Tutorías Hoy</h4>
                <p className="text-3xl font-bold text-blue-600">3</p>
                <p className="text-sm text-gray-600">Programadas</p>
              </div>
              <span className="text-3xl">📅</span>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-lg text-gray-800">Estudiantes</h4>
                <p className="text-3xl font-bold text-green-600">12</p>
                <p className="text-sm text-gray-600">Este mes</p>
              </div>
              <span className="text-3xl">👥</span>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-lg text-gray-800">Ingresos</h4>
                <p className="text-3xl font-bold text-yellow-600">$450K</p>
                <p className="text-sm text-gray-600">Este mes</p>
              </div>
              <span className="text-3xl">💰</span>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-lg text-gray-800">Calificación</h4>
                <p className="text-3xl font-bold text-purple-600">4.9</p>
                <p className="text-sm text-gray-600">⭐⭐⭐⭐⭐</p>
              </div>
              <span className="text-3xl">🏆</span>
            </div>
          </div>
        </div>

        {/* Materias disponibles */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Materias disponibles para tutoría
            </h2>
            <Link 
              href={routes.TUTOR_MATERIAS}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Ver todas →
            </Link>
          </div>
          
          <p className="text-gray-600 mb-6">
            Estas son las materias donde puedes ofrecer tutorías
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {materias.slice(0, 6).map(({ codigo, nombre }) => (
              <BoxNewSubject 
                key={codigo} 
                name={nombre} 
                number={Math.floor(Math.random() * 10) + 1}
              />
            ))}
          </div>
        </div>

        {/* Próximas tutorías */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Próximas Tutorías 📚
            </h2>
            <Link 
              href={routes.TUTOR_MIS_TUTORIAS}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Ver todas →
            </Link>
          </div>
          
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4 py-3 bg-blue-50 rounded-r-lg">
              <p className="font-semibold text-gray-700">Cálculo Diferencial</p>
              <p className="text-sm text-gray-600">Hoy 3:00 PM - 4:00 PM</p>
              <p className="text-sm text-blue-600">Estudiante: María García</p>
            </div>
            
            <div className="border-l-4 border-green-500 pl-4 py-3 bg-green-50 rounded-r-lg">
              <p className="font-semibold text-gray-700">Física I</p>
              <p className="text-sm text-gray-600">Mañana 10:00 AM - 11:30 AM</p>
              <p className="text-sm text-green-600">Estudiante: Carlos López</p>
            </div>
          </div>
        </div>

        {/* Nota de funcionalidades */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border-l-4 border-blue-400">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            ✨ Nuevas Funcionalidades Disponibles
          </h3>
          <p className="text-gray-600 mb-3">
            Ahora tienes acceso completo al panel de tutor con navegación dedicada:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <span className="text-blue-600">🏠</span>
              <span className="text-gray-700">Panel de inicio con estadísticas</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-blue-600">📚</span>
              <span className="text-gray-700">Gestión completa de tutorías</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-blue-600">📖</span>
              <span className="text-gray-700">Administración de materias</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-blue-600">💰</span>
              <span className="text-gray-700">Control de pagos e ingresos</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 