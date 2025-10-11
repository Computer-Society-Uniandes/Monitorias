'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { User, MapPin, Calendar, Star, ArrowLeft, AlertCircle } from 'lucide-react';
import AvailabilityCalendar from '../../components/AvailabilityCalendar/AvailabilityCalendar';
import './IndividualAvailability.css';

function IndividualAvailabilityContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const tutorId = searchParams.get('tutorId');
    const tutorName = searchParams.get('tutorName');
    const subject = searchParams.get('subject');
    const location = searchParams.get('location');
    const rating = searchParams.get('rating');
    
    if (!tutorId || !tutorName) {
        return (
            <div className="individual-availability-container">
                <div className="error-state">
                    <AlertCircle className="error-icon" />
                    <h3>Error de Datos</h3>
                    <p>No se pudieron cargar los datos del tutor. Por favor, regresa e intenta nuevamente.</p>
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
        <div className="individual-availability-container">
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
                    
                    {/* Información del tutor */}
                    <div className="tutor-info">
                        <div className="tutor-avatar">
                            <User size={32} />
                        </div>
                        <div className="tutor-details">
                            <h1 className="tutor-name">{tutorName}</h1>
                            <div className="tutor-metadata">
                                {subject && (
                                    <div className="metadata-item">
                                        <Calendar size={18} />
                                        <span>{subject}</span>
                                    </div>
                                )}
                                {location && (
                                    <div className="metadata-item">
                                        <MapPin size={18} />
                                        <span>{location}</span>
                                    </div>
                                )}
                                {rating && (
                                    <div className="metadata-item">
                                        <Star size={18} />
                                        <span>{rating} ⭐</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Contenido del calendario */}
            <div className="availability-content">
                <AvailabilityCalendar 
                    tutorId={tutorId}
                    tutorName={tutorName}
                    subject={subject}
                    mode="individual"
                />
            </div>
        </div>
    );
}

function LoadingFallback() {
    return (
        <div className="individual-availability-container">
            <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Cargando disponibilidad...</p>
            </div>
        </div>
    );
}

export default function IndividualAvailabilityPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <IndividualAvailabilityContent />
        </Suspense>
    );
}