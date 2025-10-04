"use client";

import React, { useEffect, useState } from "react";
import "./Header.css";
import { UserRound, Menu, X } from "lucide-react";   // ⟵ añadí Menu y X
import Link from "next/link";
import Image from "next/image";
import CalicoLogo from "../../../../public/CalicoLogo.png";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/SecureAuthContext";
import routes from "../../../routes";

export default function Header() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState("student"); // 'student' | 'tutor'
  const [menuOpen, setMenuOpen] = useState(false);   // ⟵ estado del menú

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;

    const initial = typeof window !== "undefined"
      ? (localStorage.getItem("rol") || "student")
      : "student";
    setRole(initial);

    const onRoleChange = (e) => {
      setRole(e?.detail || (localStorage.getItem("rol") || "student"));
    };
    window.addEventListener("role-change", onRoleChange);

    const onStorage = (e) => {
      if (e.key === "rol") setRole(e.newValue || "student");
    };
    window.addEventListener("storage", onStorage);

    // cerrar menú si ensanchas la pantalla
    const onResize = () => { if (window.innerWidth > 950) setMenuOpen(false); };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("role-change", onRoleChange);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("resize", onResize);
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
      <Link href="/" className="logo">
        <Image src={CalicoLogo} alt="Calico" className="logoImg" priority />
      </Link>

      {/* Botón hamburguesa solo móvil */}
      <button
        className="hamburger"
        aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={menuOpen}
        aria-controls="site-nav"
        onClick={() => setMenuOpen((v) => !v)}
      >
        {menuOpen ? <X size={20}/> : <Menu size={20}/>}
      </button>

      <nav
        id="site-nav"
        className={`navbar ${tutorMode ? "navbar-tutor" : "navbar-student"}`}
        onClick={() => setMenuOpen(false)}   // cerrar al elegir una opción
      >
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
            <button className="perfil" onClick={() => { setMenuOpen(false); router.push(routes.PROFILE); }}>
              Tu Perfil <UserRound size={18} />
            </button>
            <button className="btn-logout" onClick={handleLogout}>
              Cerrar Sesión
            </button>
          </div>
        ) : (
          <div className="auth-buttons">
            <button className="btn-header" onClick={() => { setMenuOpen(false); router.push(routes.LOGIN); }}>
              Iniciar Sesión
            </button>
            <button className="btn-header btn-header--primary" onClick={() => { setMenuOpen(false); router.push(routes.REGISTER); }}>
              Regístrate
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
