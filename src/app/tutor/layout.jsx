"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Header from "../components/Header/Header";
import routes from "../../routes";
import "../globals.css";

export default function TutorLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirigir si no está logueado o no es tutor
    if (!loading && (!user.isLoggedIn || !user.isTutor)) {
      router.push(routes.HOME);
    }
  }, [user, loading, router]);

  // Mostrar loading mientras se verifica
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#667eea]"></div>
          <p className="mt-4 text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Si no es tutor o no está logueado, no renderizar nada (se redirige)
  if (!user.isLoggedIn || !user.isTutor) {
    return null;
  }

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap"
        rel="stylesheet"
      />
      <Header suppressHydrationWarning />
      <main className="tutor-content">
        {children}
      </main>
    </>
  );
} 