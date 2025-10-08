'use client';

import React from 'react';
import { Button } from '../../../components/ui/button';
import { Heart } from 'lucide-react';

/**
 * TutorCard - Card de tutor según diseño de Calendly
 * @param {Object} tutor - Datos del tutor
 * @param {boolean} isFavorite - Si el tutor está en favoritos
 * @param {Function} onBookNow - Callback al hacer click en "Book Now"
 * @param {Function} onToggleFavorite - Callback al hacer click en favorito
 */
export default function TutorCard({ tutor, isFavorite = false, onBookNow, onToggleFavorite }) {
    const getInitials = (name) => {
        if (!name) return 'T';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return parts[0][0] + parts[1][0];
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <div className="bg-[#FEF9F6] rounded-lg p-6 flex items-start gap-6 hover:shadow-md transition-shadow">
            {/* Contenido izquierdo */}
            <div className="flex-1">
                {/* Nombre y Rating */}
                <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">{tutor.name || 'Tutor'}</h3>
                    {tutor.rating && (
                        <div className="flex items-center gap-1">
                            <span className="text-lg">{tutor.rating.toFixed(1)}</span>
                            <span className="text-yellow-500">★</span>
                        </div>
                    )}
                </div>

                {/* Descripción */}
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                    {tutor.bio ||
                     (tutor.subjects && tutor.subjects.length > 0
                         ? `Tutor experimentado especializado en ${tutor.subjects.slice(0, 2).join(' y ')}. Historial comprobado ayudando a estudiantes a alcanzar el éxito académico.`
                         : 'Tutor experimentado dedicado a ayudar a estudiantes a alcanzar sus metas académicas.')}
                </p>

                {/* Botones */}
                <div className="flex items-center gap-3">
                    <Button
                        onClick={onBookNow}
                        className="bg-[#FF8C00] hover:bg-[#FF7A00] text-white px-6 py-2 rounded-full font-medium shadow-sm"
                    >
                        Ver disponibilidad
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={onToggleFavorite}
                        className="flex items-center gap-2 text-gray-700 hover:text-gray-900 px-4 py-2 rounded-full border border-gray-300 hover:border-gray-400"
                    >
                        <Heart
                            className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`}
                        />
                        Favorito
                    </Button>
                </div>
            </div>

            {/* Avatar derecho - más rectangular */}
            <div className="flex-shrink-0">
                <div className="w-40 h-28 rounded-lg bg-gradient-to-br from-orange-200 to-pink-200 flex items-center justify-center overflow-hidden">
                    {tutor.profileImage ? (
                        <img
                            src={tutor.profileImage}
                            alt={tutor.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="text-3xl font-bold text-white">
                            {getInitials(tutor.name)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
