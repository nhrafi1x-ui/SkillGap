import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA4p0J4Hz3gzS2D0Meb6MixPcHa_-E4Hso",
  authDomain: "gen-lang-client-0454648898.firebaseapp.com",
  projectId: "gen-lang-client-0454648898",
  storageBucket: "gen-lang-client-0454648898.firebasestorage.app",
  messagingSenderId: "464581174826",
  appId: "1:464581174826:web:e36c502d95eb7e61eac553",
  // FIX: Use "(default)" for Firestore, or remove this line if using the standard DB
  firestoreDatabaseId: "(default)" 
};

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// FIX: Pass the app instance and the string ID separately
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
