'use client';

import React from 'react';
import { Button } from '../../../components/ui/button';
import { useFavorites } from '../../hooks/useFavorites';
import FavoriteButton from '../FavoriteButton/FavoriteButton';

/**
 * SubjectCard - Card de materia según diseño de Calendly
 * @param {Object} subject - Datos de la materia
 * @param {boolean} isFavorite - Si la materia está en favoritos (se ignora, se usa el hook)
 * @param {Function} onFindTutor - Callback al hacer click en "Find Tutor"
 * @param {Function} onToggleFavorite - Callback al hacer click en favorito (se ignora, se usa el hook)
 */
export default function SubjectCard({ subject, isFavorite: _, onFindTutor, onToggleFavorite: __ }) {
    const { isCourseFavorite, toggleCourseFavorite } = useFavorites();
    
    // Usar el hook para determinar si es favorito
    const isFavorite = subject?.codigo ? isCourseFavorite(subject.codigo) : false;
    
    const handleToggleFavorite = async () => {
        if (subject?.codigo) {
            await toggleCourseFavorite(subject.codigo);
        }
    };

    // Colores de iconos según la materia (basado en las imágenes)
    const getIconColor = (index) => {
        const colors = [
            'from-pink-200 to-orange-100',      // Mathematics - rosa claro
            'from-teal-500 to-teal-600',         // Physics - verde azulado
            'from-blue-900 to-blue-800'          // English Literature - azul oscuro
        ];
        return colors[index % colors.length] || colors[0];
    };

    const getIconGradient = () => {
        if (subject.nombre?.toLowerCase().includes('matemática') || subject.nombre?.toLowerCase().includes('mathematics')) {
            return 'from-pink-200 to-orange-100';
        } else if (subject.nombre?.toLowerCase().includes('física') || subject.nombre?.toLowerCase().includes('physics')) {
            return 'from-teal-500 to-teal-600';
        } else if (subject.nombre?.toLowerCase().includes('inglés') || subject.nombre?.toLowerCase().includes('english')) {
            return 'from-blue-900 to-blue-800';
        }
        return 'from-pink-200 to-orange-100';
    };

    const formatPrice = (price) => {
        if (!price) return '';
        return price.toLocaleString('en-US', { minimumFractionDigits: 3 });
    };

    return (
        <div className="bg-[#FEF9F6] rounded-lg p-6 flex items-start gap-6 hover:shadow-md transition-shadow">
            {/* Contenido izquierdo */}
            <div className="flex-1">
                {/* Nombre y Precio */}
                <div className="flex items-baseline gap-2 mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">{subject.nombre || 'Materia'}</h3>
                    {subject.base_price && (
                        <span className="text-lg font-medium text-[#FF8C00]">
                            {formatPrice(subject.base_price)}
                        </span>
                    )}
                </div>

                {/* Descripción */}
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                    {subject.description ||
                     `No hay descripción disponible para ${subject.nombre || 'esta materia'}.`}
                </p>

                {/* Botones */}
                <div className="flex items-center gap-3">
                    <Button
                        onClick={onFindTutor}
                        className="bg-[#FF8C00] hover:bg-[#FF7A00] text-white px-6 py-2 rounded-full font-medium shadow-sm"
                    >
                        Buscar tutor
                    </Button>
                    <FavoriteButton
                        isFavorite={isFavorite}
                        onClick={handleToggleFavorite}
                    />
                </div>
            </div>

            {/* Icono derecho - más rectangular */}
            <div className="flex-shrink-0">
                <div className={`w-40 h-28 rounded-lg bg-gradient-to-br ${getIconGradient()} flex items-center justify-center`}>
                    {/* Icono de libro SVG */}
                    <svg
                        className="w-16 h-16 text-white stroke-current"
                        viewBox="0 0 100 100"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M20 25 L50 20 L50 75 L20 80 Z M80 25 L50 20 L50 75 L80 80 Z"
                            fill="currentColor"
                            fillOpacity="0.3"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M50 20 L50 75"
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                        <path
                            d="M20 25 L20 80 M80 25 L80 80"
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                    </svg>
                </div>
            </div>
        </div>
    );
}
