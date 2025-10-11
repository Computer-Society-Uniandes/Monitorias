'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { TutorSearchService } from '../../services/TutorSearchService';
import { FavoritesService } from '../../services/FavoritesService';
import { useUser } from '../../hooks/useUser';
import { useDebounce } from '../../hooks/useDebounce';
import TutorCard from '../../components/TutorCard/TutorCard';
import SubjectCard from '../../components/SubjectCard/SubjectCard';
import { Input } from '../../../components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Search } from 'lucide-react';
import TutorAvailabilityCard from '../../components/TutorAvailabilityCard/TutorAvailabilityCard';

function BuscarTutoresContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { email: userEmail } = useUser();

    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const debouncedSearch = useDebounce(searchTerm, 300);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    // Por defecto mostrar materias en la búsqueda
    const [searchType, setSearchType] = useState('subjects'); // 'tutors' or 'subjects'
    const [favoriteTutors, setFavoriteTutors] = useState([]);
    const [favoriteCourses, setFavoriteCourses] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [tutorsForSubject, setTutorsForSubject] = useState([]);
    const [loadingTutors, setLoadingTutors] = useState(false);
    // Por defecto la pestaña activa será 'materias'
    const [activeTab, setActiveTab] = useState('materias'); // 'tutores', 'materias', 'ambos'
    const currentSearchParams = searchParams.toString();

    // Cargar favoritos
    useEffect(() => {
        if (userEmail) {
            loadFavorites();
        }
    }, [userEmail]);

    const loadDefaultResults = useCallback(async () => {
        try {
            setLoading(true);

            if (activeTab === 'tutores') {
                const tutors = await TutorSearchService.getAllTutors();
                setResults(tutors);
                setSearchType('tutors');
            } else if (activeTab === 'materias') {
                const subjects = await TutorSearchService.getMaterias();
                setResults(subjects);
                setSearchType('subjects');
            } else {
                const subjects = await TutorSearchService.getMaterias();
                setResults(subjects);
                setSearchType('subjects');
            }
        } catch (error) {
            console.error('Error cargando resultados:', error);
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    const performSearch = useCallback(async () => {
        if (!debouncedSearch) {
            return;
        }

        try {
            setLoading(true);

            if (activeTab === 'tutores') {
                const tutors = await TutorSearchService.searchTutors(debouncedSearch);
                setResults(tutors);
                setSearchType('tutors');
            } else if (activeTab === 'materias') {
                const allSubjects = await TutorSearchService.getMaterias();
                const filteredSubjects = allSubjects.filter(subject =>
                    subject.nombre.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                    subject.codigo.toLowerCase().includes(debouncedSearch.toLowerCase())
                );
                setResults(filteredSubjects);
                setSearchType('subjects');
            } else {
                const tutors = await TutorSearchService.searchTutors(debouncedSearch);

                if (tutors.length > 0) {
                    setResults(tutors);
                    setSearchType('tutors');
                } else {
                    const allSubjects = await TutorSearchService.getMaterias();
                    const filteredSubjects = allSubjects.filter(subject =>
                        subject.nombre.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                        subject.codigo.toLowerCase().includes(debouncedSearch.toLowerCase())
                    );
                    setResults(filteredSubjects);
                    setSearchType('subjects');
                }
            }
        } catch (error) {
            console.error('Error en búsqueda:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, [activeTab, debouncedSearch]);

    // Búsqueda y resultados por defecto según el estado del buscador
    useEffect(() => {
        if (debouncedSearch) {
            performSearch();
        } else if (!searchTerm) {
            loadDefaultResults();
        }
    }, [debouncedSearch, searchTerm, loadDefaultResults, performSearch]);

    // Actualizar query params
    useEffect(() => {
        const params = new URLSearchParams(currentSearchParams);

        if (searchTerm) {
            params.set('search', searchTerm);
        } else {
            params.delete('search');
        }

        const nextQuery = params.toString();

        if (nextQuery === currentSearchParams) {
            return;
        }

        const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
        router.replace(nextUrl, { scroll: false });
    }, [searchTerm, router, pathname, currentSearchParams]);

    const loadFavorites = async () => {
        try {
            const result = await FavoritesService.getFavorites(userEmail);
            if (result.success && result.data) {
                setFavoriteTutors(result.data.tutors || []);
                setFavoriteCourses(result.data.courses || []);
            }
        } catch (error) {
            console.error('Error cargando favoritos:', error);
        }
    };

    const handleToggleFavoriteTutor = async (tutorEmail) => {
        if (!userEmail) return;
        try {
            await FavoritesService.toggleFavoriteTutor(userEmail, tutorEmail);
            await loadFavorites();
        } catch (error) {
            console.error('Error toggle favorito:', error);
        }
    };

    const handleToggleFavoriteCourse = async (courseCode) => {
        if (!userEmail) {
            console.warn('Usuario no autenticado, no se puede modificar favoritos.');
            return;
        }
        try {
            console.log('Toggling favorite course:', courseCode);
            await FavoritesService.toggleFavoriteCourse(userEmail, courseCode);
            await loadFavorites();
        } catch (error) {
            console.error('Error toggle favorito:', error);
        }
    };

    const handleFindTutor = async (subject) => {
        try {
            setLoadingTutors(true);
            setSelectedSubject(subject);
            const tutors = await TutorSearchService.getTutorsBySubject(subject.nombre);
            setTutorsForSubject(tutors);
        } catch (error) {
            console.error('Error cargando tutores:', error);
            setTutorsForSubject([]);
        } finally {
            setLoadingTutors(false);
        }
    };

    const handleBackToSubjects = () => {
        setSelectedSubject(null);
        setTutorsForSubject([]);
    };

    const isFavoriteTutor = (email) => favoriteTutors.includes(email);
    const isFavoriteCourse = (code) => favoriteCourses.includes(code);

    // Vista de tutores para una materia específica
    if (selectedSubject) {
        return (
            <div className="min-h-screen bg-white">
                <div className="max-w-5xl mx-auto px-6 py-8">
                    <button
                        onClick={handleBackToSubjects}
                        className="text-gray-600 hover:text-gray-900 mb-6 flex items-center gap-2"
                    >
                        ← Volver a materias
                    </button>

                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">
                            Tutores para {selectedSubject.nombre}
                        </h1>
                        
                        <button
                            onClick={() => router.push(`/joint-availability?subject=${encodeURIComponent(selectedSubject.nombre)}`)}
                            className="bg-gradient-to-r from-[#FDAE1E] to-[#FF9505] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Ver Disponibilidad Conjunta
                        </button>
                    </div>

                    {loadingTutors ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF8C00] mx-auto"></div>
                            <p className="mt-4 text-gray-600">Cargando tutores...</p>
                        </div>
                    ) : tutorsForSubject.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-600">No hay tutores disponibles para esta materia.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {tutorsForSubject.map((tutor) => (
                                <TutorAvailabilityCard
                                    key={tutor.id}
                                    tutor={tutor}
                                    materia={selectedSubject.nombre}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-5xl mx-auto px-6 py-8">
                {/* Búsqueda */}
                <div className="mb-8">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <Input
                            type="text"
                            placeholder="Buscar tutores o materias"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={() => setActiveTab('materias')}
                            className="pl-12 py-6 text-base bg-[#FEF9F6] border-0 rounded-lg focus:ring-2 focus:ring-[#FF8C00]"
                        />
                    </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                    <TabsList className="grid w-full max-w-md grid-cols-3">
                        <TabsTrigger value="tutores">Tutores</TabsTrigger>
                        <TabsTrigger value="materias">Materias</TabsTrigger>
                        <TabsTrigger value="ambos">Ambos</TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Resultados */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF8C00] mx-auto"></div>
                        <p className="mt-4 text-gray-600">Buscando...</p>
                    </div>
                ) : results.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600">
                            {searchTerm ? 'No se encontraron resultados.' : 'Comienza buscando tutores o materias.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {searchType === 'tutors' ? (
                            // Mostrar tutores
                            results.map((tutor, index) => (
                                <TutorCard
                                    key={tutor.id || index}
                                    tutor={tutor}
                                    isFavorite={isFavoriteTutor(tutor.email)}
                                    onBookNow={() => {
                                        // Abrir modal de disponibilidad o navegar
                                        console.log('Book tutor:', tutor);
                                    }}
                                    onToggleFavorite={() => handleToggleFavoriteTutor(tutor.email)}
                                />
                            ))
                        ) : (
                            // Mostrar materias
                            results.map((subject, index) => (
                                <SubjectCard
                                    key={subject.codigo || index}
                                    subject={subject}
                                    isFavorite={isFavoriteCourse(subject.codigo)}
                                    onFindTutor={() => handleFindTutor(subject)}
                                    onToggleFavorite={() => handleToggleFavoriteCourse(subject.codigo)}
                                />
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function BuscarTutores() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white">
                <div className="max-w-5xl mx-auto px-6 py-8">
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF8C00] mx-auto"></div>
                        <p className="mt-4 text-gray-600">Cargando...</p>
                    </div>
                </div>
            </div>
        }>
            <BuscarTutoresContent />
        </Suspense>
    );
}
