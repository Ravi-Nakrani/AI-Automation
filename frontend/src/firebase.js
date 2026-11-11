import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
if (!apiKey) {
  console.error("VITE_FIREBASE_API_KEY is missing from environment variables.");
}

const firebaseConfig = {
  apiKey,
  authDomain: "ai-automation-d734d.firebaseapp.com",
  projectId: "ai-automation-d734d",
  storageBucket: "ai-automation-d734d.firebasestorage.app",
  messagingSenderId: "403891994049",
  appId: "1:403891994049:web:4eb7eaa5105955f8ee4340",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export { auth, googleProvider };
