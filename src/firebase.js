import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBiaweIt3Xm2chJt1gbLwDlwt6tJ0N9v9M",
  authDomain: "cohesio-app.firebaseapp.com",
  projectId: "cohesio-app",
  storageBucket: "cohesio-app.firebasestorage.app",
  messagingSenderId: "981835745635",
  appId: "1:981835745635:web:8871657f3314d5de8d6b56"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };