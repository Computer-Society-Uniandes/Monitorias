'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Users, BookOpen, ArrowLeft, AlertCircle } from 'lucide-react';
import AvailabilityCalendar from '../../components/AvailabilityCalendar/AvailabilityCalendar';
import './JointAvailability.css';

function JointAvailabilityContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const subject = searchParams.get('subject');
    
    if (!subject) {
        return (
            <div className="joint-availability-container">
                <div className="error-state">
                    <AlertCircle className="error-icon" />
                    <h3>Error de Datos</h3>
                    <p>No se especificó la materia para buscar disponibilidad conjunta.</p>
                    <div className="error-actions">
                        <button 
                            className="back-btn"
                            onClick={() => router.push('/home/buscar-tutores')}
                        >
                            <ArrowLeft size={20} />
                            Volver a Buscar
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="joint-availability-container">
            {/* Header de la página */}
            <div className="page-header">
                <div className="header-content">
                    {/* Botón de regreso */}
                    <div className="header-actions">
                        <button 
                            className="back-button"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft size={20} />
                            Regresar
                        </button>
                    </div>
                    
                    {/* Información de la materia */}
                    <div className="subject-info">
                        <div className="subject-avatar">
                            <Users size={32} />
                        </div>
                        <div className="subject-details">
                            <h1 className="subject-name">Disponibilidad Conjunta</h1>
                            <div className="subject-metadata">
                                <div className="metadata-item">
                                    <BookOpen size={18} />
                                    <span>{subject}</span>
                                </div>
                                <div className="metadata-item">
                                    <Users size={18} />
                                    <span>Todos los tutores disponibles</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Contenido del calendario */}
            <div className="availability-content">
                <AvailabilityCalendar 
                    subject={subject}
                    mode="joint"
                />
            </div>
        </div>
    );
}

function LoadingFallback() {
    return (
        <div className="joint-availability-container">
            <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Cargando disponibilidad conjunta...</p>
            </div>
        </div>
    );
}

export default function JointAvailabilityPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <JointAvailabilityContent />
        </Suspense>
    );
}