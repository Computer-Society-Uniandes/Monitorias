"use client";

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
  );
}
