// firebaseConfig.js
'use client';

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "",
};

// Log útil (solo en dev, lado cliente)
if (typeof window !== "undefined") {
  const masked = (s) => (s ? `${s.slice(0,6)}…${s.slice(-4)}` : "(vacía)");
  console.log("[firebase] apiKey:", masked(firebaseConfig.apiKey));
}

// Si falta la apiKey, corta aquí para no inicializar mal
if (!firebaseConfig.apiKey) {
  throw new Error(
    "[firebase] NEXT_PUBLIC_FIREBASE_API_KEY no está definida. Revisa tu .env.local y reinicia el dev server."
  );
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// En cliente estarán disponibles; en SSR no los uses
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
