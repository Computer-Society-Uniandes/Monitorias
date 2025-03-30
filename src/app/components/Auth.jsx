"use client"
import { useState, useEffect } from "react"
import Logo from "../../../public/Logo.png"
import Logo2 from "../../../public/Logo2.png"
import { Users, BookOpen, Award, Clock } from "lucide-react"
import Image from "next/image"

const Auth = () => {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled)
      }
    }

    document.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      document.removeEventListener("scroll", handleScroll)
    }
  }, [scrolled])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${scrolled ? "bg-white shadow-md" : "bg-transparent"}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 md:justify-start md:space-x-10">
            <div className="flex justify-start lg:w-0 lg:flex-1">
              <Image
                src={Logo2 || "/placeholder.svg"}
                className={`h-8 w-auto sm:h-10 transition-all duration-300 ${scrolled ? "filter brightness-0" : ""}`}
                alt="Logo cabra"
              />
            </div>
            <div className="md:flex items-center justify-end md:flex-1 lg:w-0">
              <button
                className={`ml-8 whitespace-nowrap inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-full shadow-sm text-base font-medium ${scrolled ? "text-white bg-indigo-600 hover:bg-indigo-700" : "text-indigo-600 bg-white hover:bg-gray-50"} transition-all duration-300`}
              >
                Regístrate
              </button>
              <button
                className={`ml-8 whitespace-nowrap inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-full shadow-sm text-base font-medium ${scrolled ? "text-indigo-600 bg-white hover:bg-gray-50" : "text-white bg-indigo-600 hover:bg-indigo-700"} transition-all duration-300`}
              >
                Iniciar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <div
        className={`w-full transition-all duration-500 ease-in-out ${scrolled ? "opacity-0 h-0 overflow-hidden" : "opacity-100"}`}
      >
        <div className="flex justify-center align-center flex-col w-full h-fit bg-gradient-to-b from-indigo-400 to-indigo-600 pt-16">
          <div className="m-12 flex justify-center">
            <Image src={Logo || "/placeholder.svg"} className="h-52" alt="Monitorias Uniandes" />
          </div>
          <div className="h-50 w-full bg-white rounded-tl-full rounded-tr-full">
            <div className="flex justify-center m-12">
              <button className="bg-red-400 hover:bg-red-300 text-white font-bold text-lg py-3 px-8 rounded-full shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                Empieza ahora
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="py-16 px-4 md:px-8 lg:px-16 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="mb-4 text-5xl font-bold text-indigo-500">Sobre Nosotros</h2>
            <div className="w-24 h-1 bg-indigo-400 mx-auto mb-8"></div>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Somos un equipo comprometido con conectar a estudiantes con monitores dispuestos a ayudar. Facilitamos el
              aprendizaje a través de una plataforma que promueve la confianza y una conexión efectiva, asegurando una
              experiencia de apoyo accesible y de calidad.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-indigo-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Comunidad</h3>
              <p className="text-gray-600">
                Creamos una comunidad de aprendizaje colaborativo entre estudiantes y monitores.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-indigo-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Aprendizaje</h3>
              <p className="text-gray-600">
                Facilitamos el proceso de aprendizaje con metodologías efectivas y personalizadas.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-indigo-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Calidad</h3>
              <p className="text-gray-600">
                Garantizamos monitores de alta calidad, seleccionados por su excelencia académica.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-indigo-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Flexibilidad</h3>
              <p className="text-gray-600">
                Ofrecemos horarios flexibles que se adaptan a las necesidades de cada estudiante.
              </p>
            </div>
          </div>

          <div className="mt-16 bg-indigo-50 p-8 rounded-lg border border-indigo-100">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-2/3 mb-6 md:mb-0 md:pr-8">
                <h3 className="text-2xl font-bold text-indigo-600 mb-4">Nuestra Misión</h3>
                <p className="text-gray-700">
                  Transformar la experiencia educativa en Uniandes, creando un ecosistema donde el conocimiento fluya
                  libremente entre estudiantes. Buscamos eliminar barreras en el aprendizaje y fomentar una cultura de
                  colaboración y excelencia académica.
                </p>
              </div>
              <div className="md:w-1/3 flex justify-center">
                <div className="w-32 h-32 bg-indigo-200 rounded-full flex items-center justify-center">
                  <span className="text-5xl text-indigo-500">🎓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Auth

