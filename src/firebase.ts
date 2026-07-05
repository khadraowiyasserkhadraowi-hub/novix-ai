import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDpJZuxRwj6o85s8qKq57VBaKTwttfPHLY",
  authDomain: "gen-lang-client-0969055225.firebaseapp.com",
  projectId: "gen-lang-client-0969055225",
  storageBucket: "gen-lang-client-0969055225.firebasestorage.app",
  messagingSenderId: "648953725989",
  appId: "1:648953725989:web:8d1de350ccbeba4bdbebcc"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with local persistence
const auth = initializeAuth(app, {
  persistence: browserLocalPersistence
});

// Initialize Firestore with the specific custom database ID we received
const db = getFirestore(app, "ai-studio-0950ddd0-015a-48b8-9d09-9c1e04d566bc");

export { app, auth, db };
