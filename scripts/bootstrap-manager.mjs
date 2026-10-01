// Crée (ou promeut) le premier responsable communication, avant que quiconque puisse inviter.
// Usage : npm run bootstrap:manager -- prenom.nom@fla.lu Prénom Nom
// Nécessite FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL et FIREBASE_PRIVATE_KEY dans .env.local.
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const [rawEmail, firstName, lastName] = process.argv.slice(2);
if (!rawEmail || !firstName || !lastName) {
  console.error("Usage : npm run bootstrap:manager -- prenom.nom@fla.lu Prénom Nom");
  process.exit(1);
}

const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
  console.error("Compte de service manquant : complétez FIREBASE_CLIENT_EMAIL et FIREBASE_PRIVATE_KEY dans .env.local.");
  process.exit(1);
}

const app = initializeApp({
  credential: cert({
    projectId: FIREBASE_PROJECT_ID,
    clientEmail: FIREBASE_CLIENT_EMAIL,
    privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});
const auth = getAuth(app);
const db = getFirestore(app);
const email = rawEmail.trim().toLowerCase();

let user;
try {
  user = await auth.getUserByEmail(email);
  console.log(`Compte existant trouvé pour ${email}.`);
} catch (error) {
  if (error.code !== "auth/user-not-found") throw error;
  user = await auth.createUser({ email, displayName: `${firstName} ${lastName}` });
  console.log(`Compte créé pour ${email}.`);
}

await db.collection("users").doc(user.uid).set(
  {
    uid: user.uid,
    email,
    firstName,
    lastName,
    role: "manager",
    active: true,
    avatarUrl: null,
    invitedBy: null,
    createdAt: FieldValue.serverTimestamp(),
  },
  { merge: true }
);

console.log(`\n${firstName} ${lastName} est responsable communication.`);

// Firebase envoie lui-même l'e-mail « choisir son mot de passe » (même modèle que pour les invitations).
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Firebase-Locale": "fr" },
  body: JSON.stringify({ requestType: "PASSWORD_RESET", email }),
});
if (response.ok) {
  console.log(`E-mail « choisir son mot de passe » envoyé à ${email}.`);
} else {
  console.error("L'e-mail n'a pas pu être envoyé. Utilisez « Mot de passe oublié » sur la page de connexion.");
}
