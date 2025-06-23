"use client";

import React, { useEffect, useState } from "react";
import "./Header.css";
import { UserRound } from "lucide-react";
import Link    from "next/link";
import { useRouter } from "next/navigation";
import routes  from "app/routes";

export default function Header() {
  const router = useRouter();
  const [mounted,    setMounted]    = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");
  }, []);

  if (!mounted) return null;

  return (
    <header className="header">
      <Link href="/"  className="logo">Calico</Link>

      <nav className="navbar">
        <Link href={routes.HOME}>Inicio</Link>
        <Link href={routes.EXPLORE}>Explorar Materias</Link>
        <Link href="/">Buscar Tutores</Link>
        <Link href="/">Acerca de</Link>
      </nav>

      {/* Acciones según sesión */}
      {isLoggedIn ? (
        <button
          className="perfil"
          onClick={() => router.push(routes.PROFILE)}
        >
          Tu Perfil <UserRound />
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
    </header>
  );
}
