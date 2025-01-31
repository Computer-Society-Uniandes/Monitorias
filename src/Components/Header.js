// src/Components/Header.js
import React from 'react';
import'../Style/Header.css'
import { FaRegUserCircle } from "react-icons/fa";

const Header = () => {
  return (
    <>
    <header className='header'>
      <a href = "/" className='logo'>MonitorPro</a>
      <nav className='navbar'>
        <a href = "/">Inicio</a>
        <a href = "/">Explorar Materias</a>
        <a href = "/">Buscar Tutores</a>
        <a href = "/">Acerca de</a>
      </nav>
      <button href = "/" className='perfil'>
          Tu Perfil
          <FaRegUserCircle />
      </button>
    </header>
    <div className='espacio'></div>
    </>
  );
}

export default Header;