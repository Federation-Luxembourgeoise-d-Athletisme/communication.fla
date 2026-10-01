import "server-only";

import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getPrivateKey() {
  const value = process.env.FIREBASE_PRIVATE_KEY;
  return value ? value.replace(/\\n/g, "\n") : null;
}

function getFirebaseAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = getPrivateKey();

  if (projectId && clientEmail && privateKey) {
    return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  }

  const fallbackProjectId = projectId ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  // Émulateurs locaux : aucun identifiant nécessaire.
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR_HOST) {
    return initializeApp({ projectId: fallbackProjectId });
  }

  return initializeApp({ projectId: fallbackProjectId, credential: applicationDefault() });
}

const adminApp = getFirebaseAdminApp();

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
