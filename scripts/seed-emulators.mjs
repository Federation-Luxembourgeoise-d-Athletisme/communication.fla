// Comptes de test pour les ÉMULATEURS uniquement (npm run emulators, puis npm run seed:emulators).
// Refuse de tourner sans FIREBASE_AUTH_EMULATOR_HOST, pour ne jamais toucher la prod.
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";
process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
if (!process.env.FIREBASE_AUTH_EMULATOR_HOST.startsWith("127.0.0.1")) {
  console.error("Ce script ne s'exécute que contre les émulateurs locaux.");
  process.exit(1);
}

const TEST_PASSWORD = "Emulateur-Com-2026";
const ACCOUNTS = [
  { email: "responsable@communication.test", firstName: "Rita", lastName: "Responsable", role: "manager" },
  { email: "equipe@communication.test", firstName: "Eric", lastName: "Équipe", role: "team" },
];

const app = initializeApp({ projectId: "communication-fla-lu" });
const auth = getAuth(app);
const db = getFirestore(app);

for (const account of ACCOUNTS) {
  let user;
  try {
    user = await auth.getUserByEmail(account.email);
  } catch {
    user = await auth.createUser({ email: account.email, password: TEST_PASSWORD, displayName: `${account.firstName} ${account.lastName}` });
  }
  await db.collection("users").doc(user.uid).set({
    uid: user.uid,
    ...account,
    active: true,
    avatarUrl: null,
    invitedBy: null,
    createdAt: FieldValue.serverTimestamp(),
  });
  console.log(`${account.role.padEnd(8)} ${account.email}`);
}
console.log(`Mot de passe des comptes de test : ${TEST_PASSWORD}`);
