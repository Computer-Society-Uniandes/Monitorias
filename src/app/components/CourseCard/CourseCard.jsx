'use client';

import React from 'react';
import { Button } from '../../../components/ui/button';
import { useFavorites } from '../../hooks/useFavorites';
import FavoriteButton from '../FavoriteButton/FavoriteButton';

/**
 * CourseCard - Card de materia según diseño de Calendly
 * @param {Object} course - Datos de la materia
 * @param {boolean} isFavorite - Si la materia está en favoritos (se ignora, se usa el hook)
 * @param {Function} onFindTutor - Callback al hacer click en "Find Tutor"
 * @param {Function} onToggleFavorite - Callback al hacer click en favorito (se ignora, se usa el hook)
 */
export default function CourseCard({ course, isFavorite: _, onFindTutor, onToggleFavorite: __ }) {
    const { isCourseFavorite, toggleCourseFavorite } = useFavorites();
    
    // Normalize course - handle both string and object formats
    // When course is a string, it's the name of the course
    // When course is an object, prioritize nombre/name over codigo
    const normalizedCourse = typeof course === 'string' 
        ? { nombre: course, codigo: course, name: course } 
        : course || {};
    
    // Get display name - always prioritize nombre/name over codigo
    const displayName = normalizedCourse?.nombre || normalizedCourse?.name || normalizedCourse?.codigo || 'Materia';
    
    // Get code for favorites (use codigo if available, otherwise use name)
    const courseCode = normalizedCourse?.codigo || normalizedCourse?.nombre || normalizedCourse?.name || '';
    
    // Usar el hook para determinar si es favorito
    const isFavorite = courseCode ? isCourseFavorite(courseCode) : false;
    
    const handleToggleFavorite = async () => {
        if (courseCode) {
            await toggleCourseFavorite(courseCode);
        }
    };

    // Get initials from course name - handle undefined/null cases
    const getInitials = () => {
        if (!displayName || displayName === 'undefined' || displayName === 'null') {
            return 'M'; // Default to 'M' for Materia
        }
        
        // Remove common prefixes and get first letters
        const cleanName = displayName.trim();
        const words = cleanName.split(/\s+/).filter(word => word.length > 0);
        
        if (words.length === 0) return 'M';
        
        if (words.length === 1) {
            // Single word - take first 2 characters
            return cleanName.substring(0, 2).toUpperCase();
        }
        
        // Multiple words - take first letter of first two words
        return (words[0][0] + words[1][0]).toUpperCase();
    };

    const getIconGradient = () => {
        const courseName = displayName.toLowerCase();
        if (courseName.includes('matemática') || courseName.includes('mathematics') || courseName.includes('calculo') || courseName.includes('álgebra')) {
            return 'from-pink-200 to-orange-100';
        } else if (courseName.includes('física') || courseName.includes('physics')) {
            return 'from-teal-500 to-teal-600';
        } else if (courseName.includes('inglés') || courseName.includes('english') || courseName.includes('literature')) {
            return 'from-blue-900 to-blue-800';
        } else if (courseName.includes('química') || courseName.includes('chemistry')) {
            return 'from-purple-400 to-purple-600';
        } else if (courseName.includes('biología') || courseName.includes('biology')) {
            return 'from-green-400 to-green-600';
        }
        return 'from-pink-200 to-orange-100';
    };

    const formatPrice = (price) => {
        if (!price) return '';
        return price.toLocaleString('en-US', { minimumFractionDigits: 4 });
    };

    const initials = getInitials();

    return (
    <div className="
        bg-[#FEF9F6]
        rounded-xl 
        p-6 
        max-w-[1100px]
        mx-auto
        flex 
        flex-col sm:flex-row 
        justify-between 
        items-center 
        gap-8
        hover:shadow-lg 
        transition-all 
        duration-300 
        border 
        border-orange-100/50
    ">

        {/* IZQUIERDA */}
        <div className="flex flex-col w-full sm:w-[65%]">

            <div className="flex flex-row items-baseline gap-2 mb-3">
                <h3 className="text-2xl font-semibold text-gray-900">
                    {displayName}
                </h3>

                {normalizedCourse?.base_price && (
                    <span className="text-lg font-medium text-[#A05E03]">
                        {formatPrice(normalizedCourse.base_price)}
                    </span>
                )}
            </div>

            <p className="text-gray-600 text-base mb-4 leading-relaxed">
                {normalizedCourse?.description ||
                 `Explore fundamental concepts and advanced topics in ${displayName.toLowerCase()}, from algebra to calculus.`}
            </p>

            <div className="flex items-center gap-4">
                <Button
                    onClick={onFindTutor}
                    className="bg-[#FF9500] hover:bg-[#FF8000] text-black px-6 py-2 rounded-full font-medium text-base"
                >
                    Find Tutor
                </Button>

                <FavoriteButton
                    isFavorite={isFavorite}
                    onClick={handleToggleFavorite}
                    size="md"
                    showText={true}
                    text="Favorite"
                    className="bg-[#F3EFEA] hover:bg-[#E5E0D8] text-black"
                />
            </div>
        </div>

        {/* DERECHA */}
        <div className="flex-shrink-0 w-[150px] h-[150px]">
            <div className={`w-full h-full rounded-lg bg-gradient-to-br ${getIconGradient()} flex items-center justify-center shadow-sm`}>
                
                <svg
                    className="w-14 h-14 text-white stroke-current"
                    viewBox="0 0 100 100"
                    fill="none"
                >
                    <path
                        d="M20 25 L50 20 L50 75 L20 80 Z M80 25 L50 20 L50 75 L80 80 Z"
                        fill="currentColor"
                        fillOpacity="0.3"
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                    <path d="M50 20 L50 75" strokeWidth="3" strokeLinecap="round" />
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
