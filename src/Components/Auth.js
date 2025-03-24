// src/Components/Auth.js
import React from 'react';
import Logo from '../assets/monitoriashead.png';
import Logo2 from '../assets/cabra.png';
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const navigate = useNavigate();

  return (
    <>
      <div className='flex justify-center align-center flex-col w-full h-fit bg-gradient-to-b from-indigo-400 to-indigo-600'>
        <div className='mt-2 mx-5 flex flex-row align-middle items-center justify-between' id='header'>
          <img src={Logo2} className='h-12' alt="logo2" />
          <div id="butones">
            <button
              className='bg-gray-50 hover:bg-indigo-400 hover:text-white text-indigo-400 font-bold py-2 px-4 mr-2 rounded-full'
              onClick={() => navigate("/register")}
            >
              Regístrate
            </button>
            <button
              className='bg-transparent hover:bg-slate-500 text-gray-50 font-semibold hover:text-white py-2 px-4 border border-gray-50 hover:border-transparent rounded-full'
              onClick={() => navigate("/login")}
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
        
        <div className='m-12 flex justify-center'>
          <img src={Logo} className='h-52' alt="logo1" />
        </div>

        <div className="h-50 w-full bg-white rounded-tl-full rounded-tr-full ">
          <div className='flex justify-center m-12 '>
            <button className='bg-red-400 hover:bg-red-300 text-white font-bold py-2 px-4 rounded-full'>
              Empieza ahora -&gt;
            </button>
          </div>
        </div>
      </div> 

      <div className='flex justify-center flex-col' >
        <h2 className='mb-2 mt-0 text-5xl font-bold leading-tight text-indigo-400  text-center'>
          Sobre Nosotros
        </h2>
        <p className='text-2xl text-gray-800 text-center'>
          fraoghfiafejwkal
        </p>
      </div>
    </>
  );
};

export default Auth;
