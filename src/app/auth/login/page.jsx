// app/(auth)/login/Login.jsx
"use client";

import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../firebaseConfig";
import { useRouter } from "next/navigation";
import routes from "app/routes";
import "./Login.css";

const Login = () => {
  const router = useRouter();

  // Estados de formulario
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Marca si React ya montó el componente
  const [mounted, setMounted] = useState(false);

  // Sólo en cliente: marcamos montagem y, opcionalmente,
  // redirigimos si ya está logueado
  useEffect(() => {
    setMounted(true);

    const alreadyLogged = localStorage.getItem("isLoggedIn") === "true";
    if (alreadyLogged) {
      router.replace(routes.HOME);
    }
  }, [router]);

  // Mientras no estemos en cliente, no renderizamos nada
  if (!mounted) {
    return null;
  }

  // Función de login (sólo corre en evento, en cliente)
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem("userEmail", email);
      localStorage.setItem("isLoggedIn", "true");
      router.push(routes.HOME);
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      alert("Usuario o contraseña incorrectos.");
    }
  };

  return (
    <main className="login-page">
      <section className="login-wrapper">
        <div className="login-card">
          <h2 className="login-title">Inicia Sesión</h2>

          <p className="login-text">
            ¿No tienes una cuenta?
            <span
              className="login-link"
              onClick={() => router.push(routes.REGISTER)}
            >
              &nbsp;Regístrate
            </span>
          </p>

          <form onSubmit={handleLogin} className="login-form">
            <label className="login-label">Correo</label>
            <input
              className="login-input"
              type="email"
              placeholder="Tu correo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label className="login-label">Contraseña</label>
            <input
              className="login-input"
              type="password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit" className="login-btn">
              Iniciar Sesión
            </button>
          </form>
        </div>
      </section>
    </main>
  );
};

export default Login;
