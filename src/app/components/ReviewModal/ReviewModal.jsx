"use client";

import React from "react";
import "./ReviewModal.css";

const ReviewModal = ({ session, onClose }) => {
  if (!session) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()} 
      >
        <h2>Detalles de la tutoría</h2>
        <p><strong>Materia:</strong> {session.subject}</p>
        <p><strong>Tutor:</strong> {session.tutorName}</p>
        <p>
          <strong>Fecha:</strong>{" "}
          {new Date(session.scheduledDateTime).toLocaleString("es-CO", {
            dateStyle: "long",
            timeStyle: "short",
          })}
        </p>
        <p>
          <strong>Estado:</strong>{" "}
          {session.endDateTime?.getTime() < new Date().getTime()
            ? "Finalizada"
            : "Pendiente"}
        </p>
        <p><strong>Precio:</strong> ${session.price} COP</p>


        <button className="close-modal-btn" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default ReviewModal;
