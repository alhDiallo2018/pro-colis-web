# PRO COLIS — Web

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

## Notes d'intégration API

- **Connexion = identifiant (email/téléphone) + code PIN 6 chiffres** (`/auth/login-with-pin`).
  L'API n'expose pas d'OTP malgré les specs.
- Réponses : `{ success, message, ...data }` — données étalées à la racine
  (ex. `user`, `accessToken`, `parcels`, ou parfois `data`). Voir `src/lib/api/*`.
- Statut colis : l'API utilise `picked_up` / `in_transit` / `out_for_delivery` ;
  le DS utilise `pickup` / `transit` / `delivering`. Mapping dans `src/lib/format.ts` (`toStatusKey`).
- Le dossier `ProcoLis mockups et dashboards/` (design system source) et `specs/` sont
  des références, exclus du lint.
