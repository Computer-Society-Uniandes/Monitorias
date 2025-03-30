const tutores = [
    {
      name: "Juan Camilo",
      subject: "Tutor de Cálculo Vectorial",
      sessions: 10,
      rating: 2,
      reviews: 7,
      price: 321321,
      description:
        "Hola, mi nombre es Camilo. He sido monitor de cálculo Vectorial e integral desde hace 2 años y llevo 1 año dando tutorías particulares. Estoy listo para ayudarlos con lo que necesiten, con la mejor disposición posible :)",
    },
];

export async function getTutores() {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return tutores;
}

export async function getTutorbyId(){
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return tutores[0];
}