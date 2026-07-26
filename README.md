# CornerBalance

CornerBalance is a mobile-first React and TypeScript PWA for guided vehicle corner-balancing sessions. It keeps calculations, warnings, progress, and corner labels as live UI, uses a typed asset registry for Figma-exported visuals, persists workshop state locally by default, and can layer Firebase Auth plus Firestore sync on top when environment variables are present.

## Current status

- The full guided workflow is implemented from garage through report preview and JSON/CSV/PDF export.
- Development assets are generated from `public/data/assets-manifest.csv` as exact-filename placeholders.
- Signed-in users autosave locally first, then sync owned vehicles and sessions to Firestore with live refresh, cache-aware status, and remote-change conflict surfacing.
- Vehicle profiles can be edited in place, and deletion is blocked once saved session history references that profile.
- Placeholder-safe alpha builds are available for Firebase Hosting and GitHub Pages while final Figma exports are still pending.
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

### Alpha builds

```bash
npm run build:alpha
npm run build:pages
```

`build:alpha` creates a Firebase-safe placeholder build in `dist-alpha`.  
`build:pages` creates a GitHub Pages-ready placeholder build in `dist-pages` and adds a SPA `404.html` fallback.

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
- `VITE_BASE_PATH`
- `VITE_GITHUB_PAGES_REPOSITORY`

If the required Firebase values are absent, the app stays in guest-first local mode and disables auth actions automatically.

For the normal Firebase and local alpha builds, keep `VITE_BASE_PATH=/`.  
For GitHub Pages, the workflow sets the repo subpath automatically through the `github-pages` build mode.

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
  },
  "targets": {
    "your-firebase-project-id": {
      "hosting": {
        "alpha": ["your-firebase-alpha-site-id"],
        "production": ["your-firebase-project-id"]
      }
    }
  }
}
```

If you prefer the CLI to generate the target mapping, use:

```bash
firebase target:apply hosting alpha your-firebase-alpha-site-id
firebase target:apply hosting production your-firebase-project-id
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

### Firebase deployment targets

```bash
npm run firebase:deploy:alpha
npm run firebase:preview:alpha
npm run firebase:deploy
npm run firebase:preview
```

- `firebase:deploy:alpha` deploys the placeholder-safe `dist-alpha` build to the Firebase Hosting target named `alpha`.
- `firebase:deploy` deploys only the release-gated production target plus Firestore rules and indexes.
- The repository also includes manual GitHub Actions workflows for `Deploy Firebase Alpha`, `Deploy Firebase Preview (Release Gate)`, and `Deploy Firebase Live (Production)`.

## Asset handoff workflow

CornerBalance treats images as content dependencies, not structural dependencies.

### Development placeholders

- Source manifest: [assets-manifest.csv](/C:/Users/gabri/OneDrive/Documents/Datum/corner-balancer/public/data/assets-manifest.csv)
- Placeholder generator: [generate-placeholder-assets.mjs](/C:/Users/gabri/OneDrive/Documents/Datum/corner-balancer/scripts/generate-placeholder-assets.mjs)
- Typed registry output: [manifest.generated.ts](/C:/Users/gabri/OneDrive/Documents/Datum/corner-balancer/src/assets/manifest.generated.ts)
- Runtime registry: [registry.ts](/C:/Users/gabri/OneDrive/Documents/Datum/corner-balancer/src/assets/registry.ts)
- Master export contract: every current asset slot uses `1600 x 900` as the placeholder-safe Figma export size and validates against the declared `16:9` aspect ratio.

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
- Signed-in merge and deletion guard helpers
- Asset registry validation
- JSON/CSV/PDF export builders
- App shell rendering
- Garage workflow rendering for inline profile editing and deletion locks

## GitHub Pages

The repo now includes a dedicated Pages workflow:

- [.github/workflows/github-pages-alpha.yml](/C:/Users/gabri/OneDrive/Documents/Datum/corner-balancer/.github/workflows/github-pages-alpha.yml)

It builds the placeholder-safe Pages bundle on `main` and deploys `dist-pages` through GitHub Actions.

To enable it in GitHub:

1. Open the repository settings.
2. Go to `Pages`.
3. Under `Build and deployment`, set `Source` to `GitHub Actions`.

The Pages build uses the repository subpath automatically and ships a `404.html` SPA fallback so deep links continue to work.

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
- [Firebase Hosting multisite docs](https://firebase.google.com/docs/hosting/multisites?hl=en)
- [Firebase Hosting preview channel docs](https://firebase.google.com/docs/hosting/test-preview-deploy?hl=en)
- [Firebase Hosting channels and versions docs](https://firebase.google.com/docs/hosting/manage-hosting-resources?hl=en)

### GitHub Pages docs used for this setup

- [Vite static deploy guide for GitHub Pages](https://vite.dev/guide/static-deploy)
- [GitHub Pages custom workflow docs](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

Those docs currently recommend keeping `.firebaserc` local for starter or shared repos and using `firebase init hosting:github` when you want Firebase to generate its GitHub Action secret wiring automatically.

### Notes

- Use `npm run build:release` or `npm run firebase:deploy` for production deployment, not plain `build`.
- Use `npm run build:alpha`, `npm run firebase:deploy:alpha`, or the GitHub Pages workflow while placeholders are still in use.
- The current repo ships development placeholders only; production deployment must wait for approved assets.
- Firestore sync is additive to the local-first model. Guest work stays local until the user explicitly signs in and chooses to sync it.
- Live Firestore listeners merge remote updates into the local workspace and surface when cached data or preserved local edits need attention.
- Preview channels and live deployments use the real Firebase backend for the selected project.

## Accessibility and safety notes

- The app keeps critical warnings as live text above actions.
- Status is not color-only.
- Minimum control sizing follows the mobile-first token system.
- The app never invents torque specs or universal perch-turn guidance.
- Adjustment guidance remains qualitative and requires a resettle plus remeasurement after each logged change.
