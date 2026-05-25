import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDcVp-IN5gZTX2p71Y76Ojrzg-4gAu9KSk",
  authDomain: "soil-sense-67.firebaseapp.com",
  projectId: "soil-sense-67",
  storageBucket: "soil-sense-67.firebasestorage.app",
  messagingSenderId: "714679674308",
  appId: "1:714679674308:web:e6fbce135959cf129ef091",
  measurementId: "G-FM6Y46CGEM",
};

// Prevent duplicate Firebase initialization
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Export Firebase Authentication
export const auth = getAuth(app);
