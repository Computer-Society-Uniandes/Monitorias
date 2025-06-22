// src/app/home/profile/Profile.jsx

'use client';

import React, { useEffect, useState } from 'react'
import { auth, db } from '../../../firebaseConfig'
import { doc, getDoc } from 'firebase/firestore'
import Header from '../../components/Header/Header'
import { useRouter } from 'next/navigation'
import routes from 'app/routes'
import './Profile.css'

const Profile = () => {
  const [userData, setUserData] = useState(null)
  const [majorName, setMajorName] = useState('')
  const [userEmail, setUserEmail] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(null)

  // const userEmail = localStorage.getItem('userEmail')
  // const isLoggedIn = localStorage.getItem('isLoggedIn')

  const router = useRouter();
  
  useEffect(() => {
    const email = localStorage.getItem('userEmail')
    const loggedIn = localStorage.getItem('isLoggedIn')

    setUserEmail(email)
    setIsLoggedIn(loggedIn)
  }, [])

  // Cargar datos de perfil
  useEffect(() => {
    if (isLoggedIn === null) return; 
    // Si no está logueado, redirige
    if (!isLoggedIn) {
      router.push(routes.LANDING)
      return
    }
    if (!userEmail) return

    const fetchUserData = async () => {
      try {
        // 1. Obtener doc del usuario
        const userDocRef = doc(db, 'user', userEmail)
        const userSnap = await getDoc(userDocRef)
        if (userSnap.exists()) {
          const data = userSnap.data()
          setUserData(data)

          // 2. Cargar el nombre de la carrera (major), si es una referencia
          if (data.major) {
            const majorSnap = await getDoc(data.major)
            if (majorSnap.exists()) {
              setMajorName(majorSnap.data().name)
            }
          }
        } else {
          console.log('Usuario no encontrado en Firestore')
        }
      } catch (error) {
        console.error('Error al obtener datos del usuario:', error)
      }
    }

    fetchUserData()
  }, [isLoggedIn, userEmail, router])

  const handleLogout = () => {
    auth.signOut()
    localStorage.removeItem('userEmail')
    localStorage.removeItem('isLoggedIn')
    router.push(routes.LANDING)
  }

  if (!userData) {
    return <div className="p-6">Cargando perfil...</div>
  }

  return (
    <div className='background-profile'>
         <div className="absolute bottom-0 left-0 w-full z-0">
      <svg className="w-full h-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
      <path fill="#1A237E" fillOpacity="1" d="M0,192L40,181.3C80,171,160,149,240,117.3C320,85,400,43,480,69.3C560,96,640,192,720,197.3C800,203,880,117,960,74.7C1040,32,1120,32,1200,64C1280,96,1360,160,1400,192L1440,224L1440,320L1400,320C1360,320,1280,320,1200,320C1120,320,1040,320,960,320C880,320,800,320,720,320C640,320,560,320,480,320C400,320,320,320,240,320C160,320,80,320,40,320L0,320Z"></path>
      </svg>
    </div>
        <div className="relative z-10 max-w-4xl mx-auto bg-white rounded-xl shadow p-8 mt-10 justify-items-center">
        <h1 className="text-3xl font-bold mb-6 title">Perfil del Usuario</h1>
        <div class="row-span-3"><img
        //placeholder sacado de https://avatar-placeholder.iran.liara.run/
            src='https://avatar.iran.liara.run/public/40' // Cambiar esto por la imagen del usuario
            alt="Foto de perfil"
            className="w-32 h-32 rounded-full object-cover border border-gray-300"
          /></div>
        <div className="bg-white p-10 rounded inset-shadow-sm w-full mx-auto mt-5 max-w-3xl">

          
            {/* aqui se debe cambiar por los datos del usuario */}
            <p className='text-info'><strong className='text-campos'>Nombre: </strong> {userData.name}</p>
            <p className='text-info'><strong className='text-campos'>Teléfono: </strong>{userData.phone_number} </p>
            <p className='text-info'><strong className='text-campos'>Correo: </strong>{userEmail} </p>
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
    </div>
    
  )
}

export default Profile