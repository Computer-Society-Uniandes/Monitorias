'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { useFavorites } from '../../hooks/useFavorites';
import FavoriteButton from '../FavoriteButton/FavoriteButton';
import routes from '../../../routes';
import './ModernTutorCard.css';

export default function ModernTutorCard({ tutor, course, onReservar, onFavorite }) {
    const { isTutorFavorite, toggleTutorFavorite } = useFavorites();
    
    // Normalize tutor ID - use same format as stored in favorites (uid || id || email)
    const tutorId = tutor?.uid || tutor?.id || tutor?.email || null;
    
    const isFavorite = tutorId ? isTutorFavorite(tutorId) : false;

    const handleBookNow = () => {
        if (onReservar) {
            onReservar(tutor);
        }
    };

    const handleFavorite = async () => {
        if (tutorId) {
            await toggleTutorFavorite(tutorId);
        }
        
        if (onFavorite) {
            onFavorite(tutor);
        }
    };

    return (
        <div className="modern-tutor-card">
            <div className="tutor-content">
                <div className="tutor-details">
                    <div className="tutor-header">
                        <h3 className="tutor-name">{tutor.name || 'Tutor'}</h3>
                        <div className="tutor-rating">
                            <Star className="star-icon" fill="currentColor" />
                            <span className="rating-value">{tutor.rating || 4.5}</span>
                            <span className="star-symbol">★</span>
                        </div>
                    </div>
                    
                    <p className="tutor-description">
                        {tutor.description || 
                         `Experienced tutor specializing in ${course || 'various courses'}. Proven track record of helping students achieve academic success.`}
                    </p>
                    
                    <div className="tutor-actions">
                        <button 
                            className="book-now-btn"
                            onClick={handleBookNow}
                        >
                            Reservar
                        </button>
                        <FavoriteButton
                            isFavorite={isFavorite}
                            onClick={handleFavorite}
                        />
                    </div>
                </div>
                
                <div className="tutor-avatar-section">
                    <div className="tutor-avatar">
                        {tutor.avatarUrl ? (
                            <img 
                                src={tutor.avatarUrl} 
                                alt={tutor.name}
                                className="avatar-image"
                            />
                        ) : (
                            <div className="avatar-placeholder">
                                <span className="avatar-initials">
                                    {(tutor.name || 'T').charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}