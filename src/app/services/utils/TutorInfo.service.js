
export async function getTutores() {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return tutores;
}

export async function getTutorbyId(){
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return tutores[0];
}