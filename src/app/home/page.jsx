"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import StudentHome from "../components/StudentHome/StudentHome";
import TutorHome from "../components/TutorHome/TutorHome";

export default function Home() {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Mostrar loading mientras se carga el contexto o no está montado
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#FF7A7A]"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no está logueado, mostrar mensaje
  if (!user.isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Acceso Restringido
          </h2>
          <p className="text-gray-600">
            Debes iniciar sesión para acceder a esta página.
          </p>
        </div>
      </div>
    );
  }

  // Renderizar la vista apropiada según el rol del usuario
  if (user.isTutor) {
    return <TutorHome userName={user.name} />;
  } else {
    return <StudentHome userName={user.name} />;
  }
}
