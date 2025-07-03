"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    isLoggedIn: false,
    email: '',
    name: '',
    isTutor: false,
    rol: 'Student'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Leer datos del localStorage al inicializar
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const email = localStorage.getItem('userEmail') || '';
    const name = localStorage.getItem('userName') || '';
    const isTutor = localStorage.getItem('isTutor') === 'true';
    const rol = localStorage.getItem('rol') || 'Student';

    setUser({
      isLoggedIn,
      email,
      name,
      isTutor,
      rol
    });
    setLoading(false);
  }, []);

  const login = (userData) => {
    const { email, name, isTutor = false } = userData;
    const rol = isTutor ? 'Tutor' : 'Student';
    
    // Actualizar localStorage
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userName', name);
    localStorage.setItem('isTutor', isTutor.toString());
    localStorage.setItem('rol', rol);
    
    // Actualizar estado
    setUser({
      isLoggedIn: true,
      email,
      name,
      isTutor,
      rol
    });
  };

  const logout = () => {
    // Limpiar localStorage
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('isTutor');
    localStorage.removeItem('rol');
    
    // Resetear estado
    setUser({
      isLoggedIn: false,
      email: '',
      name: '',
      isTutor: false,
      rol: 'Student'
    });
  };

  const updateUserRole = (isTutor) => {
    const rol = isTutor ? 'Tutor' : 'Student';
    
    localStorage.setItem('isTutor', isTutor.toString());
    localStorage.setItem('rol', rol);
    
    setUser(prev => ({
      ...prev,
      isTutor,
      rol
    }));
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateUserRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 