"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/SecureAuthContext";
import { useFavorites } from "../../hooks/useFavorites";
import FavoriteButton from "../../components/FavoriteButton/FavoriteButton";
import routes from "app/routes";
import "./Favorites.css";

const COP = (n) => (typeof n === "number" ? n.toLocaleString("es-CO", { minimumFractionDigits: 0 }) : "");

export default function FavoritesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { favorites, loading: loadingFavs, toggleCourseFavorite, toggleTutorFavorite } = useFavorites();

  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || loading) return;
    if (!user?.isLoggedIn) router.push(routes.LANDING);
  }, [mounted, loading, user?.isLoggedIn, router]);

  // Filtros
  const q = search.trim().toLowerCase();
  const filteredCourses = useMemo(() => !q ? favorites.courses :
    favorites.courses.filter((c) => c.name.toLowerCase().includes(q) || c.majorName.toLowerCase().includes(q)), [favorites.courses, q]);

  const filteredTutors = useMemo(() => !q ? favorites.tutors :
    favorites.tutors.filter((t) =>
      t.name.toLowerCase().includes(q) ||
      (t.majorName || "").toLowerCase().includes(q) ||
      (t.bio || "").toLowerCase().includes(q)
    ), [favorites.tutors, q]);

  const handleToggleCourseFavorite = async (courseId) => {
    await toggleCourseFavorite(courseId);
  };
  
  const handleToggleTutorFavorite = async (tutorId) => {
    await toggleTutorFavorite(tutorId);
  };

  if (!mounted || loading) {
    return (<div className="fav-loader"><div className="fav-spinner" /><p>Cargando…</p></div>);
  }

  return (
    <div className="fav-page">
      <main className="fav-container">
        <div className="cal-search">
          <span className="cal-search__icon" aria-hidden>🔎</span>
          <input className="cal-search__input" placeholder="Busca materias o tutores"
                 value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {/* COURSES */}
        <section className="cal-section">
          <h2 className="cal-section__title">Cursos favoritos</h2>
          {loadingFavs ? (
            <div className="fav-skeleton-list" aria-busy="true"><SkeletonCard /><SkeletonCard /></div>
          ) : filteredCourses.length === 0 ? (
            <EmptyState text="Aún no tienes cursos favoritos." />
          ) : (
            <ul className="cal-list">
              {filteredCourses.map((c) => (
                <li key={c.id} className="cal-card">
                  <div className="cal-left">
                    <div className="cal-titleRow">
                      <h3 className="cal-title">{c.name}</h3>
                      <span className="cal-price">{COP(c.base_price)}</span>
                    </div>
                    <p className="cal-sub">Programa: {c.majorName || "—"}</p>
                    <div className="cal-actions">
                    <button
                      className="btn-cta"
                      onClick={() =>
                        router.push(`${routes.SEARCH_TUTORS}?course=${encodeURIComponent(c.id)}`)
                      }
                    >
                      Buscar un tutor
                    </button>
                      <FavoriteButton 
                        isFavorite={true} 
                        onClick={() => handleToggleCourseFavorite(c.id)} 
                        size="sm"
                      />
                    </div>
                  </div>
                  <div className="cal-right" aria-hidden><DocIcon /></div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* TUTORS */}
        <section className="cal-section">
          <h2 className="cal-section__title">Tutores favoritos</h2>
          {loadingFavs ? (
            <div className="fav-skeleton-list" aria-busy="true"><SkeletonCard /><SkeletonCard /></div>
          ) : filteredTutors.length === 0 ? (
            <EmptyState text="Aún no tienes tutores favoritos." />
          ) : (
            <ul className="cal-list">
              {filteredTutors.map((t) => (
                <li key={t.id} className="cal-card">
                  <div className="cal-left">
                    <div className="cal-titleRow">
                      <h3 className="cal-title">{t.name}</h3>
                      {t.rating ? (
                        <span className="cal-rating">
                          {t.rating.toFixed(1)} <span className="cal-star" aria-hidden>★</span>
                        </span>
                      ) : null}
                      <span className={`cal-chip ${t.isTutor ? "ok" : ""}`}>{t.isTutor ? "Tutor" : "Usuario"}</span>
                    </div>

                    {t.bio ? <p className="cal-sub">{t.bio}</p> : null}

                    <div className="cal-actions">
                      <button className="btn-cta" onClick={() => {/* aquí puedes abrir perfil o booking */}}>
                        Reservar
                      </button>
                      <FavoriteButton 
                        isFavorite={true} 
                        onClick={() => handleToggleTutorFavorite(t.id)} 
                        size="sm"
                      />
                    </div>
                  </div>
                  <div className="cal-right" aria-hidden><AvatarIcon /></div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

/* Helpers UI */
function EmptyState({ text }) { return <div className="fav-empty">{text}</div>; }
function SkeletonCard() { return (<div className="cal-card cal-card--skeleton"><div className="skeleton skeleton--title" /><div className="skeleton skeleton--line" /><div className="skeleton skeleton--btns" /></div>); }
function DocIcon(){ return (<div className="cal-illus-wrap"><svg className="cal-illus" viewBox="0 0 96 96"><rect x="24" y="20" width="48" height="56" rx="8" fill="#E4F2EF"/><path d="M34 36h28v4H34zM34 46h20v4H34zM34 56h24v4H34z" fill="#2B7A78"/></svg></div>); }
function AvatarIcon(){ return (<div className="cal-illus-wrap"><svg className="cal-illus" viewBox="0 0 96 96"><circle cx="48" cy="36" r="16" fill="#E4F2EF"/><rect x="22" y="58" width="52" height="18" rx="9" fill="#2B7A78" opacity="0.2"/><circle cx="48" cy="36" r="9" fill="#2B7A78" opacity="0.35"/></svg></div>); }
