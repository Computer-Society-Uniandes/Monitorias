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
  const [role, setRole] = useState("student"); // 'student' | 'tutor'

  // 1) Montado para evitar hidratar distinto
  useEffect(() => {
    setMounted(true);
  }, []);

  // 2) Leer rol inicial y suscribirse a cambios (evento custom + storage)
  useEffect(() => {
    if (!mounted) return;

    // valor inicial
    const initial = typeof window !== "undefined"
      ? (localStorage.getItem("rol") || "student")
      : "student";
    setRole(initial);

    // cambios desde Profile (misma pestaña)
    const onRoleChange = (e) => {
      setRole(e?.detail || (localStorage.getItem("rol") || "student"));
    };
    window.addEventListener("role-change", onRoleChange);

    // cambios desde otras pestañas/ventanas
    const onStorage = (e) => {
      if (e.key === "rol") setRole(e.newValue || "student");
    };
    window.addEventListener("storage", onStorage);

    // cleanup
    return () => {
      window.removeEventListener("role-change", onRoleChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [mounted]);

  if (!mounted) return null;

  const tutorMode = user.isLoggedIn && user.isTutor && role === "tutor";

  const handleLogout = async () => {
    try { await logout(); }
    catch (error) { console.error("Error during logout:", error); }
    finally { router.push(routes.LOGIN); }
  };

  return (
    <header className="header">
      <Link href="/" className="logo">Calico</Link>

      <nav className={`navbar ${tutorMode ? "navbar-tutor" : "navbar-student"}`}>
        {tutorMode ? (
          <>
            <Link href={routes.TUTOR_INICIO}>Inicio</Link>
            <Link href={routes.TUTOR_MIS_TUTORIAS}>Mis tutorías</Link>
            <Link href={routes.TUTOR_MATERIAS}>Materias</Link>
            <Link href={routes.TUTOR_DISPONIBILIDAD}>Disponibilidad</Link>
            <Link href={routes.TUTOR_PAGOS}>Pagos</Link>
          </>
        ) : (
          <>
            <Link href={routes.HOME}>Inicio</Link>
            <Link href={routes.EXPLORE}>Explorar Materias</Link>
            <Link href={routes.SEARCH_TUTORS}>Buscar Tutores</Link>
            <Link href="/">Acerca de</Link>
          </>
        )}
      </nav>

      <div className="right-block">
        {user.isLoggedIn ? (
          <div className="user-actions">
            <button className="perfil" onClick={() => router.push(routes.PROFILE)}>
              Tu Perfil <UserRound size={18} />
            </button>
            <button className="btn-logout" onClick={handleLogout}>
              Cerrar Sesión
            </button>
          </div>
        ) : (
          <div className="auth-buttons">
            <button className="btn-header" onClick={() => router.push(routes.LOGIN)}>
              Iniciar Sesión
            </button>
            <button className="btn-header btn-header--primary" onClick={() => router.push(routes.REGISTER)}>
              Regístrate
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
