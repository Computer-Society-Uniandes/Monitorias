import React from 'react';
import { User, Calendar, DollarSign, ExternalLink, CreditCard } from 'lucide-react';
import { TutoringHistoryService } from '../../services/utils/TutoringHistoryService';
import './TutoringHistoryCard.css';

const TutoringHistoryCard = ({ session }) => {
  const {
    tutorName,
    tutorEmail,
    subject,
    price,
    scheduledDateTime,
    paymentStatus = 'pending',
    calicoCalendarHtmlLink,
    status,
    tutorProfilePicture
  } = session;

  const formattedDate = TutoringHistoryService.formatDate(scheduledDateTime);
  const formattedPrice = TutoringHistoryService.formatPrice(price);
  const paymentColors = TutoringHistoryService.getPaymentStatusColor(paymentStatus);
  const paymentStatusText = TutoringHistoryService.translatePaymentStatus(paymentStatus);

  const handleViewDetails = () => {
    if (calicoCalendarHtmlLink) {
      window.open(calicoCalendarHtmlLink, '_blank');
    }
  };

  return (
    <div className="tutoring-history-card">
      {/* Header de la card con información del tutor */}
      <div className="card-header">
        <div className="tutor-info">
          <div className="tutor-avatar">
            {tutorProfilePicture ? (
              <img src={tutorProfilePicture} alt={tutorName} />
            ) : (
              <User size={24} />
            )}
          </div>
          <div className="tutor-details">
            <h3 className="tutor-name">{tutorName}</h3>
            <p className="tutor-email">{tutorEmail}</p>
          </div>
        </div>

        {/* Estado de pago */}
        <div 
          className="payment-status"
          style={{
            backgroundColor: paymentColors.bg,
            color: paymentColors.text,
            border: `1px solid ${paymentColors.border}`
          }}
        >
          <CreditCard size={14} />
          {paymentStatusText}
        </div>
      </div>

      {/* Contenido principal de la card */}
      <div className="card-content">
        <div className="session-details">
          {/* Materia */}
          <div className="detail-item">
            <div className="subject-badge">{subject}</div>
          </div>

          {/* Fecha y hora */}
          <div className="detail-item">
            <Calendar size={16} />
            <span className="detail-text">{formattedDate}</span>
          </div>

          {/* Precio */}
          <div className="detail-item">
            <DollarSign size={16} />
            <span className="detail-text price-text">{formattedPrice}</span>
          </div>
        </div>
      </div>

      {/* Footer con acciones */}
      <div className="card-footer">
        <div className="session-status">
          <span className={`status-indicator ${status || 'scheduled'}`}>
            {status === 'completed' ? 'Completada' : 
             status === 'cancelled' ? 'Cancelada' : 
             status === 'scheduled' ? 'Programada' : 
             'Pendiente'}
          </span>
        </div>

        {calicoCalendarHtmlLink && (
          <button 
            className="view-details-btn"
            onClick={handleViewDetails}
            title="Ver detalles completos del evento"
          >
            <ExternalLink size={16} />
            Ver Detalles
          </button>
        )}
      </div>
    </div>
  );
};

export default TutoringHistoryCard;