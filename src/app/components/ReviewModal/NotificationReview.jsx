"use client";

import React from "react";
export default function SuccessModal({
  open,
  onClose,
  title = "Reseña enviada con éxito!",
  message = "Gracias por tus comentarios. ¡Nos ayuda mucho!",
}) {
  if (!open) return null;

  return (
    <div
      className="modal-overlay success-overlay"
      onClick={onClose}
      style={{ zIndex: 9999 }} 
    >
      <div
        className="modal-content large success-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111" }}>
          {title}
        </h3>

        <div style={{ marginTop: 14, marginBottom: 12 }}>
          <img
            src="/happy-calico.png" 
            alt="Happy cat"
            style={{
              width: 200,
              height: 200,
              objectFit: "contain",
              display: "inline-block",
            }}
          />
        </div>

        <p style={{ margin: 0, whiteSpace: "pre-line", fontSize: 14, color: "#4a4a4a", lineHeight: 1.4 }}>
          {message}
        </p>
      </div>
    </div>
  );
}
