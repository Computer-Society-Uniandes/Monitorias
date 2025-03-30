"use client"

import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../../firebaseConfig';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import routes from 'app/routes';

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-indigo-50">
      <h2 className="text-2xl font-bold mb-4 text-indigo-600">Registro</h2>
      <form onSubmit={handleRegister} className="flex flex-col bg-white p-6 rounded shadow-md w-80">
        
        {/* Nombre */}
        <label className="mb-1 text-sm text-indigo-600">Nombre:</label>
        <input
          type="text"
          className="mb-3 p-2 border rounded"
          placeholder="Tu nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* Teléfono */}
        <label className="mb-1 text-sm text-indigo-600">Teléfono:</label>
        <input
          type="text"
          className="mb-3 p-2 border rounded"
          placeholder="Número de teléfono"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />

        {/* Select de majors dinámicos */}
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

        {/* Correo */}
        <label className="mb-1 text-sm text-indigo-600">Correo Uniandes:</label>
        <input
          type="email"
          className="mb-3 p-2 border rounded"
          placeholder="Tu correo @uniandes.edu.co"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Contraseña */}
        <label className="mb-1 text-sm text-indigo-600">Contraseña:</label>
        <input
          type="password"
          className="mb-3 p-2 border rounded"
          placeholder="Tu contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* Confirmar contraseña */}
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
      </form>
    </div>
  );
};

export default Register;
