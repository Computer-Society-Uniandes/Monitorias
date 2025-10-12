"use client";

import React, { useState } from "react";
import { getFirestore, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { FaStar } from "react-icons/fa";
import { toast } from "sonner";
import { z } from "zod";
import "./ReviewModal.css";

const reviewSchema = z.object({
  stars: z.number().min(1).max(5),
  comment: z.string().max(500).optional().or(z.literal("")),
});

const ReviewModal = ({ session, onClose }) => {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const db = getFirestore();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const parse = reviewSchema.safeParse({ stars, comment });
    if (!parse.success) {
      toast(parse.error.issues[0]?.message || "Datos inválidos");
      return;
    }

    setIsSubmitting(true);

    try {
      const docRef = doc(db, "tutoring_sessions", session.id);

      await updateDoc(docRef, {
        reviews: arrayUnion({
          stars,
          comment,
          createdAt: new Date().toISOString(),
        }),
      });

      toast("Reseña enviada con éxito");
      setStars(0);
      setComment("");
      onClose();
    } catch (error) {
      console.error("Error al guardar la reseña:", error);
      toast("Error al guardar la reseña");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">Detalles de la tutoría</h2>
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
                  aria-label={`Poner ${n} estrellas`}
                >
                  <FaStar />
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {stars === 0 ? "Selecciona una calificación" : `Has puesto ${stars} estrella${stars > 1 ? "s" : ""}`}
            </p>
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
              className={`px-4 py-2 rounded text-white font-semibold ${
                stars > 0 && !isSubmitting ? "bg-orange-500 hover:bg-orange-600" : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? "Enviando..." : "Enviar reseña"}
            </button>
            <button className="px-4 py-2 rounded border" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;