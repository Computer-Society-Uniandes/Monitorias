'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/SecureAuthContext';
import { FavoritesService } from '../services/core/FavoritesService';

export function useFavorites() {
    const { user } = useAuth();
    const [favorites, setFavorites] = useState({
        courses: [],
        tutors: []
    });
    const [favoriteCourseIds, setFavoriteCourseIds] = useState(new Set());
    const [favoriteTutorIds, setFavoriteTutorIds] = useState(new Set());
    const [loading, setLoading] = useState(false);

    // Cargar favoritos desde localStorage (now frontend-only)
    const loadFavorites = useCallback(async () => {
        if (!user.isLoggedIn) {
            setFavorites({ courses: [], tutors: [] });
            setFavoriteCourseIds(new Set());
            setFavoriteTutorIds(new Set());
            return;
        }

        setLoading(true);
        try {
            // Get enriched favorites data (fetches from backend API when needed)
            const favoritesData = await FavoritesService.getFavorites(user.email);
            setFavorites(favoritesData);
            
            // Also get the raw IDs for quick lookups
            const courseIds = new Set(FavoritesService.getFavoriteCourseIds());
            const tutorIds = new Set(FavoritesService.getFavoriteTutorIds());
            
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
        
        // Listen for favorites updates from other components/tabs
        const handleFavoritesUpdate = () => {
            loadFavorites();
        };
        
        window.addEventListener('favorites-updated', handleFavoritesUpdate);
        window.addEventListener('storage', handleFavoritesUpdate); // Listen for changes from other tabs
        
        return () => {
            window.removeEventListener('favorites-updated', handleFavoritesUpdate);
            window.removeEventListener('storage', handleFavoritesUpdate);
        };
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
    const toggleTutorFavorite = useCallback(async (tutorIdOrTutor) => {
        if (!user.isLoggedIn || !user.email) return;

        // Normalize tutorId - handle both string and object
        const tutorId = typeof tutorIdOrTutor === 'object' 
            ? (tutorIdOrTutor?.uid || tutorIdOrTutor?.id || tutorIdOrTutor?.email)
            : tutorIdOrTutor;
        
        if (!tutorId) {
            console.warn('toggleTutorFavorite: No valid tutor ID provided', tutorIdOrTutor);
            return;
        }

        const isCurrentlyFavorite = favoriteTutorIds.has(tutorId);
        
        try {
            // Pass the normalized ID directly (FavoritesService handles it internally)
            // Note: toggleFavoriteTutor expects (userEmail, tutorId, active) for backwards compatibility
            // but userEmail is not actually used
            await FavoritesService.toggleFavoriteTutor(user.email, tutorId, isCurrentlyFavorite);
            
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
    // Checks against the normalized tutorId (uid || id || email)
    const isTutorFavorite = useCallback((tutorIdOrTutor) => {
        // Normalize tutorId - handle both string and object
        const tutorId = typeof tutorIdOrTutor === 'object' 
            ? (tutorIdOrTutor?.uid || tutorIdOrTutor?.id || tutorIdOrTutor?.email)
            : tutorIdOrTutor;
        
        if (!tutorId) return false;
        
        // Direct check in Set (fastest)
        if (favoriteTutorIds.has(tutorId)) return true;
        
        // Also check using FavoritesService for consistency
        return FavoritesService.isTutorFavorite(tutorId);
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