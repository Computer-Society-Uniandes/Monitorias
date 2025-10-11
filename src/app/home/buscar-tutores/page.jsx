'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { TutorSearchService } from '../../services/TutorSearchService';
import { useUser } from '../../hooks/useUser';
import { useDebounce } from '../../hooks/useDebounce';
import { useFavorites } from '../../hooks/useFavorites';
import TutorCard from '../../components/TutorCard/TutorCard';
import SubjectCard from '../../components/SubjectCard/SubjectCard';
import { Input } from '../../../components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Search } from 'lucide-react';
import TutorAvailabilityCard from '../../components/TutorAvailabilityCard/TutorAvailabilityCard';
import ModernTutorCard from '../../components/ModernTutorCard/ModernTutorCard';
import AvailabilityCalendar from '../../components/AvailabilityCalendar/AvailabilityCalendar';
import routes from '../../../routes';
import './BuscarTutores.css';

function BuscarTutoresContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { email: userEmail } = useUser();
    
    // Hook de favoritos
    const { isTutorFavorite, isCourseFavorite } = useFavorites();

    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const debouncedSearch = useDebounce(searchTerm, 300);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    // Por defecto mostrar materias en la búsqueda
    const [searchType, setSearchType] = useState('subjects'); // 'tutors' or 'subjects'
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [tutorsForSubject, setTutorsForSubject] = useState([]);
    const [loadingTutors, setLoadingTutors] = useState(false);
    const [showTutorView, setShowTutorView] = useState(false); // Vista de listado de tutores
    const [showIndividualCalendar, setShowIndividualCalendar] = useState(false); // Vista de calendario individual
    const [showJointCalendar, setShowJointCalendar] = useState(false); // Vista de calendario conjunto
    const [selectedSubjectForTutors, setSelectedSubjectForTutors] = useState(null); // Materia seleccionada para vista de tutores
    const [selectedTutorForCalendar, setSelectedTutorForCalendar] = useState(null); // Tutor seleccionado para calendario individual
    // Por defecto la pestaña activa será 'materias'
    const [activeTab, setActiveTab] = useState('materias'); // 'tutores', 'materias', 'ambos'
    const currentSearchParams = searchParams.toString();

    // Cargar favoritos - No necesario, se maneja por el hook useFavorites

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

    const handleFindTutor = async (subject) => {
        try {
            setLoadingTutors(true);
            setSelectedSubjectForTutors(subject);

            // Usar el nuevo método getTutorsBySubject para obtener tutores con información enriquecida
            const tutors = await TutorSearchService.getTutorsBySubject(subject.nombre);
            setTutorsForSubject(tutors);
            setShowTutorView(true); // Cambiar a la vista de tutores con título "Disponibilidad conjunta"
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
        setShowTutorView(false);
        setShowIndividualCalendar(false);
        setShowJointCalendar(false);
        setSelectedSubjectForTutors(null);
        setSelectedTutorForCalendar(null);
    };

    const handleReservarTutor = (tutor) => {
        setSelectedTutorForCalendar(tutor);
        setShowIndividualCalendar(true);
        setShowTutorView(false);
    };

    const handleDisponibilidadConjunta = () => {
        setShowJointCalendar(true);
        setShowTutorView(false);
    };

    const handleBackToTutorList = () => {
        setShowIndividualCalendar(false);
        setShowJointCalendar(false);
        setShowTutorView(true);
        setSelectedTutorForCalendar(null);
    };

    const handleTutorBookNow = (tutor) => {
        // Navegar directamente a la disponibilidad individual del tutor
        const params = new URLSearchParams({
            tutorId: tutor.email,
            tutorName: tutor.name || 'Tutor',
            ...(tutor.subjects && tutor.subjects.length > 0 && { subject: tutor.subjects[0] }),
            ...(tutor.location && { location: tutor.location }),
            ...(tutor.rating && { rating: tutor.rating.toString() })
        });
        
        router.push(`${routes.INDIVIDUAL_AVAILABILITY}?${params.toString()}`);
    };

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
                            onClick={() => router.push(`${routes.JOINT_AVAILABILITY}?subject=${encodeURIComponent(selectedSubject.nombre)}`)}
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
                {/* Vista de calendario individual */}
                {showIndividualCalendar ? (
                    <div className="min-h-screen bg-[#FFF8F0]">
                        {/* Header del calendario individual */}
                        <div className="bg-white rounded-lg shadow-sm mb-8 p-6">
                            <div className="flex items-center gap-4 mb-6">
                                <button 
                                    className="flex items-center justify-center w-10 h-10 rounded-lg border-2 border-[#FDAE1E] text-[#FF9505] hover:bg-[#FFF8F0] transition-all duration-300"
                                    onClick={handleBackToTutorList}
                                >
                                    ←
                                </button>
                                <div>
                                    <h1 className="text-3xl font-bold text-[#101F24]">Disponibilidad de {selectedTutorForCalendar?.name}</h1>
                                    <p className="text-[#6B7280] mt-1">{selectedSubjectForTutors?.nombre}</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Componente de calendario individual */}
                        <AvailabilityCalendar 
                            tutorId={selectedTutorForCalendar?.id || selectedTutorForCalendar?.email}
                            tutorName={selectedTutorForCalendar?.name}
                            subject={selectedSubjectForTutors?.nombre}
                            mode="individual"
                        />
                    </div>
                ) : showJointCalendar ? (
                    <div className="min-h-screen bg-[#FFF8F0]">
                        {/* Header del calendario conjunto */}
                        <div className="bg-white rounded-lg shadow-sm mb-8 p-6">
                            <div className="flex items-center gap-4 mb-6">
                                <button 
                                    className="flex items-center justify-center w-10 h-10 rounded-lg border-2 border-[#FDAE1E] text-[#FF9505] hover:bg-[#FFF8F0] transition-all duration-300"
                                    onClick={handleBackToTutorList}
                                >
                                    ←
                                </button>
                                <div>
                                    <h1 className="text-3xl font-bold text-[#101F24]">Disponibilidad Conjunta</h1>
                                    <p className="text-[#6B7280] mt-1">{selectedSubjectForTutors?.nombre} - Todos los tutores</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Componente de calendario conjunto */}
                        <AvailabilityCalendar 
                            subject={selectedSubjectForTutors?.nombre}
                            mode="joint"
                        />
                    </div>
                ) : showTutorView ? (
                    <div className="min-h-screen bg-[#FFF8F0]">
                        {/* Header de disponibilidad conjunta */}
                        <div className="bg-white rounded-lg shadow-sm mb-8">
                            <div className="p-6">
                                <div className="flex items-center gap-4 mb-6">
                                    <button 
                                        className="flex items-center justify-center w-10 h-10 rounded-lg border-2 border-[#FDAE1E] text-[#FF9505] hover:bg-[#FFF8F0] transition-all duration-300"
                                        onClick={handleBackToSubjects}
                                    >
                                        ←
                                    </button>
                                    <h1 className="text-3xl font-bold text-[#101F24]">Disponibilidad Conjunta</h1>
                                </div>
                                
                                {/* Botón de disponibilidad conjunta */}
                                <div className="flex justify-between items-center bg-[#FFF8F0] p-4 rounded-lg border-2 border-[#FDAE1E]/20">
                                    <div>
                                        <h3 className="text-lg font-semibold text-[#101F24]">Ver horarios combinados</h3>
                                        <p className="text-[#6B7280]">Disponibilidad de todos los tutores de {selectedSubjectForTutors?.nombre}</p>
                                    </div>
                                    <button 
                                        className="bg-gradient-to-r from-[#FDAE1E] to-[#FF9505] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                                        onClick={handleDisponibilidadConjunta}
                                    >
                                        Ver Disponibilidad Conjunta
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Lista de tutores */}
                        <div className="px-6">
                            {loadingTutors ? (
                                <div className="loading-state flex flex-col items-center justify-center py-16">
                                    <div className="w-12 h-12 border-4 border-[#FFF8F0] border-t-[#FDAE1E] rounded-full animate-spin mb-4"></div>
                                    <p className="text-[#101F24] text-lg">Cargando tutores...</p>
                                </div>
                            ) : tutorsForSubject.length === 0 ? (
                                <div className="empty-state flex flex-col items-center justify-center py-16 bg-white rounded-xl border-2 border-[#FDAE1E]/10">
                                    <div className="text-6xl mb-6">🔍</div>
                                    <h3 className="text-2xl font-bold text-[#101F24] mb-4">No hay tutores disponibles</h3>
                                    <p className="text-[#6B7280] text-lg max-w-md text-center">
                                        No hay tutores disponibles para {selectedSubjectForTutors?.nombre} en este momento.
                                    </p>
                                </div>
                            ) : (
                                <div className="tutors-list space-y-6">
                                    {tutorsForSubject.map((tutor, index) => (
                                        <ModernTutorCard
                                            key={`${tutor.email}-${index}`}
                                            tutor={tutor}
                                            subject={selectedSubjectForTutors?.nombre}
                                            onReservar={handleReservarTutor}
                                            onFavorite={(tutor) => console.log('Favorito:', tutor.name)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
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
                                            onBookNow={() => handleTutorBookNow(tutor)}
                                        />
                                    ))
                                ) : (
                                    // Mostrar materias
                                    results.map((subject, index) => (
                                        <SubjectCard
                                            key={subject.codigo || index}
                                            subject={subject}
                                            onFindTutor={() => handleFindTutor(subject)}
                                        />
                                    ))
                                )}
                            </div>
                        )}
                    </>
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
