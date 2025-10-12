"use client";

<<<<<<< HEAD
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/SecureAuthContext';
import PaymentsService from '../../services/PaymentsService';

const currency = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v || 0);

export default function TutorStatisticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payments, setPayments] = useState([]);
  const [subject, setSubject] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // cargar TODOS los pagos del tutor (filtrado por fecha se hace en cliente)
  useEffect(() => {
    const load = async () => {
      if (!user?.email) return;
      setLoading(true);
      setError(null);
      try {
        const data = await PaymentsService.getPaymentsByTutor(user.email);
        setPayments(data);
      } catch (e) {
        console.error(e);
        setError('No fue posible cargar estadísticas');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.email]);

  // Filtrado por materia y por rango de fechas
  const filtered = useMemo(() => {
    const q = subject.trim().toLowerCase();
    const s = startDate ? new Date(startDate) : null;
    const e = endDate ? new Date(endDate) : null;
    return payments.filter(p => {
      if (q && !(p.subject || '').toLowerCase().includes(q)) return false;
      const d = p.date_payment instanceof Date ? p.date_payment : null;
      if (s && d && d < new Date(s.getFullYear(), s.getMonth(), s.getDate())) return false;
      if (e && d && d > new Date(e.getFullYear(), e.getMonth(), e.getDate(), 23, 59, 59, 999)) return false;
      return true;
    });
  }, [payments, subject, startDate, endDate]);

  // Métricas
  const metrics = useMemo(() => {
    const totalSessions = filtered.length;
    let totalEarned = 0;
    let nextPayment = 0;
    for (const p of filtered) {
      if (p.pagado) totalEarned += p.amount || 0;
      else nextPayment += p.amount || 0;
    }
    return { totalSessions, totalEarned, nextPayment };
  }, [filtered]);

  // Serie por mes (en función del rango y datos filtrados)
  const chart = useMemo(() => {
    const map = new Map(); // key 'YYYY-MM' -> count
    let minD = null, maxD = null;
    for (const p of filtered) {
      if (!p.date_payment) continue;
      const d = p.date_payment;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map.set(key, (map.get(key) || 0) + 1);
      if (!minD || d < minD) minD = d;
      if (!maxD || d > maxD) maxD = d;
    }

    // Determinar rango mensual a mostrar
    const start = startDate ? new Date(startDate) : (minD || new Date());
    const end = endDate ? new Date(endDate) : (maxD || new Date());
    const startMonth = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

    const labels = [];
    const values = [];
    const iter = new Date(startMonth);
    while (iter <= endMonth) {
      const key = `${iter.getFullYear()}-${String(iter.getMonth() + 1).padStart(2, '0')}`;
      labels.push(iter.toLocaleString('es', { month: 'short' }));
      values.push(map.get(key) || 0);
      iter.setMonth(iter.getMonth() + 1);
    }
    return { labels, values };
  }, [filtered, startDate, endDate]);

  const maxValue = Math.max(1, ...(chart.values || [0]));

  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto pt-6 px-6">
        <h1 className="text-3xl font-bold mb-6">Estadísticas</h1>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            className="border rounded-lg px-4 py-2"
            placeholder="Materia"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <input
            type="date"
            className="border rounded-lg px-4 py-2"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <input
            type="date"
            className="border rounded-lg px-4 py-2"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {loading ? (
          <p>Cargando…</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <>
            {/* Tarjetas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
                <p className="text-gray-600">Total de tutorías</p>
                <p className="text-3xl font-bold">{metrics.totalSessions}</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
                <p className="text-gray-600">Siguiente pago</p>
                <p className="text-3xl font-bold">{currency(metrics.nextPayment)}</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
                <p className="text-gray-600">Total ganado</p>
                <p className="text-3xl font-bold">{currency(metrics.totalEarned)}</p>
              </div>
            </div>

            {/* Gráfico de barras full width */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 w-full">
              <h2 className="text-lg font-semibold mb-4">Tutorías por mes</h2>
              <div
                className="grid items-end gap-3 w-full"
                style={{ gridTemplateColumns: `repeat(${chart.labels.length || 1}, minmax(0, 1fr))`, height: '14rem' }}
              >
                {(chart.labels || []).map((label, idx) => {
                  const v = chart.values[idx] || 0;
                  const h = maxValue ? (v / maxValue) * 200 : 0; // hasta 200px
                  return (
                    <div key={label + idx} className="flex flex-col items-center justify-end gap-1">
                      <span className="text-xs font-medium text-gray-700">{v}</span>
                      <div className="w-full bg-orange-400 rounded" style={{ height: `${h}px` }} aria-label={`${v} sesiones`} />
                      <span className="text-xs text-gray-600 mt-1">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
=======
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
>>>>>>> origin/develop
  );
}
