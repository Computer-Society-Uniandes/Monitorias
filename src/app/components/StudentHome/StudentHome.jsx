"use client";

import React, { useEffect, useState } from "react";
import WelcomeBanner from "../Welcome/Welcome";
import BoxSubject from "../BoxSubject/BoxSubject";
import { getMaterias } from "../../services/HomeService.service";

export default function StudentHome({ userName }) {
  const [materias, setMaterias] = useState([]);

  useEffect(() => {
    getMaterias().then(setMaterias);
  }, []);

  return (
    <main className="min-h-screen">
      <WelcomeBanner usuario={userName} />
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
    </main>
  );
} 