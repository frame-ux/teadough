# Teadough

Website: https://teadough.co.uk

## Publishing

This repository is connected to the existing Vercel project `teadough`.
Updates to `main` automatically build and publish the production website.
Use a separate branch and a Vercel preview to review changes before merging to `main`.

## Source and build

The website source is in `dist/`, including images and the promotional film in `dist/assets/`.
Run `node --check dist/script.js` and `node build.cjs` before publishing.
The build creates Vercel's static Build Output in `.vercel/output/`.
Historical server files are retained for reference and are not deployed.

## Earlier history

`backups/teadough-git-history.bundle` preserves the earlier local Git history and milestone tags.
GitHub's branch history begins with the website upload; the bundle can be cloned separately to inspect earlier revisions.
