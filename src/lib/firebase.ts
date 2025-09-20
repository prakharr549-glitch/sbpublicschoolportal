
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  projectId: "studio-4606164625-37d65",
  appId: "1:422281319062:web:9a3233c70751ce27b9a8b7",
  storageBucket: "studio-4606164625-37d65.appspot.com",
  apiKey: "AIzaSyDF9s8FC9dik7MyJE0QbJNgYCzmRjCPkSs",
  authDomain: "studio-4606164625-37d65.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "422281319062",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app, '(default)', {
  // Add this to connect to the correct database instance and location
  // This is required for new Firestore projects.
  host: 'firestore.googleapis.com',
  ssl: true,
});
const storage = getStorage(app);

// Enable offline persistence
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time.
      console.warn('Firestore persistence failed: multiple tabs open.');
    } else if (err.code == 'unimplemented') {
      // The current browser does not support all of the features required to enable persistence
       console.warn('Firestore persistence not available in this browser.');
    }
  });


export { app, auth, db, storage };
