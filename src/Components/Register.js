// src/Components/Register.js
import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [major, setMajor] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Lista estática de majors; en un caso real podrías cargarlos desde Firestore
  const majors = [
    { value: "ingenieria-sistemas", label: "Ingeniería de Sistemas" },
    { value: "ingenieria-industrial", label: "Ingeniería Industrial" },
    { value: "ingenieria-electrica", label: "Ingeniería Eléctrica" },
    { value: "medicina", label: "Medicina" },
    { value: "economia", label: "Economía" },
    // Agrega más carreras aquí...
  ];

  const handleRegister = async (e) => {
    e.preventDefault();

    // 1. Validaciones de campos vacíos
    if (!name || !phoneNumber || !major || !email || !password || !confirmPassword) {
      alert("Todos los campos son obligatorios.");
      return;
    }

    // 2. Validación de contraseñas
    if (password !== confirmPassword) {
      alert("Las contraseñas no coinciden.");
      return;
    }

    // 3. Validar que el correo sea @uniandes.edu.co
    if (!email.endsWith("@uniandes.edu.co")) {
      alert("Solo se permite registrar con correos @uniandes.edu.co");
      return;
    }

    try {
      // 4. Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 5. Guardar datos adicionales en Firestore
      await setDoc(doc(db, "user", user.uid), {
        name,
        mail: email,
        phone_number: phoneNumber,
        major,
      });

      // 6. Guardar en localStorage que ya está logueado (por ejemplo, guardamos el uid)
      localStorage.setItem("userUid", user.uid);
      localStorage.setItem("userEmail", email);

      // 7. Mostrar mensaje y redirigir a /home
      alert("Registro exitoso");
      navigate("/home");
    } catch (error) {
      console.error("Error al registrar:", error);
      alert("No se pudo registrar el usuario.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-indigo-50">
      <h2 className="text-2xl font-bold mb-4 text-indigo-600">Registro</h2>
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
          value={major}
          onChange={(e) => setMajor(e.target.value)}
        >
          <option value="">Seleccione...</option>
          {majors.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
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
      </form>
    </div>
  );
};

export default Register;
