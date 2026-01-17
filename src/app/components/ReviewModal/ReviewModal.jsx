"use client";
import React, { useState, useEffect } from "react";
import { FaStar } from "react-icons/fa";
import { z } from "zod";
import "./ReviewModal.css";
import SuccessModal from "./NotificationReview";
import { useAuth } from "../../context/SecureAuthContext";
import { useI18n } from "../../../lib/i18n";
import { ReviewService } from "../../services/utils/ReviewService";

const reviewSchema = z.object({
  stars: z.number().min(1, "Debes seleccionar al menos 1 estrella").max(5),
  comment: z.string().max(500).optional().or(z.literal("")),
});

export default function ReviewModal({ session, onClose, currentUser = null, onReviewSubmitted = null }) {
  const { t, lang } = useI18n();
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasExistingReview, setHasExistingReview] = useState(false);
  const [canReview, setCanReview] = useState(true);
  const [reviewError, setReviewError] = useState(null);

  const { user: authUser } = useAuth ? useAuth() : { user: null };
  const user = currentUser || authUser;

  useEffect(() => {
    const checkExistingReview = async () => {
      if (!user?.email || !session?.id) return;

      try {
        // Usar el nuevo ReviewService para verificar reseñas existentes
        const result = await ReviewService.checkExistingReview(session.id, user.email);

        if (result.hasReview && result.review) {
          setHasExistingReview(true);
          setStars(result.review.rating || result.review.stars || 0);
          setComment(result.review.comment || "");
        }

        // Verificar si puede dejar reseña
        const canReviewResult = await ReviewService.canReviewSession(session, user.email);
        setCanReview(canReviewResult.canReview);
        if (!canReviewResult.canReview) {
          setReviewError(canReviewResult.reason);
        }
      } catch (error) {
        console.error("Error checking existing review:", error);
      }
    };
    checkExistingReview();
  }, [user, session?.id, session]);

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

    if (!canReview) {
      alert(reviewError || "No puedes dejar una reseña para esta sesión.");
      return;
    }

    setIsSubmitting(true);

    const reviewData = {
      sessionId: session.id,
      tutorId: session.tutorId,
      rating: stars,
      comment,
      reviewerEmail: user.email,
      reviewerName: user.displayName || user.name || user.email || "Anonymous",
      course: session.course || "",
    };

    try {
      const result = await ReviewService.createReview(reviewData);

      if (result.success) {
        setShowSuccess(true);

        // Notificar al componente padre si existe el callback
        if (typeof onReviewSubmitted === "function") {
          onReviewSubmitted(result.review);
        }

        const SUCCESS_MS = 1900;
        setTimeout(() => {
          setShowSuccess(false);
          if (typeof onClose === "function") onClose();
        }, SUCCESS_MS);
      } else {
        throw new Error(result.error || "Error al guardar la reseña");
      }
    } catch (err) {
      console.error("Error al guardar/actualizar la reseña:", err);
      alert(err.message || t("review.errors.saveError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session) return null;

  return (
    <>
      {/* Show review modal only when success modal is not showing */}
      {!showSuccess && (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">
              {hasExistingReview
                ? t("review.updateTitle")
                : t("review.newTitle")}
            </h2>

            <p>
              <strong>{t("review.fields.course")}:</strong> {session.course}
            </p>
            <p>
              <strong>{t("review.fields.tutor")}:</strong> {session.tutorName}
            </p>
            <p>
              <strong>{t("review.fields.date")}:</strong>{" "}
              {new Date(session.scheduledDateTime).toLocaleString(lang === "es" ? "es-CO" : "en-US", {
                dateStyle: "long",
                timeStyle: "short",
              })}
            </p>
            <p>
              <strong>{t("review.fields.price")}:</strong> ${session.price} COP
            </p>

            {/* Mostrar error si no puede dejar reseña */}
            {!canReview && reviewError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {reviewError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block font-medium mb-1">{t("review.fields.rating")}</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => canReview && setStars(n)}
                      disabled={!canReview}
                      className={`text-3xl transition-colors ${
                        n <= stars ? "text-yellow-500" : "text-gray-300"
                      } ${!canReview ? "cursor-not-allowed opacity-50" : "hover:text-yellow-400"}`}
                    >
                      <FaStar />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">{t("review.fields.comment")}</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t("review.placeholders.comment")}
                  className="border p-2 w-full rounded h-32 resize-none"
                  maxLength={500}
                  disabled={!canReview}
                />
                <p className="text-sm text-gray-500 mt-1">{comment.length}/500</p>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  disabled={stars === 0 || isSubmitting || !canReview}
                  className="px-4 py-2 rounded text-white font-semibold transition-colors"
                  style={{
                    background: stars > 0 && !isSubmitting && canReview ? "#ff9505" : "#9ca3af",
                  }}
                >
                  {isSubmitting
                    ? t("review.buttons.saving")
                    : hasExistingReview
                    ? t("review.buttons.update")
                    : t("review.buttons.submit")}
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded border hover:bg-gray-50 transition-colors"
                  onClick={onClose}
                >
                  {t("review.buttons.close")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Show success modal after submission */}
      {showSuccess && (
        <SuccessModal
          onClose={() => {
            setShowSuccess(false);
            if (typeof onClose === "function") onClose();
          }}
        />
      )}
    </>
  );
}
