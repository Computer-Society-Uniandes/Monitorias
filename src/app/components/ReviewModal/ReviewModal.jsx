"use client";
import React, { useState, useEffect } from "react";
import {
  getFirestore,
  doc,
  updateDoc,
  arrayUnion,
  runTransaction,
  getDoc,
} from "firebase/firestore";
import { FaStar } from "react-icons/fa";
import { z } from "zod";
import "./ReviewModal.css";
import SuccessModal from "./NotificationReview";
import { useAuth } from "../../context/SecureAuthContext";

const reviewSchema = z.object({
  stars: z.number().min(1, "Debes seleccionar al menos 1 estrella").max(5),
  comment: z.string().max(500).optional().or(z.literal("")),
});

export default function ReviewModal({ session, onClose, currentUser = null }) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasExistingReview, setHasExistingReview] = useState(false);

  const { user: authUser } = useAuth ? useAuth() : { user: null };
  const user = currentUser || authUser;
  const db = getFirestore();

  useEffect(() => {
    const checkExistingReview = async () => {
      if (!user?.email || !session?.id) return;
      const docRef = doc(db, "tutoring_sessions", session.id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const reviews = data.reviews || [];
        const existing = reviews.find((r) => r.reviewerEmail === user.email);
        if (existing) {
          setHasExistingReview(true);
          setStars(existing.stars || 0);
          setComment(existing.comment || "");
        }
      }
    };
    checkExistingReview();
  }, [user, session?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const parse = reviewSchema.safeParse({ stars, comment });
    if (!parse.success) {
      alert(parse.error.issues[0]?.message || "Datos inválidos");
      return;
    }

    if (!user?.email) {
      alert("Debes iniciar sesión para enviar una reseña.");
      return;
    }

    setIsSubmitting(true);
    const docRef = doc(db, "tutoring_sessions", session.id);

    const newReview = {
      stars,
      comment,
      reviewerEmail: user.email, 
      reviewerName: user.displayName || user.name || user.email || "Anonymous",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await runTransaction(db, async (transaction) => {
        const sf = await transaction.get(docRef);
        if (!sf.exists()) throw new Error("La sesión no existe");

        const data = sf.data();
        const reviews = Array.isArray(data.reviews) ? data.reviews : [];

        
        const existingIndex = reviews.findIndex(
          (r) => r.reviewerEmail === user.email
        );

        if (existingIndex >= 0) {
          const updatedReviews = reviews.map((r, idx) =>
            idx === existingIndex
              ? { ...r, ...newReview, updatedAt: new Date().toISOString() }
              : r
          );
          transaction.update(docRef, { reviews: updatedReviews });
        } else {
          transaction.update(docRef, { reviews: arrayUnion(newReview) });
        }
      });

      setShowSuccess(true);
      const SUCCESS_MS = 1900;
      setTimeout(() => {
        setShowSuccess(false);
        if (typeof onClose === "function") onClose();
      }, SUCCESS_MS);
    } catch (err) {
      console.error("Error al guardar/actualizar la reseña:", err);
      alert("Error al guardar la reseña");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-xl font-bold mb-4">
            {hasExistingReview ? "Actualiza tu reseña" : "Deja una reseña"}
          </h2>

          <p><strong>Materia:</strong> {session.subject}</p>
          <p><strong>Tutor:</strong> {session.tutorName}</p>
          <p>
            <strong>Fecha:</strong>{" "}
            {new Date(session.scheduledDateTime).toLocaleString("es-CO", {
              dateStyle: "long",
              timeStyle: "short",
            })}
          </p>
          <p><strong>Precio:</strong> ${session.price} COP</p>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block font-medium mb-1">Calificación</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setStars(n)}
                    className={`text-3xl ${n <= stars ? "text-yellow-500" : "text-gray-300"}`}
                  >
                    <FaStar />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-medium mb-1">Comentario</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Escribe tu opinión sobre la tutoría"
                className="border p-2 w-full rounded h-32 resize-none"
                maxLength={500}
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="submit"
                disabled={stars === 0 || isSubmitting}
                className="px-4 py-2 rounded text-white font-semibold"
                style={{
                  background: stars > 0 && !isSubmitting ? "#f97316" : "#9ca3af",
                }}
              >
                {isSubmitting
                  ? "Guardando..."
                  : hasExistingReview
                  ? "Actualizar reseña"
                  : "Enviar reseña"}
              </button>
              <button type="button" className="px-4 py-2 rounded border" onClick={onClose}>
                Cerrar
              </button>
            </div>
          </form>
        </div>
      </div>

      <SuccessModal open={showSuccess} onClose={() => setShowSuccess(false)} />
    </>
  );
}
