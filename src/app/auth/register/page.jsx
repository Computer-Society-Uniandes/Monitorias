"use client"

import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../../firebaseConfig';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import routes from 'app/routes';
import { FcGoogle } from "react-icons/fc";


const Register = () => {
  const router = useRouter();
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
    if (!email.endsWith("@uniandes.edu.co")) {
      alert("Solo se permite registrar con correos @uniandes.edu.co");
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
      });

      // 5. Guardar credenciales en localStorage y redirigir
      localStorage.setItem("userEmail", email);
      localStorage.setItem("isLoggedIn", "true");

      alert("Registro exitoso");
      router.push(routes.LANDING)
    } catch (error) {
      console.error("Error al registrar:", error);
      alert("No se pudo registrar el usuario.");
    }
  };

  return (
    <div>
      {/* <h2 className="text-2xl font-bold mb-4 text-indigo-600">Registro</h2>
      <form onSubmit={handleRegister} className="flex flex-col bg-white p-6 rounded shadow-md w-80">
        
        <label className="mb-1 text-sm text-indigo-600">Nombre:</label>
        <input
          type="text"
          className="mb-3 p-2 border rounded"
          placeholder="Tu nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label className="mb-1 text-sm text-indigo-600">Teléfono:</label>
        <input
          type="text"
          className="mb-3 p-2 border rounded"
          placeholder="Número de teléfono"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />

        <label className="mb-1 text-sm text-indigo-600">Carrera (Major):</label>
        <select
          className="mb-3 p-2 border rounded"
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

        <label className="mb-1 text-sm text-indigo-600">Correo Uniandes:</label>
        <input
          type="email"
          className="mb-3 p-2 border rounded"
          placeholder="Tu correo @uniandes.edu.co"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="mb-1 text-sm text-indigo-600">Contraseña:</label>
        <input
          type="password"
          className="mb-3 p-2 border rounded"
          placeholder="Tu contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label className="mb-1 text-sm text-indigo-600">Repetir Contraseña:</label>
        <input
          type="password"
          className="mb-4 p-2 border rounded"
          placeholder="Repite tu contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button
          type="submit"
          className="bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded"
        >
          Registrarme
        </button>
      </form> */}

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

      <div className='flex flex-col bg-white rounded-xl p-12 shadow-md w-fit h-fit justify-center items-center mt-10'>
        <h2 className="text-3xl font-bold mb-4 text-indigo-400">Regístrate</h2>
        
        <div className='flex gap-1'><p className='text-indigo-400'>¿Ya tienes una cuenta? </p> <p onClick={()=>router.push(routes.LOGIN)} className='text-indigo-600 underline hover:cursor-pointer'> Inicia sesión</p></div>  
        <form onSubmit={handleRegister} className="flex flex-col mt-6 justify-center items-center">
        
        <div className='mb-4 gap-2 justify-center items-center flex flex-row 
          align-middle google bg-white border-[#e0e0e0] w-1/2 border rounded-lg px-2 py-2 hover:bg-[#e0e0e0] transition duration-300 cursor-pointer'>
            <div>
              <FcGoogle className='text-2xl' />
            </div>

            <div>
                <p className='text-center text-sm text-slate-500'>Continua con Google</p>
            </div> 
        </div>

        <div className='spacer'>
            <p className='text-[#E5E5E5] text-center text-md'>––––––––   &nbsp; o &nbsp;   ––––––––</p>
        </div>

         <div className='flex flex-col gap-6 w-full md:flex-row mt-4'>
          <div className='flex flex-col w-3xs md:w-2xs'>
          <label className="mb-1 text-sm text-slate-500">Nombre</label>
          <input
            type="text"
            className="mb-3 p-2 border rounded-lg placeholder:text-gray-200 text-sm"
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label className="mb-1 text-sm text-slate-500">Teléfono</label>
          <input
            type="text"
            className="mb-3 p-2 border rounded-lg placeholder:text-gray-200 text-sm"
            placeholder="Número de teléfono"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />

          <label className="mb-1 text-sm text-slate-500">Carrera</label>
          <select
            className="mb-3 p-2 border rounded-lg placeholder:text-gray-200 text-sm"
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

        <div className='flex flex-col w-3xs md:w-2xs'>
        <label className="mb-1 text-sm text-slate-500">Correo Uniandes</label>
        <input
          type="email"
          className="mb-3 p-2 border rounded-lg placeholder:text-gray-200 text-sm"
          placeholder="Tu correo @uniandes.edu.co"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="mb-1 text-sm text-slate-500">Contraseña</label>
        <input
          type="password"
          className="mb-3 p-2 border rounded-lg placeholder:text-gray-200 text-sm"
          placeholder="Tu contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label className="mb-1 text-sm text-slate-500">Confirmar contraseña</label>
        <input
          type="password"
          className="mb-4 p-2 border rounded-lg placeholder:text-gray-200 text-sm"
          placeholder="Repite tu contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        </div>
        </div>

          <button
            type="submit"
            className="bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded-lg w-1/2 md:w-50 mt-4"
          >
            Registrarme
          </button>
        </form>
      </div>

      </div>


  </div>


    </div>
  );
};

export default Register;
