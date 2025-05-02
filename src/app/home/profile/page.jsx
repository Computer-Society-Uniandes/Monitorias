// src/app/home/profile/Profile.jsx

'use client';

import React, { useEffect, useState } from 'react'
import { auth, db } from '../../../firebaseConfig'
import { doc, getDoc } from 'firebase/firestore'
import Header from '../../components/Header'
import { useRouter } from 'next/navigation'
import routes from 'app/routes'

const Profile = () => {
  const [userData, setUserData] = useState(null)
  const [majorName, setMajorName] = useState('')

  const router = useRouter();
  
  const userEmail = localStorage.getItem('userEmail')
  const isLoggedIn = localStorage.getItem('isLoggedIn')

  // Cargar datos de perfil
  useEffect(() => {
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
    <di>
        
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <h1 className="text-3xl font-bold mb-6">Perfil del Usuario</h1>
        <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
            <p><strong>Nombre:</strong> {userData.name}</p>
            <p><strong>Teléfono:</strong> {userData.phone_number}</p>
            <p><strong>Correo:</strong> {userEmail}</p>
            <p><strong>Carrera:</strong> {majorName || 'No definida'}</p>

            <button
            onClick={handleLogout}
            className="mt-4 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
            >
            Cerrar Sesión
            </button>
        </div>
        </div>
    </di>
    
  )
}

export default Profile
