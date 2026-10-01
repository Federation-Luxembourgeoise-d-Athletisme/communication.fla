# Plan technique — Communication FLA

État : cadrage. Décision du 1er octobre 2026 : **application indépendante de MyFLA**, avec ses
propres identifiants et son propre projet Firebase.
Maquette de référence : `maquette/index.html` (données fictives).

## 1. Objectif

Un **outil interne** pour l'équipe communication de la FLA (2 à 5 personnes). Les photographes
et autres extérieurs n'y ont pas accès :

- calendrier éditorial avec des rubriques récurrentes et des publications ponctuelles ;
- plusieurs types de communication (post, story, vidéo, communiqué, newsletter, article) et canaux (Facebook, Instagram, LinkedIn, site, presse, e-mail) ;
- événements qui regroupent plusieurs publications ;
- tâches assignées aux personnes, avec échéance et statut ;
- suivi des contreparties dues aux partenaires (une dizaine de contrats) ;
- galerie photos FLA (Piwigo) intégrée ;
- plus tard : statistiques des réseaux, puis publication directe.

## 2. Positionnement : application indépendante

`communication.fla.lu` ne dépend pas de MyFLA :

- **projet Firebase dédié** : Auth, Firestore et Storage séparés de `portaljuges` ;
- **comptes propres** : on se connecte avec un identifiant Communication, pas avec son compte MyFLA ;
- aucune modification de MyFLA ou de Courses n'est nécessaire ;
- conséquences : pas de SSO avec MyFLA. Seule exception : la présence des photographes, lue côté serveur en lecture seule (§ 6 ter), sans compte partagé.

Avantages : isolation (règles, déploiements, quotas), et aucun risque d'interférer avec
les juges ou Courses. Contrepartie : les personnes de l'équipe présentes dans les deux outils ont
deux identifiants.

## 3. Stack

| Brique | Choix | Remarque |
|---|---|---|
| Interface | React, via **Next.js** (App Router) + Tailwind | Même base technique que MyFLA et Courses, sans lien entre les projets |
| Authentification | Firebase Auth d'un **nouveau projet** (ex. `communication-fla-lu`) | Forfait gratuit (Spark) suffisant |
| Données | Firestore du même projet | Collections sans préfixe : le projet n'est partagé avec personne |
| Fichiers | Firebase Storage | Preuves des contreparties (photos), logos des partenaires |
| Serveur | Routes API Next.js et Netlify Functions | Admin SDK, clés jamais exposées au navigateur |
| Hébergement | Netlify, site `communication.fla.lu` | Déploiement à chaque push sur `main` |
| Code | GitHub, organisation `Federation-Luxembourgeoise-d-Athletisme` | Dépôt `communication.fla.lu` à créer |
| E-mails | Modèles d'e-mails intégrés à Firebase Auth | Uniquement « choisir / réinitialiser son mot de passe ». Pas de notifications |
| Calendrier | Composant maison ou FullCalendar | À trancher au moment de coder la vue mois |

Environnements :

- **dev** : émulateurs Firebase (Auth, Firestore, Storage) en local ;
- **prod** : projet `communication-fla-lu`.

## 4. Connexion

- **Pas d'inscription libre.** Un responsable invite une personne avec son e-mail et son rôle.
- Le serveur crée le compte (Admin SDK), puis Firebase envoie lui-même l'e-mail « Choisissez votre mot de passe » (modèle d'e-mail de réinitialisation de Firebase Auth, personnalisé en français). Aucun fournisseur d'e-mail à configurer.
- Connexion par **e-mail et mot de passe**, avec « Mot de passe oublié ».
- Pas de connexion Microsoft (décision du 1er octobre 2026).
- Désactiver une personne bloque immédiatement son compte (`disabled` dans Firebase Auth).

## 5. Rôles et droits

Le rôle est stocké dans `users/{uid}.role` du projet Communication :

| Rôle | Libellé | Peut |
|---|---|---|
| `manager` | Responsable communication | Tout, y compris les partenaires, les rubriques récurrentes, les liens utiles, les réglages réseaux et les invitations |
| `team` | Équipe communication | Calendrier, publications, événements, tâches, galerie, présence photographes |

Principes :

- l'utilisateur ne peut jamais modifier son propre rôle : les règles n'autorisent qu'un `manager` à le faire, ou le serveur ;
- les invitations et les changements de rôle passent par une route serveur, qui vérifie que l'appelant est `manager` ;
- `users` ne contient que les membres de Communication et des données minimales (prénom, nom, e-mail, photo, rôle, actif). L'équipe peut donc lire l'annuaire complet, ce qui alimente les listes « Assigné à ».

## 6. Modèle de données

| Collection | Contenu principal |
|---|---|
| `users/{uid}` | `firstName`, `lastName`, `email`, `avatarUrl`, `role`, `active`, `invitedBy`, `createdAt` |
| `rubriques/{id}` | `titre`, `type`, `canaux[]`, `responsableUid`, `rule`, `history[]`, `partnerIds[]`, `active`, `checklist[]` |
| `publications/{id}` | `titre`, `date`, `type`, `canaux[]`, `statut`, `assigneUids[]`, `eventId?`, `notes`, `liens[]`, `photos[]`, `partnerIds[]`, `checks{}`, `rubriqueId?`, `occurrenceDate?`, `annulee`, `createdBy`, `updatedAt` |
| `events/{id}` | `titre`, `dateDebut`, `dateFin?`, `lieu`, `notes`, `piwigoCategoryId?` |
| `tasks/{id}` | `titre`, `assigneUid`, `echeance`, `statut`, `eventId?`, `publicationId?`, `createdBy` |
| `links/{id}` | `titre`, `url`, `ordre` |
| `socialAccounts/{id}` | V2 : référence au compte réseau. **Aucun accès client**, jetons stockés côté serveur |
| `postStats/{publicationId}` | V2 : portée, interactions, date de synchronisation |

Valeurs de référence :

- `type` : `post`, `story`, `video`, `cp`, `newsletter`, `article`
- `canaux` : `fb`, `ig`, `li`, `web`, `presse`, `email`
- `statut` (publication) : `todo`, `doing`, `review`, `scheduled`, `done`
- `statut` (tâche) : `todo`, `doing`, `done`

### Récurrence

Les rubriques ont une règle simple, suffisante pour le calendrier type 2026 :

```json
{ "kind": "weekly", "dow": 1 }                 // chaque lundi
{ "kind": "monthly", "dow": 5, "nth": [2, 5] } // 2e et 5e vendredi du mois
{ "kind": "last", "dow": 4 }                   // dernier jeudi du mois
```

Les occurrences sont **calculées à l'affichage** et ne sont pas stockées à l'avance. Une occurrence devient
un document `publications` seulement quand quelqu'un l'assigne, la modifie ou l'annule,
avec un identifiant déterministe `r_{rubriqueId}_{AAAA-MM-JJ}`. On évite ainsi les doublons, et une
modification de la rubrique s'applique automatiquement aux semaines non personnalisées.

Fonctionnement identique à la maquette (`buildItems` dans `maquette/index.html`).

### Déplacer une publication (glisser-déposer)

- **Publication ponctuelle** : la date change directement.
- **Occurrence d'une rubrique** : on demande à l'utilisateur ce qu'il veut faire.
  - *Seulement cette date* : le document de l'occurrence garde `occurrenceDate`, la date d'origine qui sert d'identifiant, et prend la nouvelle `date`. Les autres semaines ne changent pas.
  - *Toute la récurrence, à partir de cette date* : la règle est découpée. L'ancienne règle est archivée dans `history[]` avec une date de fin (`until`), qui correspond à la plus proche des deux dates. La nouvelle règle s'applique ensuite. Exemple : « 4e vendredi » devient « 4e jeudi ». Les dates passées et les contreparties partenaires déjà comptées ne bougent pas.
- Le glisser-déposer HTML5 ne fonctionne pas sur écran tactile. Sur téléphone, on déplace une publication en changeant sa date dans le panneau de détail, avec la même question pour les récurrences.

## 6 bis. Partenaires et contreparties

Visible uniquement par les `manager` (aujourd'hui Margot et son responsable). Les montants des
contrats ne sont **pas** stockés ; le contrat signé reste dans OneDrive, accessible par un lien.

| Collection | Contenu principal |
|---|---|
| `partners/{id}` | `nom`, `niveau`, `handles{ig, fb, li}`, `logoUrl`, `contact` |
| `contracts/{id}` | `partnerId`, `debut`, `fin`, `lienContrat`, `statut` (actif, à renouveler, terminé) |
| `obligations/{id}` | `contractId`, `partnerId`, `categorie`, `libelle`, `mode`, `cible`, paramètres selon le mode |
| `fulfillments/{id}` | Réalisations manuelles : `obligationId`, `date`, `quantite`, `preuveUrl` (photo dans Storage), `note`, `createdBy` |

Catégories : réseaux sociaux, terrain et événements (banderole, beach flags), newsletter,
print (annuaire, guide des courses sur route), invitations.

Modes de suivi :

| Mode | Exemple | Calcul |
|---|---|---|
| `publications` | « 10 posts avec mention @partenaire » | Publications avec `partnerIds` contenant le partenaire, au statut `done`, pendant le contrat |
| `rubrique` | « Encart dans chaque newsletter », « Tips présentés par X » | Occurrences publiées de la rubrique pendant le contrat |
| `evenements` | « Banderole aux 4 compétitions FLA » | Liste d'événements, chacun coché avec une photo comme preuve ; génère une tâche pour l'événement |
| `livrable` | « Logo dans l'annuaire 2027 » | Étapes : fichier à recevoir → reçu → BAT validé → publié/imprimé, avec une échéance |
| `quantite` | « 8 invitations » | Compteur manuel |

Statut d'une contrepartie :

- **Terminé** : objectif atteint.
- **En retard** : réalisé < attendu à ce jour. L'attendu est calculé au prorata du temps écoulé, ou d'après les événements et les échéances déjà passés.
- **À risque** : le contrat se termine dans 60 jours ou moins, ou il reste moins de 45 jours avant l'échéance d'un livrable dont le fichier n'est pas encore validé.
- **Dans les temps** : tous les autres cas.

Fonctions associées : tableau de bord (retards, risques, renouvellements, prochaines échéances),
liste de vérification « logo / mention » à la validation d'une publication liée, bilan partenaire exporté en PDF avec les preuves et, en V2, les statistiques.

## 6 ter. Photos

### Galerie photos (API Piwigo)

Piwigo est un système distinct de MyFLA : la galerie reste donc possible sans aucun lien avec MyFLA.

- Routes serveur `GET /api/gallery/albums` et `GET /api/gallery/albums/{id}/images`, réservées aux rôles `manager` et `team`, avec un cache court. Méthodes Piwigo : `pwg.session.login`, `pwg.categories.getList`, `pwg.categories.getImages`.
- Les albums Piwigo sont **publics** : l'API se consulte sans connexion, et le navigateur affiche directement les miniatures et les images fournies par Piwigo. Il n'y a ni compte Piwigo à créer, ni proxy d'images.
- Seule l'adresse de l'API est configurée (`PIWIGO_WS_URL` dans Netlify). Les appels passent quand même par le serveur de Communication, pour le cache et pour ne pas dépendre de la configuration CORS de Piwigo.
- Un album peut être relié à un événement de Communication (`events.piwigoCategoryId`), choisi dans une liste.
- **Joindre des photos à une publication** : `publications.photos[]` contient `{ piwigoImageId, albumId, credit, thumbUrl }`. Le crédit photographe est repris de Piwigo (champ auteur) et affiché comme « crédit à mentionner ».
- Téléchargement en haute définition pour préparer les posts.

### Présence des photographes (lecture seule depuis MyFLA)

Décision du 1er octobre 2026 : la présence reste **gérée dans MyFLA**. Communication la lit côté
serveur, en lecture seule, sans partager de comptes ni modifier MyFLA.

**Accès au projet MyFLA (`portaljuges`)**

- On crée, dans Google Cloud, un **compte de service dédié** à Communication avec le seul rôle **« Lecteur Cloud Datastore »** (`roles/datastore.viewer`). Il peut lire Firestore, mais ne peut rien écrire, ni accéder à Auth ou à Storage.
- **Ne pas réutiliser** le compte de service Admin de MyFLA : il donne tous les droits sur le projet.
- La clé est stockée dans les variables d'environnement Netlify de Communication (`MYFLA_READER_PROJECT_ID`, `MYFLA_READER_CLIENT_EMAIL`, `MYFLA_READER_PRIVATE_KEY`). Le serveur l'utilise dans une **seconde instance** de l'Admin SDK, distincte de celle du projet Communication.
- Limite connue : ce rôle permet techniquement de lire toutes les collections de MyFLA, y compris les fiches utilisateurs. La protection repose donc sur le code de Communication, qui ne lit que trois collections et ne renvoie qu'une projection minimale. La clé doit être gardée comme un secret sensible.

**Route `GET /api/photo-presence`**

- Elle est réservée aux rôles `manager` et `team`.
- Elle lit dans MyFLA :
  - `competitions`, filtrées sur `photoConfig.enabled !== false` et `status !== "draft"`, à partir d'aujourd'hui ;
  - `photo_coverages` de ces compétitions ;
  - `users` dont `roles` contient `photographer` ou `photo_coordinator` et dont le statut est `active`.
- Elle renvoie seulement :
  - pour les compétitions : identifiant, nom, date, lieu ;
  - pour les photographes : identifiant, prénom, nom ;
  - le statut le plus récent par couple compétition/photographe. La logique est la même que dans `myFLA/lib/photo-presence.ts` : le document le plus récent gagne, `uploaded` compte comme `confirmed`. Libellés : Disponible, Peut-être, Indisponible, À confirmer.
- Le résultat est mis en cache 5 minutes, pour limiter les lectures facturées sur `portaljuges`.
- Un lien « Ouvrir dans MyFLA » mène à `/photos/presence`, avec une connexion MyFLA séparée.

**Point de vigilance.** Si MyFLA renomme un champ ou une collection, la vue présence de
Communication cessera de fonctionner. La route doit donc échouer proprement, avec le message
« Présence indisponible », et enregistrer l'erreur dans les logs Netlify. Ce couplage est à noter dans la doc de MyFLA.

## 7. Règles Firestore

Le projet a **son propre fichier de règles**, déployé indépendamment : aucun risque d'écraser
les règles de MyFLA ou de Courses.

```
function signedIn()  { return request.auth != null; }
function me()        { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data; }
function isActive()  { return signedIn() && me().active == true; }
function isManager() { return isActive() && me().role == "manager"; }
function isStaff()   { return isActive() && me().role in ["manager", "team"]; }

match /users/{uid} {
  allow read: if isActive();
  allow update: if isManager()
    || (request.auth.uid == uid && request.resource.data.diff(resource.data).affectedKeys().hasOnly(["firstName", "lastName", "avatarUrl"]));
  allow create, delete: if false;   // invitations via le serveur
}
match /publications/{id} { allow read, write: if isStaff(); }    // idem events, tasks, links
match /rubriques/{id}      { allow read: if isStaff(); allow write: if isManager(); }
match /partners/{id}       { allow read, write: if isManager(); }   // idem contracts, obligations, fulfillments
match /socialAccounts/{id} { allow read, write: if false; }         // serveur uniquement
```

## 8. Netlify

- Site : `communication.fla.lu`.
- Variables d'environnement : configuration Firebase publique (`NEXT_PUBLIC_FIREBASE_*`), compte de service Admin (`FIREBASE_*`), Piwigo (`PIWIGO_WS_URL`), lecture MyFLA (`MYFLA_READER_*`), plus tard `META_APP_ID` et `META_APP_SECRET`.
- Fonctions :
  - `api/users/invite`, `api/users/set-role`, `api/users/disable` (V1)
  - `api/gallery/*` et `api/photo-presence` (V1)
  - synchronisation des statistiques Meta, planifiée chaque nuit (V2).

## 9. Réseaux sociaux

| Réseau | V2 : statistiques | V3 : publication | Démarche |
|---|---|---|---|
| Facebook + Instagram | API Graph de Meta | API Graph de Meta (Instagram : compte professionnel) | Créer une app Meta, vérifier l'entreprise, faire valider les permissions : **à lancer tôt**, plusieurs semaines |
| LinkedIn | Import du CSV exporté de la page | Programmation dans LinkedIn | API Community Management soumise à approbation, non garantie |

## 10. Feuille de route

**V1 : espace de travail**

1. ✅ Projet Firebase `communication-fla-lu`, dépôt GitHub `communication.fla`, site Netlify, base Next.js (1er octobre 2026).
2. ✅ Connexion (e-mail et mot de passe), invitations, rôles, annuaire : page Équipe, routes `/api/users`, règles Firestore, testés sur émulateurs.
   Aucune notification : les tâches et les échéances se suivent dans l'outil (vue « Mes tâches », tableau de bord partenaires).
3. ✅ Rubriques récurrentes (import du calendrier type 2026), calendrier mois et liste, publications ponctuelles, glisser-déposer « cette date / toute la récurrence », annulation d’une date. Page `/auth/action` pour choisir son mot de passe, résistante aux antivirus de messagerie.
4. Publications, événements, tâches, vue « Mes tâches ».
5. Partenaires : formulaires de saisie (partenaire, contrat, contreparties), lien avec les publications, tableau de bord. Les 10 contrats existants sont saisis à la main.
6. Galerie Piwigo, avec photos jointes aux publications.
7. Présence photographes en lecture seule depuis MyFLA (compte de service lecteur à créer).

**V2 : statistiques**

Synchronisation Facebook et Instagram ; import CSV LinkedIn.

**V3 : publication directe**

Facebook et Instagram, si le besoin se confirme.

## 11. Décisions ouvertes

- Aucune pour l'instant.

Tranché le 1er octobre 2026 : pas de connexion Microsoft ; albums Piwigo publics ; pas de
notifications par e-mail ; saisie manuelle des contrats partenaires.
