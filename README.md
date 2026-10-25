# SEND PRO COLIS — Web

Application web React des 4 rôles ProColis (Client, Chauffeur, Admin Garage, Super Admin),
consommant l'API Express du projet frère `../ProColis-Api`.

## Stack

- **Vite + React 18 + TypeScript** (SPA)
- **React Router** — routing multi-rôles + guards (`src/routes`)
- **TanStack Query** — état serveur, états loading/error/empty (`src/lib/queryClient.ts`)
- **axios** — client API avec interceptors Bearer + refresh auto + normalisation (`src/lib/api/client.ts`)
- **React Hook Form + Zod** — formulaires (ex. nouveau colis)
- **Zustand** — session auth persistée (`src/store/auth.ts`)
- **Design System ProColis** — tokens CSS + composants typés (`src/ds`), import unique via `@/ds`

## Démarrer

```bash
npm install
cp .env.example .env   # ajuster VITE_API_BASE_URL si besoin
npm run dev
```

L'API doit tourner. En dev Docker elle est sur `http://localhost:18081/api/v1`
(`cd ../ProColis-Api && docker compose up`). Healthcheck : `GET /api/v1/health`.

## Scripts

- `npm run dev` — serveur de dev
- `npm run build` — build de production (tsc + vite)
- `npm run typecheck` — vérification de types
- `npm run lint` — oxlint
- `npm run test` — Vitest

## Installation iPhone / iPad (PWA)

La route publique `/installer` explique l'installation depuis Safari : **Partager →
Sur l'écran d'accueil → Ajouter** (activer « Ouvrir comme app web » si proposé).
Les boutons de téléchargement de l'accueil dirigent les appareils iOS vers ce
guide. Un lien reste accessible depuis la connexion et le pied de page.

- Le manifeste et l'icône Apple ouvrent l'application en mode autonome, sans App
  Store. `/app` redirige vers l'espace du rôle connecté ou la connexion.
- Les marges de sécurité iOS protègent les bords en mode autonome / paysage.
- Une connexion est nécessaire pour les opérations métier. Le worker ne conserve
  ni réponses API, ni fichiers téléversés, ni pages privées. En cas de coupure ou
  d'erreur serveur 5xx sur une navigation, `/offline.html` propose de réessayer
  l'URL initiale. Les données déjà affichées en mémoire peuvent rester visibles.
- Le build génère `dist/sw.js` avec un identifiant de version. Les mises à jour
  attendent le bouton **Mettre à jour** pour préserver les saisies ; le cache
  historique `procolis-v1` est supprimé lors de l'activation.
- Le worker fonctionne seulement en build de production, sur **HTTPS** (ou
  localhost pour les tests). Caddy revalide le HTML, le worker et le manifeste.
  Déployer l'ensemble du nouveau `dist` et le `Caddyfile` mis à jour.
- Cette version n'ajoute pas de notifications push iOS ni de suivi GPS en
  arrière-plan. Les fonctions web existantes restent accessibles dans l'app.

Vérification locale : `npm run build`, puis `npm run preview`. Tests de
non-régression : `npm test -- src/features/pwa`.

Recette sur un iPhone réel après déploiement HTTPS : ouvrir `/installer` dans
Safari, ajouter l'icône, lancer ProColis, se connecter et vérifier le bon espace,
fermer / rouvrir l'app, puis vérifier le secours en mode avion et le bouton
Réessayer après reconnexion. Vérifier également une mise à jour pendant une
saisie avant de la confirmer. Le navigateur de bureau ne valide pas les
particularités de stockage et d'installation de Safari iOS.

Guide Apple : https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios

## Notes d'intégration API

- **Connexion = identifiant (email/téléphone) + code PIN 6 chiffres** (`/auth/login-with-pin`).
  L'API n'expose pas d'OTP malgré les specs.
- Réponses : `{ success, message, ...data }` — données étalées à la racine
  (ex. `user`, `accessToken`, `parcels`, ou parfois `data`). Voir `src/lib/api/*`.
- Statut colis : l'API utilise `picked_up` / `in_transit` / `out_for_delivery` ;
  le DS utilise `pickup` / `transit` / `delivering`. Mapping dans `src/lib/format.ts` (`toStatusKey`).
- Le dossier `ProcoLis mockups et dashboards/` (design system source) et `specs/` sont
  des références, exclus du lint.


### Connexion et inscription Google

`/login` et `/register` utilisent le bouton officiel Google Identity Services.
Le client OAuth **Application Web** est lu depuis `/api/v1/auth/google/config`.
Renseigner `GOOGLE_WEB_CLIENT_ID` dans le `.env` de la stack Compose web : cette
valeur est transmise à l'API. Aucun secret OAuth ni variable Vite n'est requis.
Autoriser `https://sendprocolis.com` dans les origines JavaScript du client Google
(et l'origine exacte avec port pour le développement).

Déployer les migrations Google de l'API et recréer le service API après avoir
renseigné sa configuration. Le web gère ensuite la connexion, l'association par
PIN ou l'inscription avec validation SMS, choix du profil et consentement.
Brevo doit être configuré pour l'envoi des SMS. Sans client OAuth configuré,
les formulaires classiques restent disponibles et Google est indiqué indisponible.

Le Caddyfile autorise les popups d'authentification sur la SPA. Le parcours
utilise un callback JavaScript, sans nouvelle URI de redirection côté API.
Les tests automatisés simulent Google/SMS ; un essai réel exige une origine
Google autorisée et les services configurés.
