import React from "react";

const WelcomeBanner = ({ name }) => {
  return (
    <div className="relative w-full h-[270px] overflow-hidden bg-gradient-to-b from-indigo-500 to-indigo-900">
      <div
        className="absolute w-full h-full"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0) 30%, rgba(76, 81, 191, 0.3) 70%)",
          borderRadius: "50% 50% 0 0 / 100% 100% 0 0",
          transform: "scaleX(1.5)",
          bottom: "-30%",
          left: 0,
          right: 0,
        }}
      />

      <div className="relative z-10 flex flex-col justify-center h-full px-12 text-white">
        <div className="container mx-auto">
          <h1 className="text-5xl font-bold mb-2">Bienvenida {name}</h1>
          <p className="text-xl">Encuentra el tutor para ti</p>
        </div>

      </div>
    </div>
  );
};

export default WelcomeBanner;
