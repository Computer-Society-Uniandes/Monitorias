// src/Home/pages/Home.jsx
import React, { useEffect, useState } from 'react'
import Header from '../../Components/Header'
import WelcomeBanner from '../../Components/WelcomeBanner' // rename a "WelcomeBanner"
import BoxSubject from '../../Components/BoxSubject'
import { getMaterias } from '../services/HomeService'
import { useNavigate } from 'react-router-dom'
import { auth } from '../../firebaseConfig'

const Home = () => {
  const navigate = useNavigate()
  const [materias, setMaterias] = useState([])

  // Validar si está logueado
  const userEmail = localStorage.getItem('userEmail')
  const isLoggedIn = localStorage.getItem('isLoggedIn')

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/')
      return
    }
    // Cargar materias
    getMaterias().then((materiasFromDB) => {
      setMaterias(materiasFromDB)
    })
  }, [isLoggedIn, navigate])

  return (
    <main className="min-h-screen">
      <Header />
      {/* Banner de bienvenida (antes "Welcome") */}
      <WelcomeBanner titulo={`${userEmail}`} imagenCarga="" />
      
      <div className="container pt-4 px-6">
        <h2 className="text-4xl font-bold mb-2 text-[#FF7A7A] pb-4">
          Tus materias este semestre
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
          {materias.map((materia) => (
            <BoxSubject
              key={materia.codigo}
              codigo={materia.codigo}
              nombre={materia.nombre}
            />
          ))}
        </div>
      </div>
    </main>
  )
}

export default Home
