"use client";

import React, { useEffect, useState, useRef } from "react";
import "./Header.css";
import { UserRound, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import routes from "app/routes";

export default function Header() {
  const router = useRouter();
  const [mounted, setMounted]     = useState(false);
  const [isLogged, setIsLogged]   = useState(false);
  const [role, setRole]           = useState("Student");          
  const [open, setOpen]           = useState(false);      
  const dropRef                   = useRef(null);

  /* Leer flags de localStorage solo en cliente */
  useEffect(() => {
    setMounted(true);
    setIsLogged(localStorage.getItem("isLoggedIn") === "true");

    const storedRole = localStorage.getItem("rol");
    if (storedRole === "Tutor" || storedRole === "student") {
      setRole(storedRole);
    }
  }, []);

  /* Cerrar dropdown al hacer click fuera */
  useEffect(() => {
    const handleClick = e => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!mounted) return null;

  /* Cambia rol y guarda en localStorage */
  const selectRole = newRole => {
    setRole(newRole);
    localStorage.setItem("rol", newRole);
    setOpen(false);
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
        {/* Dropdown de rol: visible siempre */}
        <div
          className={`role-dropdown ${open ? "open" : ""}`}
          ref={dropRef}
          onClick={() => setOpen(o => !o)}
        >
          <button className="role-btn">
            {role === "Tutor" ? "Tutor" : "Estudiante"}
            <ChevronDown size={16} />
          </button>

          <ul className="role-menu">
            <li
              className={role === "Student" ? "active" : ""}
              onClick={() => selectRole("student")}
            >
              Estudiante
            </li>
            <li
              className={role === "Tutor" ? "active" : ""}
              onClick={() => selectRole("Tutor")}
            >
              Tutor
            </li>
          </ul>
        </div>

        {isLogged ? (
          <button
            className="perfil"
            onClick={() => router.push(routes.PROFILE)}
          >
            Tu Perfil <UserRound size={18} />
          </button>
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
