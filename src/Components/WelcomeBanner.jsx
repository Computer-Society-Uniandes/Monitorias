// src/Components/WelcomeBanner.jsx
import React from 'react'
import { useState, useEffect } from "react"

const WelcomeBanner = ({ titulo = "Bienvenido/a", imagenCarga }) => {
const [imageLoaded, setImageLoaded] = useState(false)

  // Reset image loaded state when imagenCarga changes
  useEffect(() => {
    setImageLoaded(false)
  }, [])
  return (
    <div className="relative w-full h-[300px] bg-gradient-to-r from-[#7577b0] to-[#4a5ad8] text-white flex items-center justify-start px-8">
      {/* Onda (wave) en la parte inferior */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
        <svg
          className="w-full h-20"
          viewBox="0 0 500 150"
          preserveAspectRatio="none"
        >
          <path
            d="M0.00,49.98 C150.00,150.00 350.00,-50.00 500.00,49.98 L500.00,150.00 L0.00,150.00 Z"
            fill="#4a5ad8"
          />
        </svg>
      </div>

      {/* Contenido del banner */}
      <div className="relative z-10 mt-4">
        {/* Título */}
        <h1 className="text-5xl md:text-6xl font-bold mb-2">
          Bienvenid@ {titulo}
        </h1>
        <p className="text-xl md:text-2xl">Encuentra el tutor para ti</p>
      </div>
    </div>
  )
}

export default WelcomeBanner
