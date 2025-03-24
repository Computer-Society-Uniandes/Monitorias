// src/Components/BoxSubject.js
import React from 'react';
import'../Style/BoxSubject.css'

const BoxSubject = ({codigo, nombre}) => {
  return (
    <div>
      <div className='boxSubject'>
        <div className='titulo w-full'>
          <h1 className='h1-card'>{codigo}</h1>
          <h2 className='h2-card text-lg'>{nombre}</h2>
        </div>
        <div className='inferior'>
          <p className='p-card'>Encuentra tutores para esta materia  -&gt; </p>
        </div>
      </div>
    </div>
  );
}

export default BoxSubject;