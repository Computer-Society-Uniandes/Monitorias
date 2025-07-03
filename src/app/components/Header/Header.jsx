"use client";

import React, { useEffect, useState } from "react";
import "./Header.css";
import { UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import routes from "app/routes";

export default function Header() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleLogout = () => {
    logout();
    router.push(routes.LOGIN);
  };

  return (
    <header className="header">
      <Link href="/" className="logo">
        Calico
      </Link>

      <nav className="navbar">
        <Link href={routes.HOME}>Inicio</Link>
        <Link href={routes.EXPLORE}>Explorar Materias</Link>
        <Link href="/">Buscar Tutores</Link>
        <Link href="/">Acerca de</Link>
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
