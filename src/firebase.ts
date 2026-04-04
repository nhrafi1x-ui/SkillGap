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
  // If you want to use Realtime Database, add this line:
  databaseURL: "https://gen-lang-client-0454648898-default-rtdb.firebaseio.com/",
  // Firestore ID is almost always "(default)"
  firestoreDatabaseId: "(default)" 
};

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with the correct Database ID string
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
