"use client";

import { useAuth } from '../context/SecureAuthContext';

/**
 * Hook personalizado para acceder a datos del usuario de forma segura
 * Reemplaza el uso directo de localStorage
 * 
 * @returns {Object} Objeto con datos del usuario y estado de carga
 */
export const useUser = () => {
  const { user, loading } = useAuth();

  return {
    // Datos del usuario
    email: user.email,
    name: user.name,
    isTutor: user.isTutor,
    role: user.role,
    uid: user.uid,
    isLoggedIn: user.isLoggedIn,
    
    // Estado
    loading,
    
    // Helpers para compatibilidad con código existente
    userEmail: user.email, // Para componentes que usan userEmail
    userName: user.name,   // Para componentes que usan userName
    
    // Métodos de verificación
    isAuthenticated: () => user.isLoggedIn,
    isTutorUser: () => user.isTutor,
    isStudentUser: () => !user.isTutor
  };
};

/**
 * Hook para obtener solo el email del usuario (reemplazo directo de localStorage.getItem('userEmail'))
 * @returns {string} Email del usuario o string vacío
 */
export const useUserEmail = () => {
  const { user } = useAuth();
  return user.email || '';
};

/**
 * Hook para obtener solo el nombre del usuario
 * @returns {string} Nombre del usuario o string vacío
 */
export const useUserName = () => {
  const { user } = useAuth();
  return user.name || '';
};

/**
 * Hook para verificar si el usuario es tutor
 * @returns {boolean} true si es tutor, false en caso contrario
 */
export const useIsTutor = () => {
  const { user } = useAuth();
  return user.isTutor;
};