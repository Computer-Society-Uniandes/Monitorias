'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import './FavoriteButton.css';

/**
 * Componente de botón de favorito unificado
 * @param {boolean} isFavorite - Si el elemento está marcado como favorito
 * @param {function} onClick - Función callback al hacer click
 * @param {string} size - Tamaño del botón: 'default', 'sm', 'icon-only'
 * @param {string} className - Clases CSS adicionales
 * @param {boolean} showText - Si mostrar el texto "Favorito"
 * @param {boolean} disabled - Si el botón está deshabilitado
 */
export default function FavoriteButton({ 
    isFavorite = false, 
    onClick, 
    size = 'default',
    className = '',
    showText = true,
    disabled = false,
    ...props 
}) {
    const getSizeClass = () => {
        switch (size) {
            case 'sm': return 'favorite-button-sm';
            case 'icon-only': return 'favorite-button-icon-only';
            default: return '';
        }
    };

    return (
        <button
            className={`favorite-button ${getSizeClass()} ${
                isFavorite ? 'favorite-active' : ''
            } ${className}`}
            onClick={onClick}
            disabled={disabled}
            aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            {...props}
        >
            <Heart 
                className="heart-icon" 
                fill={isFavorite ? 'currentColor' : 'none'}
            />
            {showText && size !== 'icon-only' && (
                <span>Favorito</span>
            )}
        </button>
    );
}