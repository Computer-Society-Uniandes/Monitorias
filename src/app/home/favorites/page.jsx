'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TutorSearchService } from '../../services/TutorSearchService';
import { FavoritesService } from '../../services/FavoritesService';
import { useUser } from '../../hooks/useUser';
import SubjectCard from '../../components/SubjectCard/SubjectCard';
import TutorCard from '../../components/TutorCard/TutorCard';
import { Input } from '../../../components/ui/input';
import { Search } from 'lucide-react';
import routes from '../../../routes';

export default function Favorites() {
    const router = useRouter();
    const { email: userEmail, loading: authLoading } = useUser();

    const [favoriteTutorsData, setFavoriteTutorsData] = useState([]);
    const [favoriteCoursesData, setFavoriteCoursesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!authLoading && userEmail) {
            loadFavorites();
        } else if (!authLoading && !userEmail) {
            router.push(routes.LOGIN);
        }
    }, [userEmail, authLoading, router]);

    const loadFavorites = async () => {
        try {
            setLoading(true);

            // Obtener IDs de favoritos
            const favoritesResult = await FavoritesService.getFavorites(userEmail);

            if (!favoritesResult.success || !favoritesResult.data) {
                setFavoriteTutorsData([]);
                setFavoriteCoursesData([]);
                return;
            }

            const { tutors: tutorIds, courses: courseIds } = favoritesResult.data;

            // Cargar datos completos de tutores favoritos
            if (tutorIds.length > 0) {
                const allTutors = await TutorSearchService.getAllTutors();
                const tutorsData = allTutors.filter(tutor => tutorIds.includes(tutor.email));
                setFavoriteTutorsData(tutorsData);
            } else {
                setFavoriteTutorsData([]);
            }

            // Cargar datos completos de cursos favoritos
            if (courseIds.length > 0) {
                const allCourses = await TutorSearchService.getMaterias();
                const coursesData = allCourses.filter(course => courseIds.includes(course.codigo));
                setFavoriteCoursesData(coursesData);
            } else {
                setFavoriteCoursesData([]);
            }
        } catch (error) {
            console.error('Error cargando favoritos:', error);
        } finally {
            setLoading(false);
        }
    };

    const removeFavoriteTutor = async (tutorEmail) => {
        try {
            const result = await FavoritesService.removeFavoriteTutor(userEmail, tutorEmail);
            if (result.success) {
                await loadFavorites();
            }
        } catch (error) {
            console.error('Error removiendo tutor favorito:', error);
        }
    };

    const removeFavoriteCourse = async (courseCode) => {
        try {
            const result = await FavoritesService.removeFavoriteCourse(userEmail, courseCode);
            if (result.success) {
                await loadFavorites();
            }
        } catch (error) {
            console.error('Error removiendo materia favorita:', error);
        }
    };

    const findTutorForCourse = async (subject) => {
        router.push(`${routes.SEARCH_TUTORS}?search=${encodeURIComponent(subject.nombre)}`);
    };

    const handleBookTutor = (tutor) => {
        router.push(`${routes.SEARCH_TUTORS}?search=${encodeURIComponent(tutor.name)}`);
    };

    const filteredSubjects = favoriteCoursesData.filter(subject =>
        subject.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredTutors = favoriteTutorsData.filter(tutor =>
        tutor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tutor.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-white">
                <div className="max-w-5xl mx-auto px-6 py-8">
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF8C00] mx-auto"></div>
                        <p className="mt-4 text-gray-600">Cargando favoritos...</p>
                    </div>
                </div>
            </div>
        );
    }

    const hasAnyFavorites = favoriteCoursesData.length > 0 || favoriteTutorsData.length > 0;

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-5xl mx-auto px-6 py-8">
                    {/* Búsqueda */}
                    {hasAnyFavorites && (
                        <div className="mb-8">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <Input
                                    type="text"
                                    placeholder="Buscar materias o tutores"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-12 py-6 text-base bg-[#FEF9F6] border-0 rounded-lg focus:ring-2 focus:ring-[#FF8C00]"
                                />
                            </div>
                        </div>
                    )}

                    {/* Sin favoritos */}
                    {!hasAnyFavorites && (
                        <div className="text-center py-16">
                            <div className="text-6xl mb-4">❤️</div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Aún no tienes favoritos</h2>
                            <p className="text-gray-600 mb-6">
                                Comienza agregando tus tutores y materias favoritas para acceder a ellos rápidamente
                            </p>
                            <button
                                onClick={() => router.push(routes.SEARCH_TUTORS)}
                                className="bg-[#FF8C00] hover:bg-[#FF7A00] text-white px-8 py-3 rounded-full font-medium"
                            >
                                Explorar Tutores
                            </button>
                        </div>
                    )}

                    {/* Materias Favoritas */}
                    {filteredSubjects.length > 0 && (
                        <div className="space-y-4">
                            {filteredSubjects.map((subject, index) => (
                                <SubjectCard
                                    key={subject.codigo || index}
                                    subject={subject}
                                    isFavorite={true}
                                    onFindTutor={() => findTutorForCourse(subject)}
                                    onToggleFavorite={() => removeFavoriteCourse(subject.codigo)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Tutores Favoritos */}
                    {filteredTutors.length > 0 && (
                        <div className={`space-y-4 ${filteredSubjects.length > 0 ? 'mt-8' : ''}`}>
                            {filteredTutors.map((tutor, index) => (
                                <TutorCard
                                    key={tutor.id || index}
                                    tutor={tutor}
                                    isFavorite={true}
                                    onBookNow={() => handleBookTutor(tutor)}
                                    onToggleFavorite={() => removeFavoriteTutor(tutor.email)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Sin resultados de búsqueda */}
                    {hasAnyFavorites && searchTerm && filteredSubjects.length === 0 && filteredTutors.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-600">No se encontraron favoritos que coincidan con tu búsqueda.</p>
                        </div>
                    )}
                </div>
            </div>
        );
}
