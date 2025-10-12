"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/SecureAuthContext';
import TutoringHistoryService from '../../services/TutoringHistoryService';
import './TutoringHistory.css';
import PaymentHistory from '../PaymentHistory/PaymentHistory';

const TutoringHistory = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para filtros
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [subjectFilter, setSubjectFilter] = useState('');
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [paymentsCount, setPaymentsCount] = useState(0);

  useEffect(() => {
    if (user?.email) {
      loadTutoringHistory();
    }
  }, [user?.email]);

  useEffect(() => {
    applyFilters();
  }, [sessions, dateFilter, subjectFilter]);

  const loadTutoringHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📚 Cargando historial para:', user.email);
      const history = await TutoringHistoryService.getStudentTutoringHistory(user.email);
      
      setSessions(history);
      
      // Obtener materias únicas
      const subjects = TutoringHistoryService.getUniqueSubjects(history);
      setAvailableSubjects(subjects);

      console.log('✅ Historial cargado:', history.length, 'tutorías');
    } catch (err) {
      console.error('❌ Error cargando historial:', err);
      setError('Error al cargar el historial de tutorías');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...sessions];

    // Filtrar por fecha
    if (dateFilter.startDate || dateFilter.endDate) {
      const startDate = dateFilter.startDate ? new Date(dateFilter.startDate) : null;
      const endDate = dateFilter.endDate ? new Date(dateFilter.endDate) : null;
      
      filtered = TutoringHistoryService.filterByDate(filtered, startDate, endDate);
    }

    // Filtrar por materia (búsqueda por texto)
    if (subjectFilter && subjectFilter.trim() !== '') {
      filtered = filtered.filter(session => 
        session.subject?.toLowerCase().includes(subjectFilter.toLowerCase())
      );
    }

    setFilteredSessions(filtered);
  };

  const clearFilters = () => {
    setDateFilter({ startDate: '', endDate: '' });
    setSubjectFilter('');
    setShowSuggestions(false);
  };

  const hasActiveFilters = () => {
    return dateFilter.startDate || dateFilter.endDate || (subjectFilter && subjectFilter.trim() !== '');
  };

  // Función para obtener sugerencias de materias
  const getSubjectSuggestions = () => {
    if (!subjectFilter.trim()) return [];
    
    return availableSubjects.filter(subject =>
      subject.toLowerCase().includes(subjectFilter.toLowerCase())
    ).slice(0, 5); // Máximo 5 sugerencias
  };

  const handleSubjectInputChange = (value) => {
    setSubjectFilter(value);
    setShowSuggestions(value.trim().length > 0);
  };

  const selectSuggestion = (suggestion) => {
    setSubjectFilter(suggestion);
    setShowSuggestions(false);
  };

  if (loading) {
    return (
      <div className="tutoring-history-container">
        <div className="tutoring-history-content">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Cargando historial de tutorías...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tutoring-history-container">
        <div className="tutoring-history-content">
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h3>Error al cargar historial</h3>
            <p>{error}</p>
            <button onClick={loadTutoringHistory} className="retry-btn">
              Intentar de nuevo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tutoring-history-container">
      {/* Header de la página */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">Estadísticas e historial</h1>
          </div>
        </div>
      </div>

      <div className="tutoring-history-content">
        {/* Panel de filtros en sidebar */}
        <div className="filters-sidebar">
          <h3 className="filters-title">Filtros de búsqueda</h3>
          
          <div className="filter-group">
            <label className="filter-label">Buscar Materia</label>
            <div className="subject-input-container">
              <input
                type="text"
                value={subjectFilter}
                onChange={(e) => handleSubjectInputChange(e.target.value)}
                onFocus={() => setShowSuggestions(subjectFilter.trim().length > 0)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="subject-input"
                placeholder="Escribe el nombre de la materia..."
              />
              
              {showSuggestions && getSubjectSuggestions().length > 0 && (
                <div className="suggestions-dropdown">
                  {getSubjectSuggestions().map((suggestion, index) => (
                    <div
                      key={index}
                      className="suggestion-item"
                      onClick={() => selectSuggestion(suggestion)}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Seleccionar fecha</label>
            <div className="date-inputs">
              <input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                className="date-input"
                placeholder="Fecha inicio"
              />
              <input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                className="date-input"
                placeholder="Fecha fin"
              />
            </div>
          </div>

          <button onClick={clearFilters} className="apply-filters-btn">
            Aplicar filtros
          </button>
        </div>

        {/* Tabla de resultados */}
        <div className="results-section">
          <h2 className="section-title">Historial de tutorías</h2>
          
          {filteredSessions.length === 0 && paymentsCount === 0 ? (
            <div className="empty-results">
              <p>No se encontraron tutorías</p>
              {hasActiveFilters() && (
                <button onClick={clearFilters} className="clear-filters-link">
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : null}

          {filteredSessions.length > 0 && (
            <div className="results-table">
              <div className="table-header">
                <div className="table-cell">Fecha</div>
                <div className="table-cell">Materia</div>
                <div className="table-cell">Tutor</div>
                <div className="table-cell">Rendimiento</div>
              </div>
              {filteredSessions.map((session) => (
                <div key={session.id} className="table-row">
                  <div className="table-cell" data-label="Fecha">
                    {TutoringHistoryService.formatDate(session.scheduledDateTime)}
                  </div>
                  <div className="table-cell" data-label="Materia">
                    <span className="subject-tag">{session.subject}</span>
                  </div>
                  <div className="table-cell" data-label="Tutor">
                    {session.tutorName}
                  </div>
                  <div className="table-cell" data-label="Rendimiento">
                    <span className={`performance-badge ${session.paymentStatus === 'paid' ? 'excellent' : 'pending'}`}>
                      {session.paymentStatus === 'paid' ? 'Excelente' : 
                       session.paymentStatus === 'pending' ? 'Pendiente' : 'Regular'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Historial de pagos embebido bajo Resultados */}
          <div style={{ marginTop: 24 }}>
            <PaymentHistory
              subjectQuery={subjectFilter}
              startDate={dateFilter.startDate}
              endDate={dateFilter.endDate}
              onCountChange={setPaymentsCount}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutoringHistory;