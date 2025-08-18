"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import routes from "../../../routes";
import "./TutorNavbar.css";

export default function TutorNavbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Inicio", href: routes.TUTOR_INICIO, icon: "🏠" },
    { name: "Mis tutorías", href: routes.TUTOR_MIS_TUTORIAS, icon: "📚" },
    { name: "Materias", href: routes.TUTOR_MATERIAS, icon: "📖" },
    { name: "Pagos", href: routes.TUTOR_PAGOS, icon: "💰" }
  ];

  const isActive = (href) => pathname === href;

  return (
    <nav className="tutor-navbar">
      <div className="tutor-navbar-container">
        {/* Logo/Brand del tutor */}
        <div className="tutor-navbar-brand">
          <span className="tutor-badge">TUTOR</span>
          <span className="tutor-title">Panel de Control</span>
        </div>

        {/* Navegación desktop */}
        <div className="tutor-navbar-menu">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`tutor-navbar-link ${isActive(item.href) ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.name}</span>
            </Link>
          ))}
        </div>

        {/* Botón menú móvil */}
        <button
          className="tutor-navbar-mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
      </div>

      {/* Menú móvil */}
      {mobileMenuOpen && (
        <div className="tutor-navbar-mobile-menu">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`tutor-navbar-mobile-link ${isActive(item.href) ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.name}</span>
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
} 