// Firebase core
import { initializeApp } from "firebase/app";

// 🔐 Auth
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your config
const firebaseConfig = {
  apiKey: "AIzaSyDFsBkT2tcUa2m67T3zaqOwRYuwoqlr9Ig",
  authDomain: "gigshield-e19f4.firebaseapp.com",
  projectId: "gigshield-e19f4",
  storageBucket: "gigshield-e19f4.firebasestorage.app",
  messagingSenderId: "926144439278",
  appId: "1:926144439278:web:5a504dfc66edbdde62e4ff",
};

// Initialize app
const app = initializeApp(firebaseConfig);

// ✅ Export auth
export const auth = getAuth(app);

// ✅ Google provider
export const provider = new GoogleAuthProvider();