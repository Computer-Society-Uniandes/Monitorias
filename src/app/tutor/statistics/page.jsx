"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/SecureAuthContext";
import { TutoringSessionService } from "../../services/TutoringSessionService";
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  Filter,
  ChevronDown,
  Download,
  Eye
} from "lucide-react";
import "./Statistics.css";

export default function TutorStatistics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    pendingSessions: 0,
    totalEarnings: 0,
    averageRating: 0,
    monthlyEarnings: []
  });
  const [sessions, setSessions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  
  // Filters
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState("month");
  const [selectedPeriod, setSelectedPeriod] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (user.isLoggedIn && user.email) {
      loadStatistics();
    }
  }, [user.isLoggedIn, user.email, selectedSubject, selectedTimeframe, selectedPeriod]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      
      // Load sessions data
      const sessionsData = await TutoringSessionService.getTutorSessions(user.email);
      setSessions(sessionsData);
      
      // Calculate statistics
      const filteredSessions = filterSessions(sessionsData);
      const calculatedStats = calculateStatistics(filteredSessions);
      setStats(calculatedStats);
      
      // Generate transaction history from completed sessions
      const transactionHistory = generateTransactionHistory(filteredSessions);
      setTransactions(transactionHistory);
      
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSessions = (sessionsData) => {
    let filtered = sessionsData;
    
    // Filter by subject
    if (selectedSubject !== "all") {
      filtered = filtered.filter(session => 
        session.subject?.toLowerCase().includes(selectedSubject.toLowerCase())
      );
    }
    
    // Filter by timeframe
    const now = new Date();
    const periodStart = new Date(selectedPeriod.start);
    const periodEnd = new Date(selectedPeriod.end);
    
    filtered = filtered.filter(session => {
      const sessionDate = new Date(session.scheduledDateTime);
      return sessionDate >= periodStart && sessionDate <= periodEnd;
    });
    
    return filtered;
  };

  const calculateStatistics = (sessionsData) => {
    const totalSessions = sessionsData.length;
    const completedSessions = sessionsData.filter(s => s.status === 'completed').length;
    const pendingSessions = sessionsData.filter(s => s.status === 'scheduled').length;
    
    const totalEarnings = sessionsData
      .filter(s => s.status === 'completed' && s.paymentStatus === 'paid')
      .reduce((sum, s) => sum + (s.price || 0), 0);
    
    const ratedSessions = sessionsData.filter(s => s.rating?.score);
    const averageRating = ratedSessions.length > 0 
      ? ratedSessions.reduce((sum, s) => sum + s.rating.score, 0) / ratedSessions.length
      : 0;
    
    // Calculate monthly earnings for chart
    const monthlyEarnings = calculateMonthlyEarnings(sessionsData);
    
    return {
      totalSessions,
      completedSessions,
      pendingSessions,
      totalEarnings,
      averageRating,
      monthlyEarnings
    };
  };

  const calculateMonthlyEarnings = (sessionsData) => {
    const monthlyData = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize last 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${months[monthDate.getMonth()]} ${monthDate.getFullYear()}`;
      monthlyData[monthKey] = 0;
    }
    
    // Add earnings from completed sessions
    sessionsData
      .filter(s => s.status === 'completed' && s.paymentStatus === 'paid')
      .forEach(session => {
        const sessionDate = new Date(session.scheduledDateTime);
        const monthKey = `${months[sessionDate.getMonth()]} ${sessionDate.getFullYear()}`;
        if (monthlyData.hasOwnProperty(monthKey)) {
          monthlyData[monthKey] += session.price || 0;
        }
      });
    
    return Object.entries(monthlyData).map(([month, earnings]) => ({
      month,
      earnings
    }));
  };

  const generateTransactionHistory = (sessionsData) => {
    return sessionsData
      .filter(s => s.status === 'completed')
      .map(session => ({
        id: session.id,
        date: session.scheduledDateTime,
        concept: `Tutoría ${session.subject || 'General'}`,
        student: session.studentName || session.studentEmail,
        amount: session.price || 0,
        status: session.paymentStatus === 'paid' ? 'completado' : 'pendiente',
        method: session.paymentMethod || 'transferencia'
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const getUniqueSubjects = () => {
    const subjects = [...new Set(sessions.map(s => s.subject).filter(Boolean))];
    return subjects;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completado": return "status-completed";
      case "pendiente": return "status-pending";
      case "fallido": return "status-failed";
      default: return "status-default";
    }
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case "transferencia": return "🏦";
      case "efectivo": return "💵";
      case "tarjeta": return "💳";
      default: return "💰";
    }
  };

  if (loading) {
    return (
      <div className="statistics-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="statistics-container">
      {/* Header */}
      <div className="statistics-header">
        <div className="header-content">
          <h1 className="page-title">
            <BarChart3 className="title-icon" />
            Estadísticas
          </h1>
          <p className="page-subtitle">
            Analiza tu rendimiento y ganancias como tutor
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label className="filter-label">Materia</label>
          <div className="filter-select">
            <select 
              value={selectedSubject} 
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="all">Todas las materias</option>
              {getUniqueSubjects().map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            <ChevronDown className="select-icon" />
          </div>
        </div>

        <div className="filter-group">
          <label className="filter-label">Período</label>
          <div className="filter-select">
            <select 
              value={selectedTimeframe} 
              onChange={(e) => setSelectedTimeframe(e.target.value)}
            >
              <option value="week">Esta semana</option>
              <option value="month">Este mes</option>
              <option value="quarter">Este trimestre</option>
              <option value="year">Este año</option>
              <option value="custom">Personalizado</option>
            </select>
            <ChevronDown className="select-icon" />
          </div>
        </div>

        {selectedTimeframe === 'custom' && (
          <div className="filter-group">
            <label className="filter-label">Desde</label>
            <input
              type="date"
              value={selectedPeriod.start}
              onChange={(e) => setSelectedPeriod(prev => ({ ...prev, start: e.target.value }))}
              className="date-input"
            />
          </div>
        )}

        {selectedTimeframe === 'custom' && (
          <div className="filter-group">
            <label className="filter-label">Hasta</label>
            <input
              type="date"
              value={selectedPeriod.end}
              onChange={(e) => setSelectedPeriod(prev => ({ ...prev, end: e.target.value }))}
              className="date-input"
            />
          </div>
        )}
      </div>

      {/* Date Range Display */}
      <div className="date-range-display">
        {selectedPeriod.start === selectedPeriod.end 
          ? new Date(selectedPeriod.start).toLocaleDateString('es-ES')
          : `${new Date(selectedPeriod.start).toLocaleDateString('es-ES')} - ${new Date(selectedPeriod.end).toLocaleDateString('es-ES')}`
        }
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="stat-card">
          <div className="card-icon">
            <Calendar size={24} />
          </div>
          <div className="card-content">
            <h3 className="card-title">Total Sesiones</h3>
            <p className="card-value">{stats.totalSessions}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="card-icon earnings">
            <DollarSign size={24} />
          </div>
          <div className="card-content">
            <h3 className="card-title">Próximo Pago</h3>
            <p className="card-value">
              ${stats.totalEarnings.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="card-icon total">
            <TrendingUp size={24} />
          </div>
          <div className="card-content">
            <h3 className="card-title">Ganancias Totales</h3>
            <p className="card-value">
              ${stats.totalEarnings.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="card-icon rating">
            <Users size={24} />
          </div>
          <div className="card-content">
            <h3 className="card-title">Calificación Promedio</h3>
            <p className="card-value">
              {stats.averageRating.toFixed(1)} ⭐
            </p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="chart-section">
        <div className="chart-header">
          <h2 className="chart-title">Sesiones por mes</h2>
          <button className="chart-action-btn">
            <Eye size={16} />
            Ver detalles
          </button>
        </div>
        
        <div className="chart-container">
          <div className="chart-bars">
            {stats.monthlyEarnings.map((item, index) => (
              <div key={index} className="chart-bar-group">
                <div 
                  className="chart-bar"
                  style={{ 
                    height: `${Math.max(20, (item.earnings / Math.max(...stats.monthlyEarnings.map(m => m.earnings), 1)) * 100)}%` 
                  }}
                >
                  <div className="bar-value">
                    ${item.earnings.toLocaleString()}
                  </div>
                </div>
                <span className="bar-label">{item.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="transactions-section">
        <div className="section-header">
          <h2 className="section-title">Historial de Pagos</h2>
          <p className="section-subtitle">
            Registro de transferencias recibidas
          </p>
        </div>

        <div className="transactions-table">
          <div className="table-header">
            <div className="table-cell">Fecha</div>
            <div className="table-cell">Concepto</div>
            <div className="table-cell">Estudiante</div>
            <div className="table-cell">Monto</div>
            <div className="table-cell">Estado</div>
            <div className="table-cell">Método</div>
          </div>
          
          <div className="table-body">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="table-row">
                <div className="table-cell">
                  {new Date(transaction.date).toLocaleDateString('es-ES')}
                </div>
                <div className="table-cell">
                  {transaction.concept}
                </div>
                <div className="table-cell">
                  {transaction.student}
                </div>
                <div className="table-cell amount">
                  ${transaction.amount.toLocaleString()}
                </div>
                <div className="table-cell">
                  <span className={`status-badge ${getStatusColor(transaction.status)}`}>
                    {transaction.status}
                  </span>
                </div>
                <div className="table-cell">
                  <span className="method-badge">
                    {getMethodIcon(transaction.method)} {transaction.method}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {transactions.length === 0 && (
          <div className="empty-state">
            <Calendar size={48} />
            <h3>No hay transacciones</h3>
            <p>Las transacciones aparecerán aquí una vez que completes sesiones de tutoría.</p>
          </div>
        )}
      </div>
    </div>
  );
}
