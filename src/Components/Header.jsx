// src/Components/Header.js
import React from 'react'
import '../Style/Header.css'
import { FaRegUserCircle } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'

const Header = () => {
  const navigate = useNavigate()

  return (
    <>
      <header className="header">
        <a href="/" className="logo">MonitorPro</a>
        <nav className="navbar">
          <a href="/home">Inicio</a>
          <a href="/explore">Explorar Materias</a>
          <a href="/">Buscar Tutores</a>
          <a href="/">Acerca de</a>
        </nav>
        <button
          onClick={() => navigate('/profile')}
          className="perfil"
        >
          Tu Perfil
          <FaRegUserCircle />
        </button>
      </header>
    </>
  )
}

export default Header
