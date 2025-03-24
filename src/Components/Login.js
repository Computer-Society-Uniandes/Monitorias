// src/Components/Login.js
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Guardar en localStorage
      localStorage.setItem("userUid", user.uid);
      localStorage.setItem("userEmail", email);

      // Redirigir
      navigate("/home");
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      alert("Usuario o contraseña incorrectos.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-indigo-50">
      <h2 className="text-2xl font-bold mb-4 text-indigo-600">Iniciar Sesión</h2>
      <form onSubmit={handleLogin} className="flex flex-col bg-white p-6 rounded shadow-md">
        
        <label className="mb-2 text-sm text-indigo-600">Correo:</label>
        <input
          type="email"
          className="mb-4 p-2 border rounded"
          placeholder="Tu correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        
        <label className="mb-2 text-sm text-indigo-600">Contraseña:</label>
        <input
          type="password"
          className="mb-4 p-2 border rounded"
          placeholder="Tu contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded"
        >
          Iniciar Sesión
        </button>
      </form>
    </div>
  );
};

export default Login;
