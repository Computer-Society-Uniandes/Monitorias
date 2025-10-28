"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { AuthService } from '../services/utils/AuthService';

const SecureAuthContext = createContext();

export const useAuth = () => {
  const context = useContext(SecureAuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

/**
 * AuthProvider seguro que usa Firebase Auth persistence + Firestore
 * Elimina completamente el uso de localStorage para datos sensibles
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    isLoggedIn: false,
    email: '',
    name: '',
    isTutor: false,
    role: 'Student',
    uid: null
  });
  const [loading, setLoading] = useState(true);

  /**
   * Obtiene datos adicionales del usuario desde Firestore
   */
  const fetchUserData = async (firebaseUser) => {
    try {
      const userDocRef = doc(db, 'user', firebaseUser.email);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        return {
          name: userData.name || firebaseUser.displayName || firebaseUser.email.split('@')[0],
          isTutor: userData.isTutor || false,
          // ... otros campos que puedas necesitar
        };
      } else {
        // Si no existe el documento en Firestore, usar datos básicos de Firebase Auth
        return {
          name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          isTutor: false,
        };
      }
    } catch (error) {
      console.error('Error fetching user data from Firestore:', error);
      // Fallback a datos básicos si hay error
      return {
        name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
        isTutor: false,
      };
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      // Log del cambio de estado de autenticación y datos relevantes del usuario
      try {
        console.log('[Auth] onAuthStateChanged ->', firebaseUser ? {
          uid: firebaseUser?.uid,
          email: firebaseUser?.email,
          displayName: firebaseUser?.displayName || null,
          providerData: (firebaseUser?.providerData || []).map(p => ({
            providerId: p?.providerId,
            email: p?.email || null,
            uid: p?.uid || null,
          }))
        } : null);
      } catch (_) {}
      
      if (firebaseUser) {
        // Usuario autenticado - obtener datos adicionales de Firestore
        const additionalData = await fetchUserData(firebaseUser);
        
        setUser({
          isLoggedIn: true,
          email: firebaseUser.email,
          name: additionalData.name,
          isTutor: additionalData.isTutor,
          role: additionalData.isTutor ? 'Tutor' : 'Student',
          uid: firebaseUser.uid
        });
      } else {
        // Usuario no autenticado
        setUser({
          isLoggedIn: false,
          email: '',
          name: '',
          isTutor: false,
          role: 'Student',
          uid: null
        });
      }
      
      setLoading(false);
    });

    // Cleanup function
    return () => unsubscribe();
  }, []);

  /**
   * Login method - ahora solo actualiza el estado basado en Firebase Auth
   * Los datos se obtienen automáticamente via onAuthStateChanged
   */
  const login = async (userData) => {
    // Firebase Auth ya maneja la persistencia, solo necesitamos hacer el sign in
    // El estado se actualizará automáticamente via onAuthStateChanged
    try {
      const result = await AuthService.signIn(userData.email, userData.password);
      return result;
    } catch (error) {
      console.error('Error in login:', error);
      throw error;
    }
  };

  /**
   * Logout method - usa Firebase Auth
   */
  const logout = async () => {
    try {
      await AuthService.signOut();
      // El estado se limpiará automáticamente via onAuthStateChanged
    } catch (error) {
      console.error('Error in logout:', error);
      throw error;
    }
  };

  /**
   * Actualiza el rol del usuario tanto en el estado como en Firestore
   */
  const updateUserRole = async (isTutor) => {
    if (!user.isLoggedIn) return;

    try {
      // Actualizar en Firestore
      const userDocRef = doc(db, 'user', user.email);
      await updateDoc(userDocRef, {
        isTutor: isTutor,
        updatedAt: new Date()
      });

      // Actualizar estado local
      setUser(prev => ({
        ...prev,
        isTutor,
        role: isTutor ? 'Tutor' : 'Student'
      }));
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  };

  /**
   * Refrescar datos del usuario desde Firestore
   */
  const refreshUserData = async () => {
    if (!auth.currentUser) return;

    setLoading(true);
    const additionalData = await fetchUserData(auth.currentUser);
    
    setUser(prev => ({
      ...prev,
      name: additionalData.name,
      isTutor: additionalData.isTutor,
      role: additionalData.isTutor ? 'Tutor' : 'Student'
    }));
    setLoading(false);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateUserRole,
    refreshUserData
  };

  return (
    <SecureAuthContext.Provider value={value}>
      {children}
    </SecureAuthContext.Provider>
  );
};