"use client";

import { AuthProvider } from './AuthContext';

export default function AuthWrapper({ children }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
} 