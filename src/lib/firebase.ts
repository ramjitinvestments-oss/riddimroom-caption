import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Support overriding via client-side environment variables in production builds
const metaEnv = (import.meta as any).env || {};
const config = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: metaEnv.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfig.measurementId,
};

const databaseId = metaEnv.VITE_FIREBASE_DATABASE_ID || firebaseConfig.firestoreDatabaseId;

const app = getApps().length === 0 ? initializeApp(config) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = databaseId
  ? getFirestore(app, databaseId)
  : getFirestore(app);

export { app, auth, googleProvider, db };
