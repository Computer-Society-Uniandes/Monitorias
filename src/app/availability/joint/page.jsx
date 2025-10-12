'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Users, BookOpen, ArrowLeft, AlertCircle } from 'lucide-react';
import AvailabilityCalendar from '../../components/AvailabilityCalendar/AvailabilityCalendar';
import './JointAvailability.css';
import { useI18n } from '../../../lib/i18n';

function JointAvailabilityContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { t } = useI18n();
    
    const subject = searchParams.get('subject');
    
    if (!subject) {
        return (
            <div className="joint-availability-container">
                <div className="error-state">
                    <AlertCircle className="error-icon" />
                    <h3>{t('availability.joint.errorTitle')}</h3>
                    <p>{t('availability.joint.errorText')}</p>
                    <div className="error-actions">
                        <button 
                            className="back-btn"
                            onClick={() => router.push('/home/buscar-tutores')}
                        >
                            <ArrowLeft size={20} />
                            {t('availability.joint.back')}
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
                            {t('common.back')}
                        </button>
                    </div>
                    
                    {/* Información de la materia */}
                    <div className="subject-info">
                        <div className="subject-avatar">
                            <Users size={32} />
                        </div>
                        <div className="subject-details">
                            <h1 className="subject-name">{t('availability.joint.title')}</h1>
                            <div className="subject-metadata">
                                <div className="metadata-item">
                                    <BookOpen size={18} />
                                    <span>{subject}</span>
                                </div>
                                <div className="metadata-item">
                                    <Users size={18} />
                                    <span>{t('availability.joint.allTutors')}</span>
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
    const { t } = useI18n();
    return (
        <div className="joint-availability-container">
            <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>{t('availability.joint.loading')}</p>
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