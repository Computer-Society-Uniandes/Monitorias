import React from "react";
import "../Style/BoxNewSubject.css";

const BoxNewSubject = ({name, number}) => {
  return (
    <div className="card-ingenieria">
      <div className="card-ingenieria-left">
        {/* Ícono de bombilla (SVG) */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />

        <span 
            className="material-symbols-outlined"
            style={{ fontSize: "60px", color: "#1A237E" }}
            >
            emoji_objects
        </span>

        <div className="card-ingenieria-text">
          <div className="card-ingenieria-title">
            {name}
          </div>
          <div className="card-ingenieria-subtitle">
            {number} tutores
          </div>
        </div>
      </div>

      {/* Flecha a la Derecha (SVG) */}
      <svg 
        width="50" 
        height="50" 
        viewBox="0 0 24 24"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="card-ingenieria-arrow"
      >
        <path 
          d="M13 6L19 12L13 18" 
          stroke="#1A237E" 
          strokeWidth="1" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <path 
          d="M5 12H19" 
          stroke="#1A237E" 
          strokeWidth="1" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export default BoxNewSubject;
