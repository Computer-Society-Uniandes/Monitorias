"use client";

import React, { useState, useEffect } from "react";
import { TutorSearchService } from "../../services/TutorSearchService";
import ExploreBanner from "../../components/ExploreBanner/ExploreBanner";
import TutorAvailabilityCard from "../../components/TutorAvailabilityCard/TutorAvailabilityCard";

export default function BuscarTutores() {
  const [materias, setMaterias] = useState([]);
  const [filteredMaterias, setFilteredMaterias] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMateria, setSelectedMateria] = useState(null);
  const [tutores, setTutores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMaterias, setLoadingMaterias] = useState(true);
  const [error, setError] = useState(null);

  // Cargar materias al montar el componente
  useEffect(() => {
    loadMaterias();
  }, []);

  // Filtrar materias según el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredMaterias(materias);
    } else {
      const filtered = materias.filter((materia) =>
        materia.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        materia.codigo.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMaterias(filtered);
    }
  }, [searchTerm, materias]);

  const loadMaterias = async () => {
    try {
      setLoadingMaterias(true);
      setError(null);
      const materiasData = await TutorSearchService.getMaterias();
      setMaterias(materiasData);
      setFilteredMaterias(materiasData);
    } catch (error) {
      console.error("Error cargando materias:", error);
      setError("Error cargando materias. Por favor, inténtalo de nuevo.");
    } finally {
      setLoadingMaterias(false);
    }
  };

  const handleMateriaSelect = async (materia) => {
    try {
      setLoading(true);
      setSelectedMateria(materia);
      setError(null);
      
      console.log("Buscando tutores para:", materia.nombre);
      const tutoresData = await TutorSearchService.getTutorsBySubject(materia.nombre);
      
      // Obtener estadísticas para cada tutor
      const tutoresWithStats = await Promise.all(
        tutoresData.map(async (tutor) => {
          const stats = await TutorSearchService.getTutorStats(tutor.id);
          return { ...tutor, stats };
        })
      );
      
      setTutores(tutoresWithStats);
    } catch (error) {
      console.error("Error cargando tutores:", error);
      setError("Error cargando tutores. Por favor, inténtalo de nuevo.");
      setTutores([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToMaterias = () => {
    setSelectedMateria(null);
    setTutores([]);
    setError(null);
  };

  if (selectedMateria) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ExploreBanner titulo={`Tutores de ${selectedMateria.nombre}`} />
        
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <button
              onClick={handleBackToMaterias}
              className="flex items-center text-[#FF7A7A] hover:text-[#ff6b6b] transition-colors font-medium"
            >
              ← Volver a materias
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7A7A] mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando tutores...</p>
            </div>
          ) : tutores.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No se encontraron tutores disponibles
              </h3>
              <p className="text-gray-500 mb-4">
                Actualmente no hay tutores disponibles para {selectedMateria.nombre}.
              </p>
              <button
                onClick={handleBackToMaterias}
                className="bg-[#FF7A7A] text-white px-6 py-2 rounded-lg hover:bg-[#ff6b6b] transition-colors"
              >
                Explorar otras materias
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Tutores disponibles ({tutores.length})
                </h2>
                <p className="text-gray-600">
                  Encuentra el tutor perfecto para {selectedMateria.nombre}
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {tutores.map((tutor) => (
                  <TutorAvailabilityCard 
                    key={tutor.id} 
                    tutor={tutor} 
                    materia={selectedMateria.nombre}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ExploreBanner titulo="Buscar Tutores" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Encuentra tu tutor ideal
            </h2>
            <p className="text-gray-600 text-lg">
              Explora las materias disponibles y descubre tutores expertos listos para ayudarte
            </p>
          </div>

          {/* Barra de búsqueda */}
          <div className="mb-8">
            <div className="relative max-w-md mx-auto">
              <input
                type="text"
                placeholder="Buscar materias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7A7A] focus:border-transparent outline-none"
              />
              <div className="absolute right-3 top-3 text-gray-400">
                🔍
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Lista de materias */}
          {loadingMaterias ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7A7A] mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando materias...</p>
            </div>
          ) : filteredMaterias.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No se encontraron materias
              </h3>
              <p className="text-gray-500">
                {searchTerm ? `No hay materias que coincidan con "${searchTerm}"` : "No hay materias disponibles"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredMaterias.map((materia) => (
                <div
                  key={materia.codigo}
                  onClick={() => handleMateriaSelect(materia)}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer border border-gray-200 hover:border-[#FF7A7A] group"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="bg-[#FF7A7A] bg-opacity-10 p-3 rounded-lg group-hover:bg-opacity-20 transition-colors">
                        <span className="text-2xl">📚</span>
                      </div>
                      <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {materia.codigo}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-[#FF7A7A] transition-colors">
                      {materia.nombre}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4">
                      Buscar tutores disponibles para esta materia
                    </p>
                    
                    <div className="flex items-center text-[#FF7A7A] font-medium text-sm">
                      Ver tutores disponibles →
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 