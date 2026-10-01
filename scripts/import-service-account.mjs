// Recopie client_email et private_key d'un JSON de compte de service dans .env.local et .env.netlify,
// sans jamais afficher la clé. Usage : node scripts/import-service-account.mjs "C:\chemin\vers\cle.json"
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const file = process.argv[2];
if (!file || !existsSync(file)) {
  console.error('Usage : node scripts/import-service-account.mjs "C:\\chemin\\vers\\cle.json"');
  process.exit(1);
}

const json = JSON.parse(readFileSync(file, "utf8"));
if (json.type !== "service_account" || json.project_id !== "communication-fla-lu" || !json.client_email || !json.private_key) {
  console.error("Ce fichier n'est pas une clé de compte de service du projet communication-fla-lu.");
  process.exit(1);
}

// Une seule ligne, avec des \n littéraux, entre guillemets : format accepté par Next.js et Netlify.
const privateKey = `"${json.private_key.replace(/\r?\n/g, "\\n")}"`;

for (const target of [".env.local", ".env.netlify"]) {
  if (!existsSync(target)) continue;
  const content = readFileSync(target, "utf8")
    .replace(/^FIREBASE_CLIENT_EMAIL=.*$/m, () => `FIREBASE_CLIENT_EMAIL=${json.client_email}`)
    .replace(/^FIREBASE_PRIVATE_KEY=.*$/m, () => `FIREBASE_PRIVATE_KEY=${privateKey}`);
  writeFileSync(target, content);
  console.log(`${target} : compte de service renseigné (${json.client_email}).`);
}
console.log("Vous pouvez maintenant supprimer le fichier JSON téléchargé.");
