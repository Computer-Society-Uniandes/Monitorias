"use client"
import React from "react";
import WelcomeBanner from "../components/Welcome/Welcome";
import BoxSubject from "../components/BoxSubject/BoxSubject";
import { getMaterias } from "../services/HomeService.service";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import routes from "app/routes";


export default function Home(){
    const [materias, setMaterias] = useState([]);
    const router = useRouter();
    const userEmail = localStorage.getItem('userEmail')
    const isLoggedIn = localStorage.getItem('isLoggedIn')

    useEffect(() => {
        if (!isLoggedIn) {
            router.push(routes.LANDING)
            return
          }
        getMaterias().then((materias) => {
            setMaterias(materias);
        });
    }, []);
    return (
        <main className="min-h-screen">
            <WelcomeBanner titulo={`Bienvenido/a ${userEmail}`}/>
            <div className="container mx-auto pt-4">
                <h2 className="text-4xl font-bold mb-2 text-[#FF7A7A] pb-4">
                    Tus materias este semestre
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                    {materias.map((materia, index) => (
                        <BoxSubject key={index} codigo={materia.codigo} nombre={materia.nombre}></BoxSubject>
                    ))}
                </div>

            </div>
        </main>
    );
}