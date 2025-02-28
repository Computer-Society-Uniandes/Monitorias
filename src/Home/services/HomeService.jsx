const materias = [
    {codigo: "1105", nombre: "Algebra lineal"},
    {codigo: "2304", nombre: "Infraestructura computacional"}, 
    {codigo: "1518", nombre: "Fisica 1"},];

export async function getMaterias() {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return materias;
}