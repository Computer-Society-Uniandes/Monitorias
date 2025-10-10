'use client';

import React, { useEffect, useState } from 'react';
import { db } from '../../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import Header from '../../components/Header/Header';
import { useRouter } from 'next/navigation';
import routes from 'app/routes';
import './Profile.css';
import { useAuth } from '../../context/SecureAuthContext';

const TUTOR_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdxeOSt5jjjSVtXY9amQRiXeufm65-11N4FMvJ96fcxyiN58A/viewform?usp=sharing&ouid=102056237631790140503'; 

// Modal de invitación (accesible y responsive)
function TutorInviteModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="inviteTitle">
      <div className="modal-card">
        <h3 id="inviteTitle" className="modal-title">¿Quieres ser tutor?</h3>
        <p className="modal-text">
          Aún no tienes habilitado el perfil de tutor. Completa el formulario para solicitar acceso.
        </p>
        <div className="modal-actions">
          <a
            href={TUTOR_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-header btn-header--primary"
          >
            Ir al formulario
          </a>
          <button className="btn-header" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}



const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [majorName, setMajorName] = useState('');
  const [activeRole, setActiveRole] = useState('student'); // 'student' | 'tutor'
  const [inviteOpen, setInviteOpen] = useState(false);

  const router = useRouter();
  const { user, loading, logout } = useAuth();

  // Cargar datos de perfil
  useEffect(() => {
    // Don't run any client-only or user-dependent logic while auth is loading
    if (loading) return;

    // user may be null during server prerender — guard access
    if (!user || !user.isLoggedIn) {
      // Only redirect on the client
      if (typeof window !== 'undefined') {
        router.push(routes.LANDING);
      }
      return;
    }

    if (!user.email) return;

    const fetchUserData = async () => {
      try {
        const userDocRef = doc(db, 'user', user.email);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData(data || null);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();

    // Only access localStorage on the client
    const saved = typeof window !== 'undefined' ? localStorage.getItem('rol') : null;

    if (user.isTutor && saved === 'tutor') {
      setActiveRole('tutor');
    } else {
      // Por defecto estudiante
      if (typeof window !== 'undefined') {
        localStorage.setItem('rol', 'student');
      }
      setActiveRole('student');
    }
  }, [loading, user, router]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      localStorage.setItem('rol', 'student');
      setActiveRole('student');
      notifyRoleChange('student');
      router.push(routes.LANDING);
    }
  };

  // Intentar cambiar a modo tutor desde el perfil
  const handleChangeRole = () => {
    if (!user.isTutor) {
      setInviteOpen(true);
      return;
    }
    localStorage.setItem('rol', 'tutor');
    setActiveRole('tutor');
    notifyRoleChange('tutor');
  };

  const handleBackToStudent = () => {
    localStorage.setItem('rol', 'student');
    setActiveRole('student');
    notifyRoleChange('student');
  };


  // const handleLogout = () => {
  //   auth.signOut()
  //   localStorage.removeItem('userEmail')
  //   localStorage.removeItem('isLoggedIn')
  //   router.push(routes.LANDING)
  // }

  // if (!userData) {
  //   return <div className="p-6">Cargando perfil...</div>
  // }

  const notifyRoleChange = (next) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('role-change', { detail: next }));
    }
  };


  return (
    <div className='background-profile'>
         <div className="absolute bottom-0 left-0 w-full z-0">
      <svg className="w-full h-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
      <path fill="#1A237E" fillOpacity="1" d="M0,192L40,181.3C80,171,160,149,240,117.3C320,85,400,43,480,69.3C560,96,640,192,720,197.3C800,203,880,117,960,74.7C1040,32,1120,32,1200,64C1280,96,1360,160,1400,192L1440,224L1440,320L1400,320C1360,320,1280,320,1200,320C1120,320,1040,320,960,320C880,320,800,320,720,320C640,320,560,320,480,320C400,320,320,320,240,320C160,320,80,320,40,320L0,320Z"></path>

      </svg>
    </div>
        <div className="relative z-10 max-w-4xl mx-auto bg-white rounded-xl shadow p-8 mt-10 justify-items-center">
        <h1 className="text-3xl font-bold mb-6 title">Perfil del Usuario</h1>
        <div className="row-span-3"><img

        //placeholder sacado de https://avatar-placeholder.iran.liara.run/
            src='https://avatar.iran.liara.run/public/40' // Cambiar esto por la imagen del usuario
            alt="Foto de perfil"
            className="w-32 h-32 rounded-full object-cover border border-gray-300"
          /></div>
        <div className="bg-white p-10 rounded inset-shadow-sm w-full mx-auto mt-5 max-w-3xl">

          
            {/* aqui se debe cambiar por los datos del usuario */}
            <p className='text-info'><strong className='text-campos'>Nombre: </strong> {userData?.name || 'No definido'}</p>
            <p className='text-info'><strong className='text-campos'>Teléfono: </strong>{userData?.phone_number || 'No definido'} </p>
            <p className='text-info'><strong className='text-campos'>Correo: </strong>{user?.email || 'No definido'} </p>
            <p className='text-info'><strong className='text-campos'>Carrera:</strong> {majorName || 'No definida'}</p>

            <button
            className="mt-4 btn-editar text-white py-2 px-4 rounded"
            >
            Editar Perfil
            </button>
            <button
            onClick={handleLogout}

            className="mt-4 btn-logout text-white py-2 px-4 rounded mx-4"
            >
            Cerrar Sesión
            </button>
        </div>
        </div>

      {/* Modal */}
      <TutorInviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
};

export default Profile;
