// app/(auth)/login/Login.jsx
'use client';

import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../../firebaseConfig';
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from '../../context/SecureAuthContext';
import routes from 'app/routes';
import './Login.css';
import CalicoLogo from "../../../../public/CalicoLogo.png";
import Image from "next/image";

export default function Login() {
  const router = useRouter();
  const { user, login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
    if (user.isLoggedIn) {
      router.replace(routes.HOME);
    }
  }, [router, user.isLoggedIn]);

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
      
      const userRef = doc(db, 'user', form.email);
      const userSnap = await getDoc(userRef);

      let userData = { email: form.email, name: '', isTutor: false };
      
      if (userSnap.exists()) {
        const firestoreData = userSnap.data();
        userData = {
          email: form.email,
          name: firestoreData.name || '',
          isTutor: firestoreData.isTutor || false // Por defecto es estudiante
        };
      } else {
        console.warn(`No existe el usuario ${form.email} en Firestore.`);
      }
      
      // Usar el contexto para manejar el login
      login(userData);
      router.push(routes.HOME);
    } catch {
      setError('Usuario o contraseña incorrectos.');
      setLoading(false);
    }
  };

  return (
    <main className="login-page PrimaryBackground">
      <section className="login-wrapper">
        <div className="login-card">
          <div className='flex flex-col justify-center items-center'>
            <Image src={CalicoLogo} alt="Calico" className="logoImg w-28 md:w-36 " priority />
            <h2 className="login-title">Bienvenido de Vuelta!</h2>
            <div className='flex gap-1 mb-2'><p className='text-gray-600 text-bold'>Registrate para acceder a Calico</p> </div> 
          </div>
          
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
          <p className="login-text">
            ¿No tienes una cuenta?
            <span
              className="login-link"
              onClick={() => router.push(routes.REGISTER)}
            >
              &nbsp;Regístrate
            </span>
          </p>
        </div>
      </section>
      
    </main>
  );
}
