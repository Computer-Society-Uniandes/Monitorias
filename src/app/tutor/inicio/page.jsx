"use client";

import React from "react";
import { useAuth } from "../../context/SecureAuthContext";
import TutorHome from "../../components/TutorHome/TutorHome";

export default function TutorInicio() {
  const { user } = useAuth();

  // Renderizar el contenido completo del TutorHome aquí
  return <TutorHome userName={user.name} />;
} 