import React, { useState, useEffect } from "react";
import Header from "../../Components/Header";
import WelcomeBanner from "../../Components/Welcome";
import BoxNewSubject from "../../Components/BoxNewSubject";
import { getFacultades } from "../services/ExploreService";

const Explore = () => {
    const [facultades, setFacultades] = useState([]);

    useEffect(() => {
        getFacultades().then((facultades) => {
            setFacultades(facultades);
        });
    }, []);

    return (
        <div>
            <Header />
            <WelcomeBanner
                titulo="¿Necesitas ayuda en tus clases?"
                imagenCarga="https://s3-alpha-sig.figma.com/img/30b5/f560/909fc70efb7787e78eadfe88074634b8?Expires=1741564800&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=M92rrcbzlzOvYxfBxorc9mXhikpEK6n8hfZw3aasR~sr~g6mJonGAH9Kw5k2T7dpEv1aAmJzYYiDNALzyRXT6ttA9efXmdGLLlu-hx23LwmtCT6tbWbG-EXEwNYxtq04p-Nr4h9fqgkSFKXwmX7euRZKvker3a0QN5LMbUAi9EKinhF3v2B1VPyoGZ8XyL6lJV7gnupW3dixsI57oyWUywuTF1EFFqVU5q8K3Qol07iUxFuToaOVZus2FeAx~gjFXQHzfwHhVHzmmu0xB19UpcQmG3-8fwcfShFHdRflGUm49H9hQxRAjuOpX1KRvzKux7qv70rBOP1MPmMEHDYCFg__"
            />
            <div className="container flex flex-col text-center mx-auto pt-4">
                <h2 className="text-4xl font-bold mb-2 text-[#FF7A7A] pb-4">
                    Tus materias este semestre
                </h2>
                <div className="mx-auto pt-4 grid grid-cols-1 text-center md:grid-cols-2 lg:grid-cols-3 gap-20">

                    {facultades.map((facultad) => (
                        <BoxNewSubject
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
