"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/SecureAuthContext";
import { PaymentService } from "../../services/core/PaymentService";
import { db } from "../../../firebaseConfig";
import { doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
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
import { useI18n } from "../../../lib/i18n";

export default function TutorStatistics() {
  const { user } = useAuth();
  const { t, formatCurrency } = useI18n();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0, // pagos pagados
    pendingSessions: 0,   // pagos pendientes
    totalEarnings: 0,     // suma de pagos pagados
    nextPayment: 0,       // suma de pagos pendientes
    averageRating: 0,
    monthlyEarnings: [],
    monthlyCounts: []
  });
  const [payments, setPayments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  
  // Filters
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState("year");
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1); // Cambiar a inicio del año
    const formatDate = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    return {
      start: formatDate(start),
      end: formatDate(now)
    };
  });

  useEffect(() => {
    if (selectedTimeframe !== 'custom') {
      const now = new Date();
      // Reset time to midnight to avoid timezone issues
      now.setHours(0, 0, 0, 0);
      let start, end = new Date(now);
      
      switch (selectedTimeframe) {
        case 'week':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          break;
        case 'year':
          start = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          start = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      
      // Format dates as YYYY-MM-DD in local timezone
      const formatDate = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      setSelectedPeriod({
        start: formatDate(start),
        end: formatDate(end)
      });
    }
  }, [selectedTimeframe]);

  useEffect(() => {
    if (user.isLoggedIn && user.email) {
      loadStatistics();
    }
  }, [user.isLoggedIn, user.email, selectedSubject, selectedTimeframe, selectedPeriod]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      
      // Cargar pagos del tutor desde Firebase (PaymentService)
      const paymentsData = await PaymentService.getPaymentsByTutor(user.email);
      console.log('[TutorStatistics] Total payments from Firebase:', paymentsData.length);
      console.log('[TutorStatistics] Payments data:', paymentsData);
      setPayments(paymentsData);

      // Filtrar pagos según materia/periodo
      const filteredPayments = filterPayments(paymentsData);
      console.log('[TutorStatistics] Filtered payments:', filteredPayments.length);
      console.log('[TutorStatistics] Filtered data:', filteredPayments);
      
      const calculatedStats = calculateStatistics(filteredPayments);
      // Cargar calificación promedio desde colección user
      const rating = await fetchTutorRating(user.email);
      setStats({ ...calculatedStats, averageRating: Number(rating || 0) });
      
      // Generar historial de transacciones desde pagos
      const transactionHistory = generateTransactionHistory(filteredPayments);
      console.log('[TutorStatistics] Transaction history:', transactionHistory.length);
      console.log('[TutorStatistics] Transactions:', transactionHistory);
      setTransactions(transactionHistory);
      
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTutorRating = async (email) => {
    try {
      const norm = (email || "").trim().toLowerCase();
      if (!norm) return 0;
      // Intento 1: doc ID = email
      const ref = doc(db, "user", norm);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data() || {};
        const r = data.rating;
        const n = typeof r === "string" ? parseFloat(r) : r;
        return Number.isFinite(n) ? n : 0;
      }
      // Intento 2: buscar por campo 'mail'
      const q = query(collection(db, "user"), where("mail", "==", norm), limit(1));
      const qs = await getDocs(q);
      if (!qs.empty) {
        const data = qs.docs[0].data() || {};
        const r = data.rating;
        const n = typeof r === "string" ? parseFloat(r) : r;
        return Number.isFinite(n) ? n : 0;
      }
      return 0;
    } catch (e) {
      console.warn("[statistics] fetchTutorRating error:", e);
      return 0;
    }
  };

  const filterPayments = (paymentsData) => {
    console.log('[TutorStatistics] filterPayments - Input:', paymentsData.length, 'payments');
    console.log('[TutorStatistics] Filter settings - Subject:', selectedSubject, 'Period:', selectedPeriod);
    
    let filtered = paymentsData;
    
    // Filter by subject
    if (selectedSubject !== "all") {
      filtered = filtered.filter(p => 
        (p.subject || '').toLowerCase().includes(selectedSubject.toLowerCase())
      );
      console.log('[TutorStatistics] After subject filter:', filtered.length, 'payments');
    }
    
    const periodStart = new Date(selectedPeriod.start);
    periodStart.setHours(0, 0, 0, 0);
    const periodEnd = new Date(selectedPeriod.end);
    periodEnd.setHours(23, 59, 59, 999);
    
    console.log('[TutorStatistics] Date range:', periodStart, 'to', periodEnd);
    
    filtered = filtered.filter(p => {
      const d = p.date_payment instanceof Date ? p.date_payment : (p.date_payment ? new Date(p.date_payment) : null);
      if (!d) {
        console.log('[TutorStatistics] Skipping payment with invalid date:', p.id);
        return false;
      }
      const isInRange = d >= periodStart && d <= periodEnd;
      console.log('[TutorStatistics] Payment', p.id, 'date:', d, 'in range:', isInRange);
      return isInRange;
    });
    
    console.log('[TutorStatistics] After date filter:', filtered.length, 'payments');
    return filtered;
  };

  const calculateStatistics = (paymentsData) => {
    const totalSessions = paymentsData.length; // número de pagos (una tutoría por pago)
    const completedSessions = paymentsData.filter(p => p.pagado).length;
    const pendingSessions = paymentsData.filter(p => !p.pagado).length;

    const totalEarnings = paymentsData
      .filter(p => p.pagado)
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const nextPayment = paymentsData
      .filter(p => !p.pagado)
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const averageRating = 0; // no disponible en pagos

    // Calcular ganancias mensuales para el gráfico
    const monthlyEarnings = calculateMonthlyEarnings(paymentsData);
    // Calcular conteo de tutorías por mes (pagadas)
    const monthlyCounts = calculateMonthlyCounts(paymentsData);

    return {
      totalSessions,
      completedSessions,
      pendingSessions,
      totalEarnings,
      nextPayment,
      averageRating,
      monthlyEarnings,
      monthlyCounts
    };
  };

  const calculateMonthlyEarnings = (paymentsData) => {
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
    
    // Sumar ganancias de pagos pagados por mes
    paymentsData
      .filter(p => p.pagado)
      .forEach(p => {
        const d = p.date_payment instanceof Date ? p.date_payment : (p.date_payment ? new Date(p.date_payment) : null);
        if (!d) return;
        const monthKey = `${months[d.getMonth()]} ${d.getFullYear()}`;
        if (Object.prototype.hasOwnProperty.call(monthlyData, monthKey)) {
          monthlyData[monthKey] += p.amount || 0;
        }
      });
    
    return Object.entries(monthlyData).map(([month, earnings]) => ({
      month,
      earnings
    }));
  };

  const calculateMonthlyCounts = (paymentsData) => {
    const monthlyData = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${months[monthDate.getMonth()]} ${monthDate.getFullYear()}`;
      monthlyData[monthKey] = 0;
    }
    paymentsData
      .filter(p => p.pagado)
      .forEach(p => {
        const d = p.date_payment instanceof Date ? p.date_payment : (p.date_payment ? new Date(p.date_payment) : null);
        if (!d) return;
        const monthKey = `${months[d.getMonth()]} ${d.getFullYear()}`;
        if (Object.prototype.hasOwnProperty.call(monthlyData, monthKey)) {
          monthlyData[monthKey] += 1;
        }
      });
    return Object.entries(monthlyData).map(([month, count]) => ({ month, count }));
  };

  const generateTransactionHistory = (paymentsData) => {
    return paymentsData
      .map(p => ({
        id: p.id || `${p.transactionID || ''}-${p.date_payment?.toString() || ''}`,
        date: p.date_payment instanceof Date ? p.date_payment : (p.date_payment ? new Date(p.date_payment) : new Date()),
        concept: t('tutorStats.transactions.conceptPrefix', { subject: p.subject || 'General' }),
        student: p.studentName || p.studentEmail || t('tutorStats.transactions.studentFallback'),
        amount: p.amount || 0,
        statusCode: p.pagado ? 'completed' : 'pending',
        status: p.pagado ? t('tutorStats.transactions.status.completed') : t('tutorStats.transactions.status.pending'),
        methodCode: normalizeMethod(p.method),
        method: (p.method || t('tutorStats.transactions.methodDefault')).toLowerCase()
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const normalizeMethod = (m) => {
    const s = (m || '').toString().toLowerCase();
    if (s.includes('tarj')) return 'card';
    if (s.includes('card')) return 'card';
    if (s.includes('efect') || s.includes('cash')) return 'cash';
    if (s.includes('transfer')) return 'transfer';
    return 'other';
  };

  const getUniqueSubjects = () => {
    const subjects = [...new Set(payments.map(p => p.subject).filter(Boolean))];
    return subjects;
  };

  const getStatusColor = (statusOrCode) => {
    const code = ['completed','pending','failed'].includes(statusOrCode)
      ? statusOrCode
      : (statusOrCode?.toString().toLowerCase().startsWith('comp') ? 'completed'
        : statusOrCode?.toString().toLowerCase().startsWith('pend') ? 'pending'
        : statusOrCode?.toString().toLowerCase().startsWith('fall') || statusOrCode?.toString().toLowerCase().startsWith('fail') ? 'failed'
        : 'default');
    switch (code) {
      case 'completed': return 'status-completed';
      case 'pending': return 'status-pending';
      case 'failed': return 'status-failed';
      default: return 'status-default';
    }
  };

  const getMethodIcon = (methodOrCode) => {
    const code = normalizeMethod(methodOrCode);
    switch (code) {
      case 'transfer': return '🏦';
      case 'cash': return '💵';
      case 'card': return '💳';
      default: return '💰';
    }
  };

  if (loading) {
    return (
      <div className="statistics-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>{t('tutorStats.loading')}</p>
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
            {t('tutorStats.title')}
          </h1>
          <p className="page-subtitle">{t('tutorStats.subtitle')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label className="filter-label">{t('tutorStats.filters.subject')}</label>
          <div className="filter-select">
            <select 
              value={selectedSubject} 
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="all">{t('common.allSubjects')}</option>
              {getUniqueSubjects().map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            <ChevronDown className="select-icon" />
          </div>
        </div>

        <div className="filter-group">
          <label className="filter-label">{t('common.period')}</label>
          <div className="filter-select">
            <select 
              value={selectedTimeframe} 
              onChange={(e) => setSelectedTimeframe(e.target.value)}
            >
              <option value="week">{t('common.week')}</option>
              <option value="month">{t('common.month')}</option>
              <option value="quarter">{t('common.quarter')}</option>
              <option value="year">{t('common.year')}</option>
              <option value="custom">{t('common.custom')}</option>
            </select>
            <ChevronDown className="select-icon" />
          </div>
        </div>

        {selectedTimeframe === 'custom' && (
          <div className="filter-group">
            <label className="filter-label">{t('common.from')}</label>
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
            <label className="filter-label">{t('common.to')}</label>
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
          <div className="card-icon sessions">
            <BarChart3 size={24} />
          </div>
          <div className="card-content">
            <h3 className="card-title">{t('tutorStats.cards.totalSessions')}</h3>
            <p className="card-value">{stats.totalSessions}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="card-icon pending">
            <DollarSign size={24} />
          </div>
          <div className="card-content">
            <h3 className="card-title">{t('tutorStats.cards.nextPayment')}</h3>
            <p className="card-value">{formatCurrency(stats.nextPayment)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="card-icon total">
            <TrendingUp size={24} />
          </div>
          <div className="card-content">
            <h3 className="card-title">{t('tutorStats.cards.totalEarnings')}</h3>
            <p className="card-value">{formatCurrency(stats.totalEarnings)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="card-icon rating">
            <Users size={24} />
          </div>
          <div className="card-content">
            <h3 className="card-title">{t('tutorStats.cards.averageRating')}</h3>
            <p className="card-value">{stats.averageRating.toFixed(1)} ⭐</p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="chart-section">
        <div className="chart-header">
          <h2 className="chart-title">{t('tutorStats.charts.sessionsByMonth')}</h2>
          <button className="chart-action-btn">
            <Eye size={16} />
            {t('tutorStats.charts.viewDetails')}
          </button>
        </div>
        
        <div className="chart-container">
          <div className="chart-bars">
            {stats.monthlyCounts.map((item, index) => (
              <div key={index} className="chart-bar-group">
                <div 
                  className="chart-bar"
                  style={{ 
                    height: `${Math.max(5, (item.count / Math.max(...stats.monthlyCounts.map(m => m.count), 1)) * 100)}%` 
                  }}
                >
                  <div className="bar-value">
                    {item.count}
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
          <h2 className="section-title">{t('tutorStats.transactions.title')}</h2>
          <p className="section-subtitle">{t('tutorStats.transactions.subtitle')}</p>
        </div>

        <div className="transactions-table">
          <div className="table-header">
            <div className="table-cell">{t('tutorStats.transactions.columns.date')}</div>
            <div className="table-cell">{t('tutorStats.transactions.columns.concept')}</div>
            <div className="table-cell">{t('tutorStats.transactions.columns.student')}</div>
            <div className="table-cell">{t('tutorStats.transactions.columns.amount')}</div>
            <div className="table-cell">{t('tutorStats.transactions.columns.status')}</div>
            <div className="table-cell">{t('tutorStats.transactions.columns.method')}</div>
          </div>
          
          <div className="table-body">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="table-row">
                <div className="table-cell">
                  {new Date(transaction.date).toLocaleDateString()}
                </div>
                <div className="table-cell">
                  {transaction.concept}
                </div>
                <div className="table-cell student">
                  {transaction.student}
                </div>
                <div className="table-cell amount">
                  {formatCurrency(transaction.amount)}
                </div>
                <div className="table-cell">
                  <span className={`status-badge ${getStatusColor(transaction.statusCode || transaction.status)}`}>
                    {transaction.status}
                  </span>
                </div>
                <div className="table-cell">
                  <span className="method-badge">
                    {getMethodIcon(transaction.methodCode || transaction.method)} {transaction.method}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {transactions.length === 0 && (
          <div className="empty-state">
            <Calendar size={48} />
            <h3>{t('common.noTransactions')}</h3>
            <p>{t('common.transactionsAppearAfter')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
