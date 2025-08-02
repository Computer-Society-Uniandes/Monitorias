"use client";

import React, { useEffect, useState } from "react";
import "./Header.css";
import { UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/SecureAuthContext";
import routes from "../../../routes";

export default function Header() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleLogout = async () => {
    try {
      await logout();
      router.push(routes.LOGIN);
    } catch (error) {
      console.error('Error during logout:', error);
      // Aún así redirigir al login en caso de error
      router.push(routes.LOGIN);
    }
  };

  return (
    <header className="header">
      <Link href="/" className="logo">
        Calico
      </Link>

      <nav className={`navbar ${user.isLoggedIn && user.isTutor ? 'navbar-tutor' : 'navbar-student'}`}>
        {user.isLoggedIn && user.isTutor ? (
          // Navegación para tutores
          <>
            <Link href={routes.TUTOR_INICIO}>Inicio</Link>
            <Link href={routes.TUTOR_MIS_TUTORIAS}>Mis tutorías</Link>
            <Link href={routes.TUTOR_MATERIAS}>Materias</Link>
            <Link href={routes.TUTOR_DISPONIBILIDAD}>Disponibilidad</Link>
            <Link href={routes.TUTOR_PAGOS}>Pagos</Link>
          </>
        ) : (
          // Navegación para estudiantes y usuarios no logueados
          <>
            <Link href={routes.HOME}>Inicio</Link>
            <Link href={routes.EXPLORE}>Explorar Materias</Link>
            <Link href={routes.SEARCH_TUTORS}>Buscar Tutores</Link>
            <Link href="/">Acerca de</Link>
          </>
        )}
      </nav>

      {/* ───────────── BOTONES DERECHA ───────────── */}
      <div className="right-block">
        {/* Mostrar rol actual solo si está logueado */}
        {user.isLoggedIn && (
          <div className="role-indicator">
            <span className={`role-badge ${user.isTutor ? 'tutor' : 'student'}`}>
              {user.isTutor ? "Tutor" : "Estudiante"}
            </span>
          </div>
        )}

        {user.isLoggedIn ? (
          <div className="user-actions">
            <button
              className="perfil"
              onClick={() => router.push(routes.PROFILE)}
            >
              Tu Perfil <UserRound size={18} />
            </button>
            <button
              className="btn-logout"
              onClick={handleLogout}
            >
              Cerrar Sesión
            </button>
          </div>
        ) : (
          <div className="auth-buttons">
            <button
              className="btn-header"
              onClick={() => router.push(routes.LOGIN)}
            >
              Iniciar Sesión
            </button>
            <button
              className="btn-header btn-header--primary"
              onClick={() => router.push(routes.REGISTER)}
            >
              Regístrate
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
