"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Users, BookOpen, Award, Clock } from "lucide-react";
import Logo from "../../../../public/CalicoLogo.png";
import Logo2 from "../../../../public/Logo2.png";
import CalicoLogo from "../../../../public/CalicoLogo.png";
import routes from "app/routes";
import styles from "./Landing.module.css";
import { useAuth } from "../../context/SecureAuthContext";

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { user, loading } = useAuth();

  /* Detectar scroll */
  useEffect(() => {
    const handleScroll = () => {
      const isScrolledNow = window.scrollY > 10;
      if (isScrolledNow !== scrolled) setScrolled(isScrolledNow);
    };
    document.addEventListener("scroll", handleScroll, { passive: true });
    return () => document.removeEventListener("scroll", handleScroll);
  }, [scrolled]);

  /* Verificar que estamos en el cliente */
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) return null;

  return (
    <>
      {/* ------------------------  HEADER  ------------------------ */}
      <header
        className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}
      >
        <div className={styles.headerInner}>
          {/* Logo */}
          <Image src={CalicoLogo} alt="Calico" className={styles.logoImg} priority />

          {/* Acciones */}
          <div className={styles.actions}>
            {user.isLoggedIn ? (
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
          {/* Modern Split Layout */}
          <div className={styles.heroContainer}>
            {/* Left Side - Content */}
            <div className={styles.heroLeft}>
              <div className={styles.heroBadge}>
                <span className={styles.heroBadgeText}>✨ Nueva Plataforma</span>
              </div>
              
              <h1 className={styles.heroTitle}>
                Conecta con los mejores 
                <span className={styles.heroTitleAccent}> monitores</span> de Uniandes
              </h1>
              
              <p className={styles.heroSubtitle}>
                Encuentra ayuda académica personalizada, programa sesiones flexibles 
                y mejora tu rendimiento con estudiantes destacados de tu universidad.
              </p>
              
              {/* Modern Benefits List */}
              <div className={styles.heroBenefits}>
                <div className={styles.heroBenefit}>
                  <div className={styles.heroBenefitCheck}>✓</div>
                  <span>Tutores verificados y calificados</span>
                </div>
                <div className={styles.heroBenefit}>
                  <div className={styles.heroBenefitCheck}>✓</div>
                  <span>Horarios flexibles 24/7</span>
                </div>
                <div className={styles.heroBenefit}>
                  <div className={styles.heroBenefitCheck}>✓</div>
                  <span>Aprendizaje personalizado</span>
                </div>
              </div>
              
              {/* CTA Buttons */}
              <div className={styles.heroCTAWrapper}>
                <button className={styles.ctaButton} onClick={() => router.push(routes.HOME)}>
                  <span>Comienza a aprender</span>
                  <span className={styles.ctaButtonIcon}>→</span>
                </button>
                <button className={styles.ctaButtonSecondary} onClick={() => router.push(routes.REGISTER)}>
                  Únete como monitor
                </button>
              </div>
            </div>
            
            {/* Right Side - Visual */}
            <div className={styles.heroRight}>
              <div className={styles.heroVisual}>
                <div className={styles.heroLogoWrapper}>
                  <Image src={Logo} alt="Monitorias Uniandes" className={styles.heroLogo} sizes="(max-width: 700px) 120vw, 650px"/>
                </div>
                
                {/* Floating Elements */}
                <div className={styles.heroFloatingElements}>
                  <div className={styles.floatingElement} style={{'--delay': '0s'}}>
                    <Users className={styles.floatingIcon} />
                  </div>
                  <div className={styles.floatingElement} style={{'--delay': '0.5s'}}>
                    <BookOpen className={styles.floatingIcon} />
                  </div>
                  <div className={styles.floatingElement} style={{'--delay': '1s'}}>
                    <Award className={styles.floatingIcon} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------  KEY POINTS  -------------------- */}
      <section className={styles.keyPoints}>
        <div className={styles.keyPointsInner}>
          <h2 className={styles.keyPointsTitle}>¿Por qué elegir Calico?</h2>
          <div className={styles.keyPointsGrid}>
            <div className={styles.keyPointCard}>
              <div className={styles.keyPointIcon}>
                <Users className={styles.keyPointIconSvg} />
              </div>
              <h3 className={styles.keyPointTitle}>Monitores Expertos</h3>
              <p className={styles.keyPointDescription}>
                Conecta con estudiantes destacados de Uniandes que han demostrado 
                excelencia académica en sus materias.
              </p>
            </div>

            <div className={styles.keyPointCard}>
              <div className={styles.keyPointIcon}>
                <Clock className={styles.keyPointIconSvg} />
              </div>
              <h3 className={styles.keyPointTitle}>Sesiones Flexibles</h3>
              <p className={styles.keyPointDescription}>
                Programa sesiones que se adapten a tu horario. Disponibilidad 
                24/7 para que estudies cuando mejor te convenga.
              </p>
            </div>

            <div className={styles.keyPointCard}>
              <div className={styles.keyPointIcon}>
                <BookOpen className={styles.keyPointIconSvg} />
              </div>
              <h3 className={styles.keyPointTitle}>Métodos Personalizados</h3>
              <p className={styles.keyPointDescription}>
                Cada sesión se adapta a tu estilo de aprendizaje y nivel actual 
                para maximizar tu comprensión y rendimiento.
              </p>
            </div>

            <div className={styles.keyPointCard}>
              <div className={styles.keyPointIcon}>
                <Award className={styles.keyPointIconSvg} />
              </div>
              <h3 className={styles.keyPointTitle}>Resultados Comprobados</h3>
              <p className={styles.keyPointDescription}>
                Estudiantes que usan Calico mejoran significativamente sus calificaciones 
                y comprensión de las materias.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------  STATISTICS  -------------------- */}
      <section className={styles.statistics}>
        <div className={styles.statisticsInner}>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>500+</div>
            <div className={styles.statLabel}>Estudiantes Activos</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>150+</div>
            <div className={styles.statLabel}>Monitores Expertos</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>1000+</div>
            <div className={styles.statLabel}>Sesiones Completadas</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>4.8</div>
            <div className={styles.statLabel}>Calificación Promedio</div>
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
