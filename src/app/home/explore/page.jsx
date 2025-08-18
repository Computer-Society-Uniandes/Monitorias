"use client"
import React, { useState, useEffect } from "react";
import BoxNewSubject from "../../components/BoxNewSubject/BoxNewSubject";
import { getFacultades } from "../../services/ExploreService.service";
import ExploreBanner from "app/app/components/ExploreBanner/ExploreBanner";

const Explore = () => {
    const [facultades, setFacultades] = useState([]);

    useEffect(() => {
        getFacultades().then((facultades) => {
            setFacultades(facultades);
        });
    }, []);

    return (
        <div>
            <ExploreBanner
                titulo="¿Necesitas ayuda en tus clases?"
            />
            <div className="container flex flex-col text-center mx-auto pt-4">
                <h2 className="text-4xl font-bold mb-2 text-[#FF7A7A] pb-4">
                    Tus materias este semestre
                </h2>
                <div className="mx-auto pt-4 grid grid-cols-1 text-center md:grid-cols-2 lg:grid-cols-3 gap-20">

                    {facultades.map((facultad, index) => (
                        <BoxNewSubject
                            key={index}
                            name={facultad.name}
                            number={facultad.number}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Explore;
