import React from "react";

// Componente que muestra un banner de bienvenida
// Recibe un titulo, un subtitulo y una imagen
// La imagen es opcional

const loadImage = (imagen) => {
  if (imagen) {
    return <img src={imagen} alt="imagen" className="w-40 h-40 rounded-full mx-auto mt-4" />;
  }
}

const WelcomeBanner = ({ titulo, subtitulo, imagen="" }) => {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-6 rounded-2xl shadow-lg text-white text-center relative">
      <div className="absolute inset-0 border-4 border-white rounded-2xl"></div>
      <h1 className="text-3xl font-bold relative z-10">{titulo}</h1>
      <p className="text-lg mt-2 relative z-10">{subtitulo}</p>
      {loadImage(imagen)}
    </div>
  );
};

export default WelcomeBanner;
