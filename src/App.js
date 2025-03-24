// src/App.js
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Auth from './Components/Auth';
import Login from './Components/Login';
import Register from './Components/Register';
import Welcome from './Components/Welcome';

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta principal (landing page) */}
        <Route path="/" element={<Auth />} />

        {/* Ruta para iniciar sesión */}
        <Route path="/login" element={<Login />} />

        {/* Ruta para registro */}
        <Route path="/register" element={<Register />} />

        <Route path="/home" element={<Welcome />} />
      </Routes>
    </Router>
  );
}

export default App;
