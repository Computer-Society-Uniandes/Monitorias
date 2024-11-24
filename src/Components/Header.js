// src/Components/Header.js
import React from 'react';
import'../Style/Header.css'

const Header = () => {
  return (
    <header className='header'>
      <a href = "/" className='logo'>MonitorPro</a>
      <nav className='navbar'>
        <a href = "/">Inicio</a>
        <a href = "/">Explorar Materias</a>
        <a href = "/">Buscar Tutores</a>
        <a href = "/">Acerca de</a>
      </nav>
      
    </header>
  );
}

export default Header;