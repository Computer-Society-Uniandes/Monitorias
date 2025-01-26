import React from "react";

const WelcomeBanner = ({ name }) => {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-6 rounded-2xl shadow-lg text-white text-center">
      <h1 className="text-3xl font-bold">Bienvenida {name}</h1>
      <p className="text-lg mt-2">Encuentra el tutor para ti</p>
    </div>
  );
};

export default WelcomeBanner;