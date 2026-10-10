# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:





# Cadence

Cadence is a local-first study planner for scheduling study, review, and rest blocks. Planner data is stored in the browser using IndexedDB.

## Development

```sh
npm install
npm run dev
```

## Checks

```sh
npm test
npm run build
npm run lint
```

## GitHub Pages

The GitHub Actions workflow in `.github/workflows/deploy.yml` tests, builds, and deploys the site when changes are pushed to `main` or `master`. It configures the Vite base path from the repository name and publishes an SPA fallback so direct links continue to load.

In repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**. A project repository is published at `https://<owner>.github.io/<repository>/`; the owner's `github.io` repository is published at `https://<owner>.github.io/`.
