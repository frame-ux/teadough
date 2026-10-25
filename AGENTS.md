# Teadoough versioning and deployment

This repository belongs to the existing Vercel project `teadough`:
- Project: `prj_AAXq69NSG6q4aYXfnlAA4yd7oQmc`
- Team: `team_wA25YpwDvWeAjAIfn8HQvfKc`
- Production: https://teadough.vercel.app

Keep one Vercel project. Use Git branches and preview deployments for experiments.

- `main` records the preferred production version. Do new design work on a separate branch.
- Preserve the `v1` milestone tag; do not move existing milestone tags.
- Deploy experiments as previews in the existing project, including the actual branch and commit in Git metadata. With the CLI use its preview environment; with the REST/MCP create-deployment API, omit `target` (the API rejects the literal `preview`). Never set `target: "production"` for an experiment. A branch name alone does not create an automatic deployment.
- Update production only when the user asks to make that version live. After approval, merge the branch into main and deploy that exact commit to production.
- The user requested public access on 25 October 2026. Current builds are static and password-free. Preserve historical branches and credentials; do not reintroduce the password gate.
- Source includes `dist/`, which is intentional. `build.cjs` packages it as public static files. Server and test files are not deployed.
- Before deployment run `node --check dist/script.js` and `node build.cjs`; verify public page and media responses.
- Confirm deployment READY and verify anonymous page and video access before sharing.
- See VERSIONING.md for the saved baseline and restoration procedure.
