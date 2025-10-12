'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Search } from 'lucide-react';
import { TutorSearchService } from '../../services/TutorSearchService';
import ModernTutorCard from '../../components/ModernTutorCard/ModernTutorCard';
import './FindTutorView.css';

export default function FindTutorView() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [tutors, setTutors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredTutors, setFilteredTutors] = useState([]);
    
    const subject = searchParams.get('subject');

    useEffect(() => {
        loadTutors();
    }, [subject]);

    useEffect(() => {
        filterTutors();
    }, [searchTerm, tutors]);

    const loadTutors = async () => {
        try {
            setLoading(true);
            let tutorData = [];
            
            if (subject) {
                // Buscar tutores por materia específica
                tutorData = await TutorSearchService.searchTutorsBySubject(subject);
            } else {
                // Cargar todos los tutores
                tutorData = await TutorSearchService.getAllTutors();
            }
            
            setTutors(tutorData);
            setFilteredTutors(tutorData);
        } catch (error) {
            console.error('Error loading tutors:', error);
            setTutors([]);
            setFilteredTutors([]);
        } finally {
            setLoading(false);
        }
    };

    const filterTutors = () => {
        if (!searchTerm.trim()) {
            setFilteredTutors(tutors);
            return;
        }

        const filtered = tutors.filter(tutor =>
            tutor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tutor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tutor.subjects?.some(sub => 
                sub.toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
        
        setFilteredTutors(filtered);
    };

    const handleBack = () => {
        router.back();
    };

    const handleAutoAssign = () => {
        // Implementar auto-asignación
        console.log('Auto-assign tutor');
    };

    return (
        <div className="find-tutor-container">
            {/* Header */}
            <div className="find-tutor-header">
                <div className="header-content">
                    <button 
                        className="back-button"
                        onClick={handleBack}
                    >
                        <ArrowLeft size={24} />
                    </button>
                    
                    <h1 className="page-title">Find a tutor</h1>
                </div>
                
                {/* Auto-Assign Section */}
                <div className="auto-assign-section">
                    <span className="auto-assign-label">Auto-Assign</span>
                    <button 
                        className="auto-assign-button"
                        onClick={handleAutoAssign}
                    >
                        <ArrowLeft size={20} className="auto-assign-arrow" />
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="search-section">
                <div className="search-container">
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Search for tutors or subjects"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="tutors-content">
                {loading ? (
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Loading tutors...</p>
                    </div>
                ) : filteredTutors.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🔍</div>
                        <h3>No tutors found</h3>
                        <p>
                            {searchTerm 
                                ? `No tutors match "${searchTerm}"`
                                : subject 
                                    ? `No tutors available for ${subject}`
                                    : 'No tutors available at the moment'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="tutors-list">
                        {filteredTutors.map((tutor, index) => (
                            <ModernTutorCard
                                key={tutor.id || tutor.email || index}
                                tutor={tutor}
                                subject={subject}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}