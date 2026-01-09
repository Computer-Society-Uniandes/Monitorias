// app/(auth)/login/Login.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/SecureAuthContext';
import { useI18n } from '../../../lib/i18n';
import routes from '../../../routes';
import './Login.css';
import CalicoLogo from "../../../../public/CalicoLogo.png";
import Image from "next/image";

export default function Login() {
  const router = useRouter();
  const { user, login } = useAuth();
  const { t } = useI18n();
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
    // try {
      const result = await login({ email: form.email, password: form.password });
      if (result?.success) router.push(routes.HOME);
      else setError('Login failed');
    // } catch (error) {
    //   let errorMessage = t('auth.login.errors.generic');
    //   const code = error?.body?.code || error?.code || error?.message;
    //   switch (code) {
    //     case 'EMAIL_NOT_FOUND':
    //     case 'auth/user-not-found':
    //       errorMessage = t('auth.login.errors.userNotFound');
    //       break;
    //     case 'INVALID_PASSWORD':
    //     case 'auth/wrong-password':
    //       errorMessage = t('auth.login.errors.wrongPassword');
    //       break;
    //     default:
    //       errorMessage = t('auth.login.errors.generic');
    //   }
    //   setError(errorMessage);
    // } finally {
    //   setLoading(false);
    // }
  };


  return (
    <main className="login-page PrimaryBackground">
      <section className="login-wrapper">
        <div className="login-card">
          <div className='flex flex-col justify-center items-center'>
            <Image src={CalicoLogo} alt="Calico" className="logoImg w-28 md:w-36 " priority />
            <h2 className="login-title">{t('auth.login.subtitle')}</h2>
            <div className='flex gap-1 mb-2'><p className='text-gray-600 text-bold'>{t('auth.login.subtitle')}</p> </div> 
          </div>
          
          <form onSubmit={handleSubmit} className="login-form">
            <label htmlFor="email" className="login-label">
              {t('auth.login.email')}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="login-input"
              placeholder={t('auth.login.emailPlaceholder')}
              value={form.email}
              onChange={handleChange}
              required
            />

            <label htmlFor="password" className="login-label">
              {t('auth.login.password')}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="login-input"
              placeholder={t('auth.login.passwordPlaceholder')}
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
              {loading ? t('auth.login.loading') : t('auth.login.loginButton')}
            </button>
          </form>
          <p className="login-text">
            {t('auth.login.noAccount')}
            <span
              className="login-link"
              onClick={() => router.push(routes.REGISTER)}
            >
              &nbsp;{t('auth.login.signUp')}
            </span>
          </p>
        </div>
      </section>
      
    </main>
  );
}
