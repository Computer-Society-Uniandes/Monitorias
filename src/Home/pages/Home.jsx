import React from "react";
import Header from "../../Components/Header";
import WelcomeBanner from "../../Components/Welcome";
import BoxSubject from "../../Components/BoxSubject";
import { getMaterias } from "../services/HomeService";
import { useEffect, useState } from "react";

const renderCards = (materias) => {
    return materias.map((materia)=>(
        <BoxSubject codigo={materia.codigo} nombre={materia.nombre}></BoxSubject>
    ));
}

const Home = () => {
    const [materias, setMaterias] = useState([]);
    useEffect(() => {
        getMaterias().then((materias) => {
            setMaterias(materias);
        });
    }, []);
    return (
        <main className="min-h-screen">
            <Header></Header>
            <WelcomeBanner name="Usuario"></WelcomeBanner>
            <div className="container mx-auto pt-4">
                <h2 className="text-4xl font-bold mb-2 text-[#FF7A7A] pb-4">
                    Tus materias este semestre
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                    {renderCards(materias)}
                </div>
                
            </div>
        </main>
    );
}

export default Home;