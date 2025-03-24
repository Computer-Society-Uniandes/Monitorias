// src/Components/Welcome.js
import React from 'react';

const Welcome = () => {
  // Leer info de localStorage (si deseas)
  const userUid = localStorage.getItem("userUid");
  const userEmail = localStorage.getItem("userEmail");

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold mb-4">¡Bienvenido!</h1>
      {userUid && (
        <p className="text-xl">
          UID: {userUid} <br/>
          Email: {userEmail}
        </p>
      )}
    </div>
  );
}

export default Welcome;
