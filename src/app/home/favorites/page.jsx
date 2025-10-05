"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/SecureAuthContext";
import routes from "app/routes";

import { FavoritesService } from "../../services/FavoritesService";

import "./Favorites.css";

const COP = (n) =>
  typeof n === "number"
    ? n.toLocaleString("es-CO", { minimumFractionDigits: 0 })
    : "";

export default function FavoritesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [search, setSearch] = useState("");
  const [loadingFavs, setLoadingFavs] = useState(true);
  const [favCourses, setFavCourses] = useState([]);
  const [favTutors, setFavTutors] = useState([]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || loading) return;
    if (!user?.isLoggedIn) router.push(routes.LANDING);
  }, [mounted, loading, user?.isLoggedIn, router]);

  // ---- Load favorites
  useEffect(() => {
    const load = async () => {
      if (!mounted || loading || !user?.isLoggedIn || !user?.email) return;
      setLoadingFavs(true);
      try {
        const { courses, tutors } = await FavoritesService.getFavorites(user.email);
       setFavCourses(courses);
       setFavTutors(tutors);
      } catch (e) {
        console.error("Error cargando favoritos:", e);
        setFavCourses([]); setFavTutors([]);
      } finally {
        setLoadingFavs(false);
      }
    };
    load();
  }, [mounted, loading, user?.isLoggedIn, user?.email]);

  // ---- Toggle favorites (optimista)
  const toggleCourseFavorite = async (courseId, active) => {
    if (!user?.email) return;
    const userRef = doc(db, "user", user.email);
    // optimista: si lo quitan desde la página de favoritos, lo removemos del UI
    if (active) setFavCourses((prev) => prev.filter((c) => c.id !== courseId));
    else setFavCourses((prev) => prev.concat(prev.find((c) => c.id === courseId) ?? [])); // no-op aquí normalmente
    try {
      await FavoritesService.toggleCourseFavorite(user.email, courseId, active);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleTutorFavorite = async (tutorId, active) => {
    if (!user?.email) return;
    const userRef = doc(db, "user", user.email);
    if (active) setFavTutors((prev) => prev.filter((t) => t.id !== tutorId));
    try {
      await FavoritesService.toggleTutorFavorite(user.email, tutorId, active);
    } catch (e) {
      console.error(e);
    }
  };

  // ---- Filtering
  const q = search.trim().toLowerCase();
  const filteredCourses = useMemo(() => {
    if (!q) return favCourses;
    return favCourses.filter((c) => c.name.toLowerCase().includes(q) || c.majorName.toLowerCase().includes(q));
  }, [favCourses, q]);

  const filteredTutors = useMemo(() => {
    if (!q) return favTutors;
    return favTutors.filter((t) =>
      t.name.toLowerCase().includes(q) || t.mail.toLowerCase().includes(q) || t.majorName.toLowerCase().includes(q)
    );
  }, [favTutors, q]);

  if (!mounted || loading) {
    return (
      <div className="fav-loader">
        <div className="fav-spinner" />
        <p>Cargando…</p>
      </div>
    );
  }

  return (
    <div className="fav-page">
      <main className="fav-container">
        {/* Search */}
        <div className="cal-search">
          <span className="cal-search__icon" aria-hidden>🔎</span>
          <input
            className="cal-search__input"
            placeholder="Search for subjects or tutors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Courses */}
        <section className="cal-section">
          <h2 className="cal-section__title">Favorite Courses</h2>
          {loadingFavs ? (
            <div className="fav-skeleton-list" aria-busy="true">
              <SkeletonCard /> <SkeletonCard />
            </div>
          ) : filteredCourses.length === 0 ? (
            <EmptyState text="No favorite courses yet." />
          ) : (
            <ul className="cal-list">
              {filteredCourses.map((c) => (
                <li key={c.id} className="cal-card">
                  <div className="cal-left">
                    <div className="cal-titleRow">
                      <h3 className="cal-title">{c.name}</h3>
                      <span className="cal-price">{COP(c.base_price)}</span>
                    </div>
                    <p className="cal-sub">Carrera:  {c.majorName || "—"}</p>
                    <div className="cal-actions">
                      <button className="btn-cta" onClick={() => router.push(routes.SEARCH_TUTORS)}>
                        Book Now
                      </button>
                      <FavButton active onToggle={() => toggleCourseFavorite(c.id, /*active*/ true)} />
                    </div>
                  </div>
                  <div className="cal-right" aria-hidden>
                    <DocIcon />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Tutors */}
        <section className="cal-section">
          <h2 className="cal-section__title">Favorite Tutors</h2>
          {loadingFavs ? (
            <div className="fav-skeleton-list" aria-busy="true">
              <SkeletonCard /> <SkeletonCard />
            </div>
          ) : filteredTutors.length === 0 ? (
            <EmptyState text="No favorite tutors yet." />
          ) : (
            <ul className="cal-list">
              {filteredTutors.map((t) => (
                <li key={t.id} className="cal-card">
                  <div className="cal-left">
                    <div className="cal-titleRow">
                      <h3 className="cal-title">{t.name}</h3>
                      <span className={`cal-chip ${t.isTutor ? "ok" : ""}`}>{t.isTutor ? "Tutor" : "User"}</span>
                    </div>
                    <p className="cal-sub">Carrera:  {t.majorName || "—"}</p>
                    <p className="cal-meta">
                      <a href={`mailto:${t.mail}`}>{t.mail}</a> {t.phone_number ? `· ${t.phone_number}` : ""}
                    </p>
                    <div className="cal-actions">
                      <button className="btn-cta" onClick={() => router.push(routes.SEARCH_TUTORS)}>
                        Book Now
                      </button>
                      <FavButton active onToggle={() => toggleTutorFavorite(t.id, /*active*/ true)} />
                    </div>
                  </div>
                  <div className="cal-right" aria-hidden>
                    <AvatarIcon />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

/* ---------- Helpers UI ---------- */

function FavButton({ active, onToggle }) {
  return (
    <button
      className={`btn-fav ${active ? "is-active" : ""}`}
      onClick={onToggle}
      aria-pressed={!!active}
    >
      <img
        src={active ? "/heart-filled.png" : "/heart-outline.png"}
        alt={active ? "Quitar de favoritos" : "Agregar a favoritos"}
        width={20}
        height={20}
        style={{ width: 20, height: 20, marginRight: 8 }}
      />
      <span>Favorite</span>
    </button>
  );
}


function EmptyState({ text }) {
  return <div className="fav-empty">{text}</div>;
}

function SkeletonCard() {
  return (
    <div className="cal-card cal-card--skeleton">
      <div className="skeleton skeleton--title" />
      <div className="skeleton skeleton--line" />
      <div className="skeleton skeleton--btns" />
    </div>
  );
}

function DocIcon() {
  return (
    <div className="cal-illus-wrap">
      <svg className="cal-illus" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
        <rect x="24" y="20" width="48" height="56" rx="8" fill="#E4F2EF" />
        <path d="M34 36h28v4H34zM34 46h20v4H34zM34 56h24v4H34z" fill="#2B7A78" />
      </svg>
    </div>
  );
}
function AvatarIcon() {
  return (
    <div className="cal-illus-wrap">
      <svg className="cal-illus" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
        <circle cx="48" cy="36" r="16" fill="#E4F2EF" />
        <rect x="22" y="58" width="52" height="18" rx="9" fill="#2B7A78" opacity="0.2" />
        <circle cx="48" cy="36" r="9" fill="#2B7A78" opacity="0.35" />
      </svg>
    </div>
  );
}
