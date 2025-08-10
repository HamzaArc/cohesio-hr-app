import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Read keys securely from the .env.local file
const firebaseConfig = {
  apiKey: "AIzaSyCHudqIXSEMvoGSNfn_9rF4a4WkngAyl64",
  authDomain: "cohesio-hr-v3.firebaseapp.com",
  projectId: "cohesio-hr-v3",
  storageBucket: "cohesio-hr-v3.firebasestorage.app",
  messagingSenderId: "360270418022",
  appId: "1:360270418022:web:a492ab07767064f9945da7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };