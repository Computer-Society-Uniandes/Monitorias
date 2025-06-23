"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Users, BookOpen, Award, Clock } from "lucide-react";
import Logo from "../../../../public/Logo.png";
import Logo2 from "../../../../public/Logo2.png";
import routes from "app/routes";
import styles from "./Landing.module.css";

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  /* Detectar scroll */
  useEffect(() => {
    const handleScroll = () => {
      const isScrolledNow = window.scrollY > 10;
      if (isScrolledNow !== scrolled) setScrolled(isScrolledNow);
    };
    document.addEventListener("scroll", handleScroll, { passive: true });
    return () => document.removeEventListener("scroll", handleScroll);
  }, [scrolled]);

  /* Leer flag de login solo en cliente */
  useEffect(() => {
    setMounted(true);
    setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* ------------------------  HEADER  ------------------------ */}
      <header
        className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}
      >
        <div className={styles.headerInner}>
          {/* Logo */}
          <Image src={Logo2} alt="Logo cabra" className={styles.logoImg} priority />

          {/* Acciones */}
          <div className={styles.actions}>
            {isLoggedIn ? (
              <button
                className={`${styles.btn} ${
                  scrolled ? styles.btnSecondaryScrolled : styles.btnSecondary
                }`}
                onClick={() => router.push(routes.PROFILE)}
              >
                Ver Perfil
              </button>
            ) : (
              <>
                <button
                  className={`${styles.btn} ${
                    scrolled ? styles.btnPrimaryScrolled : styles.btnPrimary
                  }`}
                  onClick={() => router.push(routes.REGISTER)}
                >
                  Regístrate
                </button>
                <button
                  className={`${styles.btn} ${
                    scrolled ? styles.btnSecondaryScrolled : styles.btnSecondary
                  }`}
                  onClick={() => router.push(routes.LOGIN)}
                >
                  Iniciar Sesión
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ------------------------  HERO  -------------------------- */}
      <section
        className={`${styles.hero} ${
          scrolled ? styles.heroHidden : styles.heroVisible
        }`}
      >
        <div className={styles.heroInner}>
          <div className={styles.heroLogoWrapper}>
            <Image src={Logo} alt="Monitorias Uniandes" className={styles.heroLogo} sizes="(max-width: 540px) 70vw, 420px"/>
          </div>
          <div className={styles.heroBottom}>
            <div className={styles.heroCTAWrapper}>
              <button className={styles.ctaButton} onClick={() => router.push(routes.HOME)}>
                Empieza ahora
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------  ABOUT  ------------------------- */}
      <section className={styles.about}>
        <div className={styles.aboutInner}>
          <h2 className={styles.sectionTitle}>Sobre Nosotros</h2>
          <div className={styles.sectionLine} />
          <p className={styles.sectionText}>
            Somos un equipo comprometido con conectar a estudiantes con monitores
            dispuestos a ayudar. Facilitamos el aprendizaje a través de una
            plataforma que promueve la confianza y una conexión efectiva,
            asegurando una experiencia de apoyo accesible y de calidad.
          </p>
        </div>

        {/* ------------ FEATURES GRID ------------- */}
        <div className={styles.featuresGrid}>
          {/* Card 1 */}
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Users />
            </div>
            <h3 className={styles.featureTitle}>Comunidad</h3>
            <p className={styles.featureText}>
              Creamos una comunidad de aprendizaje colaborativo entre estudiantes
              y monitores.
            </p>
          </div>

          {/* Card 2 */}
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <BookOpen />
            </div>
            <h3 className={styles.featureTitle}>Aprendizaje</h3>
            <p className={styles.featureText}>
              Facilitamos el proceso de aprendizaje con metodologías efectivas y
              personalizadas.
            </p>
          </div>

          {/* Card 3 */}
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Award />
            </div>
            <h3 className={styles.featureTitle}>Calidad</h3>
            <p className={styles.featureText}>
              Garantizamos monitores de alta calidad, seleccionados por su
              excelencia académica.
            </p>
          </div>

          {/* Card 4 */}
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Clock />
            </div>
            <h3 className={styles.featureTitle}>Flexibilidad</h3>
            <p className={styles.featureText}>
              Ofrecemos horarios flexibles que se adaptan a las necesidades de
              cada estudiante.
            </p>
          </div>
        </div>

        {/* ----------------  MISIÓN ---------------- */}
        <div className={styles.mission}>
          <div className={styles.missionContent}>
            <h3 className={styles.missionTitle}>Nuestra Misión</h3>
            <p className={styles.missionText}>
              Transformar la experiencia educativa en Uniandes, creando un
              ecosistema donde el conocimiento fluya libremente entre
              estudiantes. Buscamos eliminar barreras en el aprendizaje y
              fomentar una cultura de colaboración y excelencia académica.
            </p>
          </div>
          <div className={styles.missionEmojiWrapper}>
            <div className={styles.missionEmojiCircle}>🎓</div>
          </div>
        </div>
      </section>
    </>
  );
}
