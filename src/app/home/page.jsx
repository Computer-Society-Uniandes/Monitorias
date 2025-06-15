"use client"
import React from "react";
import WelcomeBanner from "../components/Welcome";
import BoxSubject from "../components/BoxSubject";
import { getMaterias } from "../services/HomeService.service";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import routes from "app/routes";


export default function Home(){
    const [materias, setMaterias] = useState([]);
    const [userEmail, setUserEmail] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(null);
    const router = useRouter();

    useEffect(() => {
        // Acceder a localStorage solo en el cliente
        const email = localStorage.getItem('userEmail');
        const loggedIn = localStorage.getItem('isLoggedIn');

        setUserEmail(email);
        setIsLoggedIn(loggedIn);

        if (!loggedIn) {
            router.push(routes.LANDING);
            return;
        }

        getMaterias().then((materias) => {
            setMaterias(materias);
        });
    }, []);

    if (isLoggedIn === null) return <div>Cargando...</div>;

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