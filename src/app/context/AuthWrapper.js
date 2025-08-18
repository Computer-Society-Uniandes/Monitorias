"use client";

import { AuthProvider } from './SecureAuthContext';

export default function AuthWrapper({ children }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
} 