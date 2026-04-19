import { initializeApp, getApps, getApp } from "firebase/app";
import * as authSDK from "firebase/auth";
import * as firestoreSDK from "firebase/firestore";
import { mockAuth, mockDb } from "./lib/mockFirebase";
import firebaseAppletConfig from "../firebase-applet-config.json";

// use env vars if present, otherwise fallback to the JSON config
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || (firebaseAppletConfig as any)?.apiKey || "",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (firebaseAppletConfig as any)?.authDomain || "",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || (firebaseAppletConfig as any)?.projectId || "",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || (firebaseAppletConfig as any)?.storageBucket || "",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || (firebaseAppletConfig as any)?.messagingSenderId || "",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || (firebaseAppletConfig as any)?.appId || "",
    firestoreDatabaseId: (firebaseAppletConfig as any)?.firestoreDatabaseId || "(default)"
};

// Check if we should use mock
const isConfigValid = firebaseConfig.apiKey && 
                     firebaseConfig.apiKey !== "" &&
                     !firebaseConfig.apiKey.includes('your_api_key') &&
                     firebaseConfig.appId;

let realApp: any;
let realAuth: any;
let realDb: any;
let _isDemoMode = !isConfigValid;

if (isConfigValid) { 
    try {
        const apps = getApps();
        realApp = apps.length === 0 ? initializeApp(firebaseConfig) : getApp();
        realAuth = authSDK.getAuth(realApp);
        
        const dbId = firebaseConfig.firestoreDatabaseId;
        const settings: any = {
            experimentalForceLongPolling: true,
            experimentalAutoDetectLongPolling: true,
            useFetchStreams: false // Sometimes helps with stability in certain proxies
        };

        // Singleton check to avoid re-initialization errors during HMR
        const globalRef = (globalThis as any);
        if (!globalRef.__FIREBASE_DB__) {
            try {
                if (dbId && dbId !== "(default)") {
                    realDb = firestoreSDK.initializeFirestore(realApp, settings, dbId);
                } else {
                    realDb = firestoreSDK.initializeFirestore(realApp, settings);
                }
                globalRef.__FIREBASE_DB__ = realDb;
                console.log(`✅ Cloud Firestore initialized (New Instance, DB: ${dbId})`);
            } catch (initErr) {
                console.warn("⚠️ initializeFirestore failed, attempting getFirestore:", initErr);
                realDb = dbId && dbId !== "(default)" ? firestoreSDK.getFirestore(realApp, dbId) : firestoreSDK.getFirestore(realApp);
                globalRef.__FIREBASE_DB__ = realDb;
            }
        } else {
            realDb = globalRef.__FIREBASE_DB__;
            console.log("✅ Cloud Firestore reused existing instance");
        }
    } catch (e) {
        console.error("🔥 Firebase initialization failed CRITICALLY:", e);
    }
}

// Current active instances
export let auth: any;
export let db: any;

if (_isDemoMode) {
    auth = mockAuth;
    db = mockDb;
} else if (realAuth && realDb) {
    auth = realAuth;
    db = realDb;
} else {
    auth = mockAuth;
    db = mockDb;
    _isDemoMode = true;
}

export const setDemoMode = (val: boolean) => {
    _isDemoMode = val;
    auth = val ? mockAuth : realAuth;
    db = val ? mockDb : realDb;
    console.warn(val ? "🔄 MANUAL OVERRIDE: Switched to Demo Mode (Offline)" : "⚡ MANUAL OVERRIDE: Switched to Live Mode (Cloud Firestore)");
};

export const getIsDemoMode = () => _isDemoMode;
export const hasRealFirebase = () => !!realAuth && !!realDb;

if (!isConfigValid) {
    console.info("ℹ️ Firebase is in Demo Mode (Mock API) because VITE_FIREBASE_API_KEY is missing or invalid.");
    auth = mockAuth;
    db = mockDb;
    _isDemoMode = true;
}

// --- Auth Wrappers ---
export const onAuthStateChanged = (...args: any[]) => {
    if (_isDemoMode) return mockAuth.onAuthStateChanged(args[1]);
    return authSDK.onAuthStateChanged(realAuth, args[1], args[2]);
};

export const signInWithEmailAndPassword = (...args: any[]) => {
    if (_isDemoMode) return mockAuth.signInWithEmailAndPassword(args[1], args[2]);
    return authSDK.signInWithEmailAndPassword(realAuth, args[1], args[2]);
};

export const createUserWithEmailAndPassword = (...args: any[]) => {
    if (_isDemoMode) return mockAuth.signInWithEmailAndPassword(args[1], args[2]); 
    return authSDK.createUserWithEmailAndPassword(realAuth, args[1], args[2]);
};

export const signOut = (...args: any[]) => {
    if (_isDemoMode) return mockAuth.signOut();
    return authSDK.signOut(realAuth);
};

export const signInAnonymously = (...args: any[]) => {
    if (_isDemoMode) return mockAuth.signInAnonymously();
    return authSDK.signInAnonymously(realAuth);
};

export const signInWithPopup = (...args: any[]) => {
    if (_isDemoMode) return mockAuth.signInWithPopup();
    return authSDK.signInWithPopup(realAuth, args[1]);
};

export const sendPasswordResetEmail = (...args: any[]) => {
    if (_isDemoMode) return Promise.resolve();
    return authSDK.sendPasswordResetEmail(realAuth, args[1]);
};

export const GoogleAuthProvider = authSDK.GoogleAuthProvider;

// --- Safety Wrappers to handle Mock vs Real SDK differences ---

export const doc = (parent: any, path: string, ...segments: string[]) => {
    if (_isDemoMode) return mockDb.doc(path, ...segments);
    // If caller passed the mockDb but we are in Live Mode, switch to realDb
    const actualParent = (parent === mockDb) ? realDb : parent;
    return firestoreSDK.doc(actualParent, path, ...segments);
};

export const getDoc = (docRef: any) => {
    if (_isDemoMode) return mockDb.getDoc(docRef);
    return firestoreSDK.getDoc(docRef);
};

export const setDoc = (docRef: any, data: any, options?: any) => {
    if (_isDemoMode) return mockDb.setDoc(docRef, data, options);
    return firestoreSDK.setDoc(docRef, data, options);
};

export const updateDoc = (docRef: any, data: any) => {
    if (_isDemoMode) return mockDb.updateDoc(docRef, data);
    return firestoreSDK.updateDoc(docRef, data);
};

export const collection = (parent: any, path: string, ...segments: string[]) => {
    if (_isDemoMode) return mockDb.collection(path, ...segments);
    const actualParent = (parent === mockDb) ? realDb : parent;
    return firestoreSDK.collection(actualParent, path, ...segments);
};

export const query = (q: any, ...constraints: any[]) => {
    if (_isDemoMode) return mockDb.query(q, ...constraints);
    return firestoreSDK.query(q, ...constraints);
};

export const where = (field: string, op: any, value: any) => {
    if (_isDemoMode) return [field, op, value]; 
    return firestoreSDK.where(field, op, value);
};

export const onSnapshot = (ref: any, onNext: any, onError?: any) => {
    if (_isDemoMode) return mockDb.onSnapshot(ref, onNext);
    return firestoreSDK.onSnapshot(ref, onNext, onError);
};

export const getDocFromServer = (docRef: any) => {
    if (_isDemoMode) return mockDb.getDoc(docRef);
    return firestoreSDK.getDocFromServer(docRef);
};

export const addDoc = (colRef: any, data: any) => {
    if (_isDemoMode) return mockDb.addDoc(colRef, data);
    return firestoreSDK.addDoc(colRef, data);
};

export const deleteDoc = (docRef: any) => {
    if (_isDemoMode) return mockDb.deleteDoc(docRef);
    return firestoreSDK.deleteDoc(docRef);
};

export const serverTimestamp = () => {
    if (_isDemoMode) return new Date();
    return firestoreSDK.serverTimestamp();
};

export const Timestamp = firestoreSDK.Timestamp;

export const enableNetwork = (firestore: any) => {
    if (_isDemoMode) return Promise.resolve();
    return firestoreSDK.enableNetwork(firestore);
};

export const disableNetwork = (firestore: any) => {
    if (_isDemoMode) return Promise.resolve();
    return firestoreSDK.disableNetwork(firestore);
};
