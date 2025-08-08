// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// IMPORTANT: REPLACE THIS WITH YOUR ACTUAL CONFIG FROM THE FIREBASE WEBSITE
const firebaseConfig = {
  apiKey: "AIzaSyA_Y2MnLlPMoQYVa_aoxBtFYzq_yjI_jnQ",
  authDomain: "cohesio-hr-system.firebaseapp.com",
  projectId: "cohesio-hr-system",
  storageBucket: "cohesio-hr-system.firebasestorage.app",
  messagingSenderId: "723368615116",
  appId: "1:723368615116:web:89a389988c08ecf13a7669",
  measurementId: "G-3R45VRC6JQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

// Export the services so we can use them in other parts of our app
export { auth, db };