"use client";

import React from 'react';
import './PaymentCard.css';
import { useI18n } from '../../../lib/i18n';

export default function PaymentCard({ payment }) {
  const { t, formatCurrency, formatDateTime } = useI18n();

  return (
    <div className="payment-card">
      <div className="payment-card__header">
        <span className="payment-card__subject">{payment.subject || t('payments.card.subjectFallback')}</span>
        <span className="payment-card__amount">{formatCurrency(payment.amount)}</span>
      </div>
      <div className="payment-card__body">
        <div className="payment-card__row">
          <span className="label">{t('payments.card.method')}</span>
          <span className="value">{payment.method || '—'}</span>
        </div>
        <div className="payment-card__row">
          <span className="label">{t('payments.card.date')}</span>
          <span className="value">{formatDateTime(payment.date_payment)}</span>
        </div>
        <div className="payment-card__row">
          <span className="label">{t('payments.card.transaction')}</span>
          <span className="value mono">{payment.transactionID || '—'}</span>
        </div>
        <div className="payment-card__row">
          <span className="label">{t('payments.card.tutor')}</span>
          <span className="value mono">{payment.tutorEmail || '—'}</span>
        </div>
      </div>
    </div>
  );
}
