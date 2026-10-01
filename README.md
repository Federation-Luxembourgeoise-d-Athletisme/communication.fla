# Communication FLA

Outil interne de l'équipe communication de la Fédération Luxembourgeoise d'Athlétisme :
calendrier éditorial, tâches, événements, partenaires, galerie photos.

- Plan technique : [docs/plan-technique.md](docs/plan-technique.md)
- Maquette (données fictives) : [maquette/index.html](maquette/index.html)

Stack : Next.js 16 (App Router) + Tailwind 4, Firebase (projet `communication-fla-lu`, indépendant
de MyFLA), hébergement Netlify.

## Démarrer en local

```bash
npm install
cp .env.example .env.local   # puis compléter
npm run dev
```

L'app tourne sur http://localhost:3000.

### Avec les émulateurs Firebase (sans toucher à la prod)

1. Décommenter les trois lignes « émulateurs » de `.env.local`.
2. Dans un terminal : `npm run emulators` (interface sur http://127.0.0.1:4000).
3. Dans un autre : `npm run dev`.

## Mise en place du projet Firebase (une seule fois)

1. **Authentication** > Méthode de connexion : activer **E-mail/Mot de passe**.
2. **Authentication** > Modèles > Réinitialisation du mot de passe : passer en français et
   adapter l'objet, par exemple « Choisissez votre mot de passe – Communication FLA ». Cet e-mail
   sert aussi d'invitation.
3. **Authentication** > Paramètres > Domaines autorisés : ajouter le domaine Netlify et `communication.fla.lu`.
4. **Firestore Database** : créer la base en mode production, région Europe.
5. **Paramètres du projet** > Comptes de service : générer une clé privée et reporter
   `client_email` et `private_key` dans `.env.local` (et dans Netlify). Ne jamais versionner ce fichier.
6. Déployer les règles : `npx firebase login`, puis `npm run deploy:rules`.
7. Créer le premier responsable :

   ```bash
   npm run bootstrap:manager -- prenom.nom@fla.lu Prénom Nom
   ```

   Le script affiche un lien pour choisir le mot de passe. Les autres personnes sont ensuite
   invitées depuis la page **Équipe**.

## Rôles

| Rôle | Accès |
|---|---|
| Responsable communication (`manager`) | Tout, y compris l'équipe, les partenaires et les rubriques récurrentes |
| Équipe communication (`team`) | Calendrier, publications, événements, tâches, galerie, présence |

Le rôle et l'accès ne se modifient que côté serveur (`/api/users`) ; un responsable ne peut pas
modifier son propre compte, il reste donc toujours au moins un responsable actif.

## Netlify

Variables d'environnement à définir dans le site : toutes celles de `.env.example`
(sauf les lignes émulateurs). `FIREBASE_PRIVATE_KEY` se colle telle quelle, avec ses `\n`.
