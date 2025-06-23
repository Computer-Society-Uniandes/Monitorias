"use client";

import React, { useEffect, useState } from "react";
import WelcomeBanner from "../components/Welcome/Welcome";
import BoxSubject   from "../components/BoxSubject/BoxSubject";
import { getMaterias } from "../services/HomeService.service";

export default function Home() {
  // datos de Firestore
  const [materias,   setMaterias]   = useState([]);
  // estado de sesión (se determina en cliente)
  const [mounted,    setMounted]    = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName,   setUserName]   = useState("");

  /* Leer localStorage solo en cliente */
  useEffect(() => {
    setMounted(true);
    const logged = localStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(logged);
    setUserName(logged ? localStorage.getItem("userName") ?? "" : "");
    getMaterias().then(setMaterias);   

  }, []);

  if (!mounted) return null;             

  return (
    <main className="min-h-screen">
      <WelcomeBanner usuario={userName} />

      {/* Solo mostramos las materias cuando hay login */}
      {isLoggedIn && (
        <div className="container mx-auto pt-4">
          <h2 className="text-4xl font-bold mb-2 text-[#FF7A7A] pb-4">
            Tus materias este semestre
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
            {materias.map(({ codigo, nombre }) => (
              <BoxSubject key={codigo} codigo={codigo} nombre={nombre} />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
