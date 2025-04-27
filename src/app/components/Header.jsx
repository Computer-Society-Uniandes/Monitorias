// src/Components/Header.js
import React from 'react';
import'../style/Header.css'
import { UserRound } from 'lucide-react';
import Link from 'next/link';
import routes from 'app/routes';

const Header = () => {
  return (
    <>
    <header className='header'>
      <Link href = "/" className='logo'>Calico</Link>
      <nav className='navbar'>
        <Link href = {routes.HOME}>Inicio</Link>
        <Link href = {routes.EXPLORE}>Explorar Materias</Link>
        <Link href = "/">Buscar Tutores</Link>
        <Link href = "/">Acerca de</Link>
      </nav>
      <button href = {routes.PROFILE} className='perfil'>
          Tu Perfil
          <UserRound />
      </button>
    </header>
    </>
  );
}

export default Header;
