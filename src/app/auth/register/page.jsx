"use client";

import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../../firebaseConfig';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/SecureAuthContext';
import routes from 'app/routes';
import { FcGoogle } from "react-icons/fc";
import CalicoLogo from "../../../../public/CalicoLogo.png";
import Image from "next/image";
import './register.css';


const Register = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [majors, setMajors] = useState([]);   // Lista dinámica de carreras
  const [selectedMajor, setSelectedMajor] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 1. Cargar los docs de la colección "major" al montar el componente
  useEffect(() => {
    const fetchMajors = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "major"));
        const majorArray = [];
        querySnapshot.forEach((docSnap) => {
          majorArray.push({
            id: docSnap.id,        // p.e. IELE, IIND, ISIS
            name: docSnap.data().name, // p.e. "Ingeniería Eléctrica y Electrónica"
          });
        });
        setMajors(majorArray);
      } catch (error) {
        console.error("Error al cargar majors:", error);
      }
    };

    fetchMajors();
  }, []);

  // 2. Manejo del registro
  const handleRegister = async (e) => {
    e.preventDefault();

    // Validaciones de campos
    if (!name || !phoneNumber || !selectedMajor || !email || !password || !confirmPassword) {
      alert("Todos los campos son obligatorios.");
      return;
    }
    if (password !== confirmPassword) {
      alert("Las contraseñas no coinciden.");
      return;
    }


    try {
      // 3. Crear usuario en Firebase Auth
      await createUserWithEmailAndPassword(auth, email, password);

      // 4. Guardar datos adicionales en Firestore, usando el CORREO como ID
      await setDoc(doc(db, "user", email), {
        name,
        mail: email,
        phone_number: phoneNumber,
        // Guardamos una referencia a la carrera en "major"
        major: doc(db, "major", selectedMajor),
        // Por defecto, todos los usuarios se registran como estudiantes
        isTutor: false
      });

      // 5. Usar el contexto de autenticación para el login automático
      const userData = {
        email,
        name,
        isTutor: false // Por defecto es estudiante
      };
      
      login(userData);

      alert("Registro exitoso");
      router.push(routes.HOME); // Ir directo al home después del registro
    } catch (error) {
      console.error("Error al registrar:", error);
      alert("No se pudo registrar el usuario.");
    }
  };

  return (
    <div>
     
    <div
        className={`relative w-full overflow-hidden PrimaryBackground min-h-screen`}
      >
        {/* Capa de degradado */}
        <div
          className="absolute w-full h-full pointer-events-none"
          style={{
            borderRadius: "50% 50% 0 0 / 100% 100% 0 0",
            transform: "scaleX(1.5)",
            bottom: "-30%",
            left: 0,
            right: 0,
          }}
        />

      {/*Contenedor */}
      <div className='flex w-full min-h-screen z-10 items-center justify-center overflow-y-auto pb-10'>

      <div className='flex flex-col bg-white rounded-xl p-12 shadow-md w-fit h-fit justify-center items-center mt-10'>
        <Image src={CalicoLogo} alt="Calico" className="logoImg w-28 md:w-36 mb-4" priority />
        <h2 className="text-3xl font-bold mb-2 text-gray-700">Crea una cuenta</h2>

        <div className='flex gap-1 mb-2'><p className='text-gray-600 text-bold'>Registrate para acceder a Calico</p> </div>  
        
        
        <form onSubmit={handleRegister} className="flex flex-col mt-1 justify-center items-center">
        
        {/*Login con alguna otra cuenta */}
        <div className='mb-4 gap-2 justify-center items-center flex flex-row 
          align-middle google bg-white border-[#e0e0e0] md:w-1/2 border rounded-lg px-2 py-2 hover:bg-[#e0e0e0] transition duration-300 cursor-pointer'>
            <div>
              <FcGoogle className='text-2xl' />
            </div>

            <div>
                <p className='text-center text-sm text-slate-500'>Continua con Google</p>
            </div> 
        </div>

        <div className='spacer'>
            <p className='text-[#d1d1d1] text-center text-md'>––––––––   &nbsp; o &nbsp;   ––––––––</p>
        </div>

          {/*nombre */}
         <div className='flex flex-col gap-6 w-full md:flex-row mt-4'>
          <div className='flex flex-col w-3xs md:w-2xs'>
          <label className="mb-1 text-sm text-slate-500">Nombre</label>
          <input
            type="text"
            className="mb-3 p-2 border rounded-lg placeholder:text-gray-400 text-sm"
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {/*telefono */}
          <label className="mb-1 text-sm text-slate-500">Teléfono</label>
          <input
            type="text"
            className="mb-3 p-2 border rounded-lg placeholder:text-gray-400 text-sm"
            placeholder="Número de teléfono"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />

          {/*carrera */}
          <label className="mb-1 text-sm text-slate-500">Carrera</label>
          <select
            className="mb-3 p-2 border rounded-lg placeholder:text-gray-400 text-sm"
            value={selectedMajor}
            onChange={(e) => setSelectedMajor(e.target.value)}
          >
            <option value="">Seleccione...</option>
            {majors.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          </div>

              {/*correo */}
        <div className='flex flex-col w-3xs md:w-2xs'>
        <label className="mb-1 text-sm text-slate-500">Correo Uniandes</label>
        <input
          type="email"
          className="mb-3 p-2 border rounded-lg placeholder:text-gray-200 text-sm"
          placeholder="Tu correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

              {/*contraseña */}
        <label className="mb-1 text-sm text-slate-500">Contraseña</label>
        <input
          type="password"
          className="mb-3 p-2 border rounded-lg placeholder:text-gray-400 text-sm"
          placeholder="Tu contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label className="mb-1 text-sm text-slate-500">Confirmar contraseña</label>
        <input
          type="password"
          className="mb-4 p-2 border rounded-lg placeholder:text-gray-400 text-sm"
          placeholder="Repite tu contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        </div>
        </div>

          <button
            type="submit"
            className="SecondaryBackground text-gray-700 py-2 px-4 rounded-lg w-1/2 md:w-50 mt-4"
          >
            Registrarme
          </button>
        </form>
        <div className='flex gap-1 pt-3'><p className='text-gray-500'>¿Ya tienes una cuenta? </p> <p onClick={()=>router.push(routes.LOGIN)} className='text-orange-600 underline hover:cursor-pointer'> Inicia sesión</p></div>  
      </div>

      </div>


  </div>


    </div>
  );
};

export default Register;
