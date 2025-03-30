import { db } from '../../firebaseConfig'
import { collection, getDocs } from 'firebase/firestore'

export async function getMaterias() {
  // Leer la coleccion "course" de Firestore
  const snapshot = await getDocs(collection(db, 'course'))
  // Retornar un arreglo con { codigo, nombre }
  return snapshot.docs.map(docSnap => ({
    codigo: docSnap.id,
    nombre: docSnap.data().name,
  }))
}
