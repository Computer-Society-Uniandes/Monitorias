// src/Components/BoxSubject.js
import React from 'react';
import'../Style/BoxSubject.css'
import { MoveRight } from 'lucide-react';

const BoxSubject = ({codigo, nombre}) => {
  return (
    <div>
      <div className='boxSubject'>
        <div className='titulo'>
          <h2 className='h2-card'>{codigo}</h2>
          <h1 className='h1-card'>{nombre}</h1>
        </div>
        <div className='inferior'>
          <p className='p-card'>Encuentra tutores para esta materia </p>
          <MoveRight className='ml-3' />
        </div>
      </div>
    </div>
  );
}

export default BoxSubject;