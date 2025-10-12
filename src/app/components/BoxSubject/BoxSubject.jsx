// src/Components/BoxSubject.js
import React from 'react';
import'./BoxSubject.css'
import { MoveRight } from 'lucide-react';
import { useFavorites } from '../../hooks/useFavorites';
import FavoriteButton from '../FavoriteButton/FavoriteButton';

const BoxSubject = ({codigo, nombre, courseId, onSubjectClick}) => {
  const { isCourseFavorite, toggleCourseFavorite } = useFavorites();
  
  const isFavorite = courseId ? isCourseFavorite(courseId) : false;
  
  const handleFavoriteClick = (e) => {
    e.stopPropagation(); // Evitar que se active el click del contenedor
    if (courseId) {
      toggleCourseFavorite(courseId);
    }
  };

  const handleSubjectClick = () => {
    if (onSubjectClick) {
      onSubjectClick({ codigo, nombre, courseId });
    }
  };

  return (
    <div>
      <div className='boxSubject' onClick={handleSubjectClick}>
        <div className='titulo'>
          <div className='subject-header'>
            <div>
              <h2 className='h2-card'>{codigo}</h2>
              <h1 className='h1-card'>{nombre}</h1>
            </div>
            {courseId && (
              <FavoriteButton
                isFavorite={isFavorite}
                onClick={handleFavoriteClick}
                size="icon-only"
                showText={false}
              />
            )}
          </div>
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