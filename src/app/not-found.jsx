export default function NotFound() {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen min-w-full h-full  space-y-4">
        <h1 className="text-4xl font-bold text-center text-primary">404</h1>
        <p className="text-lg text-center text-primary">Página no encontrada</p>
        <span className="text-md text-center text-primary">Si consideras que esto es un error, por favor contacta al soporte</span>
      </div>
    )
  }