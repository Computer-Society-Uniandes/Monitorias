// src/Components/Header.js
'use client';

import React from 'react';
import'./Header.css'
import { UserRound } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from "next/navigation"
import routes from "app/routes"

const Header = () => {
  const router = useRouter();
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
      <button 
        className={'perfil'} 
        onClick={()=>router.push(routes.PROFILE) } >
          Tu Perfil
          <UserRound />
      </button>
    </header>
    </>
  );
}

export default Header;
