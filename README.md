# CornerBalance

CornerBalance is a mobile-first React and TypeScript PWA for guided vehicle corner-balancing sessions. It keeps calculations, warnings, progress, and corner labels as live UI, uses a typed asset registry for Figma-exported visuals, persists workshop state locally by default, and can layer Firebase Auth plus Firestore sync on top when environment variables are present.

## Current status

- The full guided workflow is implemented from garage through report preview and JSON/CSV/PDF export.
- Development assets are generated from `public/data/assets-manifest.csv` as exact-filename placeholders.
- `npm run build` succeeds for development handoff with draft placeholders.
- `npm run build:release` is expected to fail until draft assets are replaced with approved Figma exports and marked `approved` in the manifest.

## Tech stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 with Figma-aligned CSS tokens
- Vitest + Testing Library
- PWA via `vite-plugin-pwa`
- Firebase Auth + Firestore integration surface
- `pdf-lib` for downloadable PDF exports

## File map

```text
src/
  app/                     Router, providers, shell, route metadata
  assets/                  Generated manifest registry and validation helpers
  components/              Reusable UI, forms, warnings, illustrations
  data/
    local/                 Local repository
    firebase/              Firestore-backed repository
    migrations/            Persisted state defaults and migration
    repositories/          Repository interfaces
  domain/                  Pure types, units, calculations, guidance, validation
  features/
    auth/                  Welcome and auth entry
    garage/                Vehicle garage
    session/               Guided session workflow screens
    compare/               Session comparison screen
    reports/               Export builders
  firebase/                Firebase app, auth, and Firestore setup
public/
  data/assets-manifest.csv Typed asset source of truth
  assets/corner-balance/   Generated placeholders or final Figma exports
scripts/
  generate-asset-manifest.mjs
  generate-placeholder-assets.mjs
  validate-assets.mjs
firebase.json
firestore.rules
firestore.indexes.json
```

## Setup

### Requirements

- Node.js 24+
- npm 11+

### Install

```bash
npm install
```

### Run locally

```bash
npm run assets:sync
npm run dev
```

### Validate and test

```bash
npm run lint
npm test
npm run typecheck
npm run assets:validate
```

### Development build

```bash
npm run build
```

### Release gate

```bash
npm run build:release
```

`build:release` intentionally fails while any required asset is still `draft`, `review`, missing, duplicated, deprecated, mismatched, or missing alt text.

## Environment variables

Copy `.env.example` to `.env.local` and fill in the Firebase values when you are ready to enable auth and Firestore.

```bash
cp .env.example .env.local
```

CornerBalance reads:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_EMAIL_LINK_URL`
- `VITE_USE_FIREBASE_EMULATORS`
- `VITE_FIREBASE_AUTH_EMULATOR_HOST`
- `VITE_FIREBASE_FIRESTORE_EMULATOR_HOST`

If the required Firebase values are absent, the app stays in guest-first local mode and disables auth actions automatically.

## Firebase emulators

The repo already includes:

- [firebase.json](/C:/Users/gabri/OneDrive/Documents/Datum/corner-balancer/firebase.json)
- [firestore.rules](/C:/Users/gabri/OneDrive/Documents/Datum/corner-balancer/firestore.rules)
- [firestore.indexes.json](/C:/Users/gabri/OneDrive/Documents/Datum/corner-balancer/firestore.indexes.json)
- [.firebaserc.example](/C:/Users/gabri/OneDrive/Documents/Datum/corner-balancer/.firebaserc.example)

Create an untracked `.firebaserc` first:

```json
{
  "projects": {
    "default": "your-firebase-project-id"
  }
}
```

With the bundled Firebase CLI available through npm scripts, run:

```bash
npm run firebase:emulators
```

Recommended local env values:

```bash
VITE_USE_FIREBASE_EMULATORS=true
VITE_FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
VITE_FIREBASE_FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
```

If you use email-link sign-in in production, set `VITE_FIREBASE_EMAIL_LINK_URL` to your canonical app URL and make sure that URL is allowed in Firebase Authentication.

## Asset handoff workflow

CornerBalance treats images as content dependencies, not structural dependencies.

### Development placeholders

- Source manifest: [assets-manifest.csv](/C:/Users/gabri/OneDrive/Documents/Datum/corner-balancer/public/data/assets-manifest.csv)
- Placeholder generator: [generate-placeholder-assets.mjs](/C:/Users/gabri/OneDrive/Documents/Datum/corner-balancer/scripts/generate-placeholder-assets.mjs)
- Typed registry output: [manifest.generated.ts](/C:/Users/gabri/OneDrive/Documents/Datum/corner-balancer/src/assets/manifest.generated.ts)
- Runtime registry: [registry.ts](/C:/Users/gabri/OneDrive/Documents/Datum/corner-balancer/src/assets/registry.ts)

### Replace placeholders with approved Figma exports

1. Export the approved files from Figma using the exact manifest filenames.
2. Replace the matching files in `public/assets/corner-balance/`.
3. Update the corresponding rows in `public/data/assets-manifest.csv`.
4. Set `status` to `approved` only after the export is truly final.
5. Run:

```bash
npm run assets:sync
npm run assets:validate
npm run build:release
```

### Manifest rules enforced by the build

- Required assets must exist.
- Asset IDs and filenames must be unique.
- Alt text is required.
- Aspect ratios must be valid.
- Release mode rejects any required asset that is not `approved`.

## Tests

The current test suite covers:

- Pure unit conversion logic
- Corner-balance calculations
- Measurement validation and warnings
- Qualitative guidance
- Session flow helpers
- Asset registry validation
- JSON/CSV/PDF export builders
- App shell rendering

Run:

```bash
npm test
```

## Deployment

### Firebase Hosting

```bash
npm run firebase:deploy
```

`firebase.json` now runs `npm run build:release` as a Hosting `predeploy` hook, so every Firebase deploy enforces the approved-asset release gate automatically.

### Manual preview channel deploy

```bash
npm run firebase:preview -- corner-balance-preview --expires 7d
```

### GitHub Actions deployment scaffolding

The repo now includes:

- [.github/workflows/ci.yml](/C:/Users/gabri/OneDrive/Documents/Datum/corner-balancer/.github/workflows/ci.yml)
- [.github/workflows/firebase-hosting-preview.yml](/C:/Users/gabri/OneDrive/Documents/Datum/corner-balancer/.github/workflows/firebase-hosting-preview.yml)
- [.github/workflows/firebase-hosting-live.yml](/C:/Users/gabri/OneDrive/Documents/Datum/corner-balancer/.github/workflows/firebase-hosting-live.yml)

Set these GitHub repo settings before using the deployment workflows:

- Repository variable: `FIREBASE_PROJECT_ID`
- Repository secret: `FIREBASE_SERVICE_ACCOUNT_CORNER_BALANCER`

The preview and live workflows are manual by default so they do not auto-deploy while the repo is still using draft placeholder artwork.

### Firebase docs used for this setup

- [Firebase CLI docs](https://firebase.google.com/docs/cli)
- [Firebase Hosting GitHub integration docs](https://firebase.google.com/docs/hosting/github-integration?hl=en)

Those docs currently recommend keeping `.firebaserc` local for starter or shared repos and using `firebase init hosting:github` when you want Firebase to generate its GitHub Action secret wiring automatically.

### Notes

- Use `npm run build:release` or `npm run firebase:deploy` for production deployment, not plain `build`.
- The current repo ships development placeholders only; production deployment must wait for approved assets.
- Firestore sync is additive to the local-first model. Guest work stays local until the user explicitly signs in and chooses to sync it.
- Preview channels and live deployments use the real Firebase backend for the selected project.

## Accessibility and safety notes

- The app keeps critical warnings as live text above actions.
- Status is not color-only.
- Minimum control sizing follows the mobile-first token system.
- The app never invents torque specs or universal perch-turn guidance.
- Adjustment guidance remains qualitative and requires a resettle plus remeasurement after each logged change.
