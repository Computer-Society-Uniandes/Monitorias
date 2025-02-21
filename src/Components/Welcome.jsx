import React from "react";

const WelcomeBanner = ({ name }) => {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-6 rounded-2xl shadow-lg text-white text-center relative">
      <div className="absolute inset-0 border-4 border-white rounded-2xl"></div>
      <h1 className="text-3xl font-bold relative z-10">Bienvenida {name}</h1>
      <p className="text-lg mt-2 relative z-10">Encuentra el tutor para ti</p>
    </div>
  );
};

export default WelcomeBanner;
