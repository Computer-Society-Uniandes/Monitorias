// src/App.js
import './App.css';
import routes from './routes';
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Routes>
      {routes.map((link, index) => (
        <Route key={index} path={link.url} element={<link.component />} />
      ))}
    </Routes>
  );
}

export default App;

