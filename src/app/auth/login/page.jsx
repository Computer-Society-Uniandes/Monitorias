// app/(auth)/login/Login.jsx
'use client';

import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../../firebaseConfig';
import { doc, getDoc } from "firebase/firestore";
import routes from 'app/routes';
import './Login.css';

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
    if (localStorage.getItem('isLoggedIn') === 'true') {
      router.replace(routes.HOME);
    }
  }, [router]);

  if (!mounted) return null;

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      localStorage.setItem('userEmail', form.email);
      localStorage.setItem('isLoggedIn', 'true');
      const userRef = doc(db, 'user', form.email);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const { name } = userSnap.data();
        localStorage.setItem('userName', name);
      } else {
        console.warn(`No existe el usuario ${form.email} en Firestore.`);
      }
      
      router.push(routes.HOME);
    } catch {
      setError('Usuario o contraseña incorrectos.');
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-wrapper">
        <div className="login-card">
          <h2 className="login-title">Inicia Sesión</h2>
          <p className="login-text">
            ¿No tienes una cuenta?
            <span
              className="login-link"
              onClick={() => router.push(routes.REGISTER)}
            >
              &nbsp;Regístrate
            </span>
          </p>

          <form onSubmit={handleSubmit} className="login-form">
            <label htmlFor="email" className="login-label">
              Correo
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="login-input"
              placeholder="Tu correo"
              value={form.email}
              onChange={handleChange}
              required
            />

            <label htmlFor="password" className="login-label">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="login-input"
              placeholder="Tu contraseña"
              value={form.password}
              onChange={handleChange}
              required
            />

            {error && <p className="login-error">{error}</p>}

            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading ? 'Cargando...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
