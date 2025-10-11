'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/SecureAuthContext';
import FavoritesService from '../services/FavoritesService';

export function useFavorites() {
    const { user } = useAuth();
    const [favorites, setFavorites] = useState({
        courses: [],
        tutors: []
    });
    const [favoriteCourseIds, setFavoriteCourseIds] = useState(new Set());
    const [favoriteTutorIds, setFavoriteTutorIds] = useState(new Set());
    const [loading, setLoading] = useState(false);

    // Cargar favoritos desde Firebase
    const loadFavorites = useCallback(async () => {
        if (!user.isLoggedIn || !user.email) {
            setFavorites({ courses: [], tutors: [] });
            setFavoriteCourseIds(new Set());
            setFavoriteTutorIds(new Set());
            return;
        }

        setLoading(true);
        try {
            const favoritesData = await FavoritesService.getFavorites(user.email);
            setFavorites(favoritesData);
            
            // Crear sets de IDs para búsqueda rápida
            const courseIds = new Set(favoritesData.courses.map(course => course.id));
            const tutorIds = new Set(favoritesData.tutors.map(tutor => tutor.id));
            
            setFavoriteCourseIds(courseIds);
            setFavoriteTutorIds(tutorIds);
        } catch (error) {
            console.error('Error loading favorites:', error);
        } finally {
            setLoading(false);
        }
    }, [user.isLoggedIn, user.email]);

    // Cargar favoritos al montar el componente o cambiar usuario
    useEffect(() => {
        loadFavorites();
    }, [loadFavorites]);

    // Toggle favorito de materia
    const toggleCourseFavorite = useCallback(async (courseId) => {
        if (!user.isLoggedIn || !user.email) return;

        const isCurrentlyFavorite = favoriteCourseIds.has(courseId);
        
        try {
            await FavoritesService.toggleCourseFavorite(user.email, courseId, isCurrentlyFavorite);
            
            // Actualizar estado local inmediatamente para feedback visual rápido
            if (isCurrentlyFavorite) {
                setFavoriteCourseIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(courseId);
                    return newSet;
                });
            } else {
                setFavoriteCourseIds(prev => new Set(prev).add(courseId));
            }
            
            // Recargar la lista completa de favoritos para mantener sincronización
            await loadFavorites();
            
        } catch (error) {
            console.error('Error toggling course favorite:', error);
            // Revertir el cambio local si hay error
            await loadFavorites();
        }
    }, [user.isLoggedIn, user.email, favoriteCourseIds, loadFavorites]);

    // Toggle favorito de tutor
    const toggleTutorFavorite = useCallback(async (tutorId) => {
        if (!user.isLoggedIn || !user.email) return;

        const isCurrentlyFavorite = favoriteTutorIds.has(tutorId);
        
        try {
            await FavoritesService.toggleTutorFavorite(user.email, tutorId, isCurrentlyFavorite);
            
            // Actualizar estado local inmediatamente para feedback visual rápido
            if (isCurrentlyFavorite) {
                setFavoriteTutorIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(tutorId);
                    return newSet;
                });
            } else {
                setFavoriteTutorIds(prev => new Set(prev).add(tutorId));
            }
            
            // Recargar la lista completa de favoritos para mantener sincronización
            await loadFavorites();
            
        } catch (error) {
            console.error('Error toggling tutor favorite:', error);
            // Revertir el cambio local si hay error
            await loadFavorites();
        }
    }, [user.isLoggedIn, user.email, favoriteTutorIds, loadFavorites]);

    // Verificar si una materia es favorita
    const isCourseFavorite = useCallback((courseId) => {
        return favoriteCourseIds.has(courseId);
    }, [favoriteCourseIds]);

    // Verificar si un tutor es favorito
    const isTutorFavorite = useCallback((tutorId) => {
        return favoriteTutorIds.has(tutorId);
    }, [favoriteTutorIds]);

    // Obtener total de favoritos para mostrar en header
    const getFavoritesCount = useCallback(() => {
        return favorites.courses.length + favorites.tutors.length;
    }, [favorites]);

    return {
        favorites,
        loading,
        toggleCourseFavorite,
        toggleTutorFavorite,
        isCourseFavorite,
        isTutorFavorite,
        getFavoritesCount,
        refetchFavorites: loadFavorites
    };
}

export default useFavorites;