// src/Components/BoxSubject.js
import React from 'react';
import'../Style/BoxSubject.css'

const BoxSubject = () => {
  return (
    <div>
      <div className='boxSubject'>
        <div className='titulo'>
          <h1>Código materia</h1>
          <h2>Nombre Materia</h2>
        </div>
        <div className='inferior'>
          <p>Encuentra tutores para esta materia  -&gt; </p>
        </div>
      </div>
    </div>
  );
}

export default BoxSubject;