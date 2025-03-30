// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDb2GN2-LekkIvCWHxosb4hAndg96JPSOo",
  authDomain: "calico-5980a.firebaseapp.com",
  projectId: "calico-5980a",
  storageBucket: "calico-5980a.firebasestorage.app",
  messagingSenderId: "1056254794426",
  appId: "1:1056254794426:web:c5180b737a674fd6188083",
  measurementId: "G-RT5XVGCN92"
};

// Initialize Firebase
const app_Firebase = initializeApp(firebaseConfig);

export default app_Firebase;
export const auth = getAuth(app_Firebase);
export const db = getFirestore(app_Firebase);