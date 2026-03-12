import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC7NvJ-BrHVl7RsibZ9YXlj6X0-AOsrwGQ",
  authDomain: "copolfut.firebaseapp.com",
  projectId: "copolfut",
  storageBucket: "copolfut.firebasestorage.app",
  messagingSenderId: "394930737098",
  appId: "1:394930737098:web:772ccc5be0d3770c5a0933"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);