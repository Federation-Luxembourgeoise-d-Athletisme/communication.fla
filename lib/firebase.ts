import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
// E-mails Firebase (mot de passe) envoyés en français.
auth.languageCode = "fr";

export const db = getFirestore(app);

// En local, `NEXT_PUBLIC_USE_EMULATORS=true` branche l'app sur les émulateurs Firebase.
const globalForEmulators = globalThis as { __flaEmulatorsConnected?: boolean };
if (process.env.NEXT_PUBLIC_USE_EMULATORS === "true" && !globalForEmulators.__flaEmulatorsConnected) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  globalForEmulators.__flaEmulatorsConnected = true;
}
