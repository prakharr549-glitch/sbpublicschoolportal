import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "studio-4606164625-37d65",
  appId: "1:422281319062:web:9a3233c70751ce27b9a8b7",
  storageBucket: "studio-4606164625-37d65.firebasestorage.app",
  apiKey: "AIzaSyDF9s8FC9dik7MyJE0QbJNgYCzmRjCPkSs",
  authDomain: "studio-4606164625-37d65.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "422281319062",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
