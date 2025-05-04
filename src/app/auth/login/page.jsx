"use client"
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../firebaseConfig";
import { useRouter } from 'next/navigation'
import routes from 'app/routes';

const Login = () => {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem("userEmail", email);
      localStorage.setItem("isLoggedIn", "true");
      router.push(routes.HOME)
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      alert("Usuario o contraseña incorrectos.");
    }
  };

  return (
    <div>
    {/* <div className="flex flex-col items-center justify-center h-screen bg-indigo-50">
      <h2 className="text-2xl font-bold mb-4 text-indigo-600">Iniciar Sesión</h2>
      <form onSubmit={handleLogin} className="flex flex-col bg-white p-6 rounded shadow-md">
        
        <label className="mb-2 text-sm text-indigo-600">Correo:</label>
        <input
          type="email"
          className="mb-4 p-2 border rounded"
          placeholder="Tu correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        
        <label className="mb-2 text-sm text-indigo-600">Contraseña:</label>
        <input
          type="password"
          className="mb-4 p-2 border rounded"
          placeholder="Tu contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="bg-indigo-500 cursor-pointer hover:bg-indigo-600 text-white py-2 px-4 rounded"
        >
          Iniciar Sesión
        </button>
      </form>
    </div> */}

    <div
      className={`relative w-full overflow-hidden bg-gradient-to-b from-indigo-500 to-indigo-900 h-screen`}
    >
    
        {/* Capa de degradado */}
        <div
          className="absolute w-full h-full"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0) 30%, rgba(76, 81, 191, 0.3) 70%)",
            borderRadius: "50% 50% 0 0 / 100% 100% 0 0",
            transform: "scaleX(1.5)",
            bottom: "-30%",
            left: 0,
            right: 0,
          }}
        />

      {/*Contenedor */}
      <div className='flex w-full h-screen z-10 items-center justify-center overflow-auto p-4'>
        <div className='flex flex-col bg-white rounded-xl p-12 shadow-md w-100 h-fit justify-center items-center mt-10'>
          <h2 className="text-3xl font-bold mb-4 text-indigo-400">Inicia Sesión</h2>
          <div className='flex gap-1'><p className='text-indigo-400'>¿No tienes una cuenta? </p> <p onClick={()=>router.push(routes.REGISTER)} className='text-indigo-600 underline hover:cursor-pointer'> Regístrate</p></div>  
          
          <form onSubmit={handleLogin} className="flex flex-col p-6 w-full">
          <label className="mb-2 text-sm text-slate-500">Correo</label>
            <input
              type="email"
              className="mb-4 p-2 border rounded-lg placeholder:text-gray-200 text-sm"
              placeholder="Tu correo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            
            <label className="mb-2 text-sm text-slate-500">Contraseña</label>
            <input
              type="password"
              className="mb-4 p-2 border rounded-lg placeholder:text-gray-200 text-sm"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="submit"
              className="bg-indigo-500 cursor-pointer hover:bg-indigo-600 text-white py-2 px-4 rounded-lg"
            >
              Iniciar Sesión
            </button>
          </form>
        </div>
      </div>
    
    </div>
    </div>
    );
};

export default Login;
