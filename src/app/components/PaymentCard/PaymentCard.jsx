"use client";

import React from 'react';
import './PaymentCard.css';

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value || 0);

const formatDate = (date) => {
  if (!date) return '—';
  try {
    return date.toLocaleString('es-CO', {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return '—';
  }
};

export default function PaymentCard({ payment }) {
  return (
    <div className="payment-card">
      <div className="payment-card__header">
        <span className="payment-card__subject">{payment.subject || 'Materia'}</span>
        <span className="payment-card__amount">{formatCurrency(payment.amount)}</span>
      </div>
      <div className="payment-card__body">
        <div className="payment-card__row">
          <span className="label">Método</span>
          <span className="value">{payment.method || '—'}</span>
        </div>
        <div className="payment-card__row">
          <span className="label">Fecha</span>
          <span className="value">{formatDate(payment.date_payment)}</span>
        </div>
        <div className="payment-card__row">
          <span className="label">Transacción</span>
          <span className="value mono">{payment.transactionID || '—'}</span>
        </div>
        <div className="payment-card__row">
          <span className="label">Tutor</span>
          <span className="value mono">{payment.tutorEmail || '—'}</span>
        </div>
      </div>
    </div>
  );
}
