"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/SecureAuthContext";
import TutoringHistoryService from "../../services/TutoringHistoryService";
import "./TutoringHistory.css";
import PaymentHistory from "../PaymentHistory/PaymentHistory";
import ReviewModal from "../ReviewModal/ReviewModal"; 

const TutoringHistory = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  // Filtros
  const [dateFilter, setDateFilter] = useState({ startDate: "", endDate: "" });
  const [subjectFilter, setSubjectFilter] = useState("");
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [paymentsCount, setPaymentsCount] = useState(0);

  useEffect(() => {
    if (user?.email) loadTutoringHistory();
  }, [user?.email]);

  useEffect(() => {
    applyFilters();
  }, [sessions, dateFilter, subjectFilter]);

  const loadTutoringHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const history = await TutoringHistoryService.getStudentTutoringHistory(
        user.email
      );

      const normalized = history.map((s) => ({
        ...s,
        scheduledDateTime:
          s.scheduledDateTime?.toDate?.() ||
          (s.scheduledDateTime ? new Date(s.scheduledDateTime) : null),
        endDateTime:
          s.endDateTime?.toDate?.() ||
          (s.endDateTime ? new Date(s.endDateTime) : null),
      }));

      setSessions(normalized);
      setFilteredSessions(normalized);
      setAvailableSubjects(TutoringHistoryService.getUniqueSubjects(normalized));
      setPaymentsCount(normalized.filter((s) => s.paymentId).length || 0);
    } catch (err) {
      console.error("❌ Error cargando historial:", err);
      setError("Error al cargar el historial de tutorías");
    } finally {
      setLoading(false);
    }
  };


  const applyFilters = () => {
    let filtered = [...sessions];

    // Filtrar por fecha 
    if (dateFilter.startDate || dateFilter.endDate) {
      const startDate = dateFilter.startDate
        ? new Date(dateFilter.startDate)
        : null;
      const endDate = dateFilter.endDate ? new Date(dateFilter.endDate) : null;

      filtered = TutoringHistoryService.filterByDate(filtered, startDate, endDate);
    }

    // Filtrar por materia
    if (subjectFilter.trim() !== "") {
      filtered = filtered.filter((session) =>
        session.subject?.toLowerCase().includes(subjectFilter.toLowerCase())
      );
    }

    setFilteredSessions(filtered);
  };

  const clearFilters = () => {
    setDateFilter({ startDate: "", endDate: "" });
    setSubjectFilter("");
    setShowSuggestions(false);
    setFilteredSessions(sessions);
  };

  const hasActiveFilters = () =>
    dateFilter.startDate ||
    dateFilter.endDate ||
    (subjectFilter && subjectFilter.trim() !== "");

  const getSubjectSuggestions = () => {
    if (!subjectFilter.trim()) return [];
    return availableSubjects
      .filter((s) => s.toLowerCase().includes(subjectFilter.toLowerCase()))
      .slice(0, 5);
  };

  const handleSubjectInputChange = (value) => {
    setSubjectFilter(value);
    setShowSuggestions(value.trim().length > 0);
  };

  
  const openModal = (session) => {
    setSelectedSession(session);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSession(null);
  };


  if (loading) {
    return (
      <div className="tutoring-history-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Cargando historial de tutorías...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tutoring-history-container">
        <div className="error-state">
          <h3>Error al cargar historial</h3>
          <p>{error}</p>
          <button onClick={loadTutoringHistory} className="retry-btn">
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  
  return (
    <div className="tutoring-history-container">
      <div className="page-header">
        <h1 className="page-title">Historial de tutorías</h1>
      </div>

      <div className="tutoring-history-content">
        {}
        <div className="filters-sidebar">
          <h3 className="filters-title">Filtros de búsqueda</h3>

          {}
          <div className="filter-group">
            <label className="filter-label">Buscar Materia</label>
            <div className="subject-input-container">
              <input
                type="text"
                value={subjectFilter}
                onChange={(e) => handleSubjectInputChange(e.target.value)}
                onFocus={() =>
                  setShowSuggestions(subjectFilter.trim().length > 0)
                }
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="subject-input"
                placeholder="Escribe el nombre de la materia..."
              />
              {showSuggestions && getSubjectSuggestions().length > 0 && (
                <div className="suggestions-dropdown">
                  {getSubjectSuggestions().map((s, i) => (
                    <div
                      key={i}
                      className="suggestion-item"
                      onClick={() => {
                        setSubjectFilter(s);
                        setShowSuggestions(false);
                      }}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {}
          <div className="filter-group">
            <label className="filter-label">Seleccionar fecha</label>
            <div className="date-inputs">
              <input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) =>
                  setDateFilter((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="date-input"
              />
              <input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) =>
                  setDateFilter((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className="date-input"
              />
            </div>
          </div>

          <button onClick={applyFilters} className="apply-filters-btn">
            Aplicar filtros
          </button>
        </div>

        {/* Resultados */}
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
          ) : (
            <div className="results-table">
              <div className="table-header">
                <div className="table-cell">Fecha</div>
                <div className="table-cell">Materia</div>
                <div className="table-cell">Tutor</div>
                <div className="table-cell">Rendimiento</div>
              </div>

              {filteredSessions.map((session) => {
                const now = new Date();
                const endDate = session.endDateTime;
                const isPast = endDate && endDate.getTime() < now.getTime();

                return (
                  <div
                    key={session.id}
                    className={`table-row ${isPast ? "clickable" : ""}`}
                    onClick={() => isPast && openModal(session)}
                    title={isPast ? "Ver detalles" : ""}
                  >
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
                      <span
                        className={`performance-badge ${
                          session.paymentStatus === "paid"
                            ? "excellent"
                            : session.paymentStatus === "pending"
                            ? "pending"
                            : "regular"
                        }`}
                      >
                        {session.paymentStatus === "paid"
                          ? "Excelente"
                          : session.paymentStatus === "pending"
                          ? "Pendiente"
                          : "Regular"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

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

      {}
      {showModal && selectedSession && (
        <ReviewModal session={selectedSession} onClose={closeModal} />
      )}
    </div>
  );
};

export default TutoringHistory;
