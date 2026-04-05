import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore"

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Avoid re-initialising on hot-reload in Next.js
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

export const auth = getAuth(app)

// Enable offline persistence securely
let firestoreDb;
if (typeof window !== "undefined") {
    // In the browser, try to initialize with modern local caching
    try {
        firestoreDb = initializeFirestore(app, {
            localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
        });
    } catch (e: any) {
        // If hot-reloaded, it might throw because Firestore is already started. Just get the existing instance.
        if (e.code === 'failed-precondition' || e.message?.includes('already been started')) {
            firestoreDb = getFirestore(app);
        } else {
            console.error("Firestore initialization failed:", e);
            firestoreDb = getFirestore(app);
        }
    }
} else {
    // Server-side rendering (SSR), we just get a normal Firestore instance without caching
    firestoreDb = getFirestore(app);
}

export const db = firestoreDb;
