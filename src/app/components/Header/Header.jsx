"use client";

import React, { useEffect, useState } from "react";
import "./Header.css";
import {
  UserRound,
  Menu,
  X,
  Home,
  Search,
  Heart,
  BarChart3,
  BookOpen,
  Bell,
  Calendar,
  GraduationCap,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import CalicoLogo from "../../../../public/CalicoLogo.png";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../context/SecureAuthContext";
import { NotificationService } from "../../services/NotificationService";
import routes from "../../../routes";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState("student"); // 'student' | 'tutor'
  const [menuOpen, setMenuOpen] = useState(false);   // ⟵ estado del menú
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const initial =
      typeof window !== "undefined"
        ? localStorage.getItem("rol") || "student"
        : "student";
    setRole(initial);

    const onRoleChange = (e) => {
      setRole(e?.detail || localStorage.getItem("rol") || "student");
    };
    window.addEventListener("role-change", onRoleChange);

    const onStorage = (e) => {
      if (e.key === "rol") setRole(e.newValue || "student");
    };
    window.addEventListener("storage", onStorage);

    // cerrar menú si ensanchas la pantalla
    const onResize = () => {
      if (window.innerWidth > 950) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("role-change", onRoleChange);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("resize", onResize);
    };
  }, [mounted]);

  // Load notification count for tutors
  useEffect(() => {
    const loadNotificationCount = async () => {
      if (user.isLoggedIn && role === "tutor" && user.email) {
        try {
          const count = await NotificationService.getUnreadNotificationCount(user.email);
          setNotificationCount(count);
        } catch (error) {
          console.error('Error loading notification count:', error);
        }
      } else {
        setNotificationCount(0);
      }
    };

    loadNotificationCount();
    
    // Refresh notification count every 30 seconds
    const interval = setInterval(loadNotificationCount, 30000);
    
    return () => clearInterval(interval);
  }, [user.isLoggedIn, user.email, role]);

  if (!mounted) return null;

  const tutorMode = user.isLoggedIn && role === "tutor";

  // Navigation items configuration
  const studentNavItems = [
    { href: routes.HOME, label: "Home", icon: Home },
    { href: routes.SEARCH_TUTORS, label: "Search", icon: Search },
    { href: routes.FAVORITES, label: "Favorites", icon: Heart }
  ];

  const tutorNavItems = [
    { href: routes.TUTOR_INICIO, label: "Home", icon: Home },
    { href: routes.TUTOR_DISPONIBILIDAD, label: "Availability", icon: Calendar },
    { href: "/tutor/statistics", label: "Statistics", icon: BarChart3 },
    { href: routes.TUTOR_MATERIAS, label: "Subjects", icon: BookOpen },
  ];

  // Check if current path matches navigation item
  const isActiveRoute = (href) => {
    // Special handling for home routes
    if (href === routes.HOME) {
      return pathname === routes.HOME || pathname === "/";
    }
    if (href === routes.TUTOR_INICIO) {
      return pathname === routes.TUTOR_INICIO;
    }
    // For other routes, check if pathname starts with the href
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      router.push(routes.LOGIN);
    }
  };

  return (
    <header className={`header ${menuOpen ? 'is-open' : ''}`}>
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
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <nav
        id="site-nav"
        className={`navbar ${tutorMode ? "navbar-tutor" : "navbar-student"}`}
        onClick={() => setMenuOpen(false)} // cerrar al elegir una opción
      >
        {(tutorMode ? tutorNavItems : studentNavItems).map(
          ({ href, label, icon: IconComponent }) => (
            <Link
              key={href}
              href={href}
              className={`nav-item ${isActiveRoute(href) ? "active" : ""}`}
            >
              <IconComponent
                size={24}
                fill={isActiveRoute(href) ? "currentColor" : "none"}
                className="nav-icon"
              />
              <span className="nav-label">{label}</span>
            </Link>
          )
        )}
      </nav>

      <div className="right-block">
        {user.isLoggedIn && (
          <div className="role-indicator">
            <button
              className={`role-badge ${tutorMode ? "tutor" : "student"}`}
              onClick={() => {
                const newRole = role === "student" ? "tutor" : "student";
                setRole(newRole);
                localStorage.setItem("rol", newRole);
                window.dispatchEvent(
                  new CustomEvent("role-change", { detail: newRole })
                );
              }}
            >
              {tutorMode ? "TUTOR" : "ESTUDIANTE"}
            </button>
          </div>
        )}

        {user.isLoggedIn ? (
          <div className="user-actions">
            <button className="notification-btn" aria-label="Notifications">
              <Bell size={20} />
              {notificationCount > 0 && (
                <span className="notification-badge">{notificationCount}</span>
              )}
            </button>
            <button
              className="profile-btn"
              onClick={() => {
                setMenuOpen(false);
                router.push(routes.PROFILE);
              }}
            >
              <UserRound size={20} />
            </button>
          </div>
        ) : (
          <div className="auth-buttons">
            <button
              className="btn-header"
              onClick={() => {
                setMenuOpen(false);
                router.push(routes.LOGIN);
              }}
            >
              Iniciar Sesión
            </button>
            <button
              className="btn-header btn-header--primary"
              onClick={() => {
                setMenuOpen(false);
                router.push(routes.REGISTER);
              }}
            >
              Regístrate
            </button>
          </div>
        )}
      </div>
      {/* Bottom mobile nav */}
      <nav className={`bottom-nav ${tutorMode ? 'bottom-nav-tutor' : 'bottom-nav-student'}`} aria-label="Mobile bottom navigation">
        {(tutorMode ? tutorNavItems : studentNavItems).map(({ href, label, icon: IconComponent }) => (
          <Link 
            key={`bottom-${href}`}
            href={href}
            className={`bottom-nav-item ${isActiveRoute(href) ? 'active' : ''}`}
          >
            <IconComponent 
              size={22} 
              className="bottom-nav-icon" 
              fill={isActiveRoute(href) ? 'currentColor' : 'none'}
            />
            <span className="bottom-nav-label">{label}</span>
          </Link>
        ))}
      </nav>
    </header>
  );
}

