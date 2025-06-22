"use client"

const WelcomeBanner = ({usuario}) => {

  return (
    <div
      className={`relative w-full overflow-hidden bg-gradient-to-b from-indigo-500 to-indigo-900 h-[270px]`}
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

      <div className="relative z-10 flex flex-col md:flex-row items-center px-12 text-white text-left py-8">
        
        <div className={`flex flex-col justify-center w-full`}>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Bienvenido, {usuario}</h1>
          <p className="text-lg md:text-xl">Encuentra el tutor para ti</p>
        </div>
      </div>
    </div>
  )
}

export default WelcomeBanner

