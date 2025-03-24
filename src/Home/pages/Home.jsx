import React from "react";
import Header from "../../Components/Header";
import WelcomeBanner from "../../Components/Welcome";
import BoxSubject from "../../Components/BoxSubject";
import { getMaterias } from "../services/HomeService";
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebaseConfig';

const Home = ({ nombre="usuario" }) => {
    const navigate = useNavigate();
    const [materias, setMaterias] = useState([]);
    useEffect(() => {
        getMaterias().then((materias) => {
            setMaterias(materias);
        });
    }, []);

    const userEmail = localStorage.getItem("userEmail");
      const isLoggedIn = localStorage.getItem("isLoggedIn");
    
      const handleLogout = () => {
        auth.signOut();
        localStorage.removeItem("userEmail");
        localStorage.removeItem("isLoggedIn");
        navigate("/");
      };
    
      if (!isLoggedIn) {
        // Si no está logueado, redirige a la principal
        navigate("/");
        return null;
      }

    return (
        <main className="min-h-screen">
            <Header></Header>
            <WelcomeBanner titulo={`Bienvenido/a ${nombre}`} imagenCarga="" />
            <div className="container mx-auto pt-4">
                <h2 className="text-4xl font-bold mb-2 text-[#FF7A7A] pb-4">
                    Tus materias este semestre
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                    {materias.map((materia) => (
                        <BoxSubject codigo={materia.codigo} nombre={materia.nombre}></BoxSubject>
                    ))}
                </div>

            </div>
        </main>
    );
}

export default Home;