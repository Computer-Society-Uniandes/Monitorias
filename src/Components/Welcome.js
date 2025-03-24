// src/Components/Welcome.js
import React from 'react';
import { auth } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import Header from './Header';

const Welcome = () => {
  const navigate = useNavigate();

  const userEmail = localStorage.getItem("userEmail");
  const isLoggedIn = localStorage.getItem("isLoggedIn");

  const handleLogout = () => {
    auth.signOut();
    localStorage.removeItem("userEmail");
    localStorage.removeItem("isLoggedIn");
    navigate("/");
  };

  if (!isLoggedIn) {
    // Si no está logueado, redirige a la principal
    navigate("/");
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold mb-4">¡Bienvenido!</h1>
      {userEmail && (
        <p className="text-xl mb-4">
          Estás logueado con: {userEmail}
        </p>
      )}
      <button
        onClick={handleLogout}
        className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
      >
        Cerrar Sesión
      </button>
    </div>
  );
}

export default Welcome;
