# Working on Teadoough

One local Git repository and one existing Vercel project serve this website.

## Saved baseline

- Milestone: `v1`
- Description: moving sprinkles, original logo, cinema film, password gate, and first story layout with photo placeholders.
- Existing production deployment: `dpl_BBUo23XivLWP6bSA8hC7z9m88CVu`
- Live URL: https://teadoough.vercel.app
- Photos collected from the other chat and PowerPoint remain in the separate photo library. They have not yet replaced the placeholders in this baseline.

## Normal workflow

1. Start a branch from main, or continue the prepared `next-version` branch.
2. Commit coherent changes on that branch.
3. Deploy a preview to the existing Vercel project. With the REST/MCP API omit `target` to select preview (the API rejects the literal `preview`); with the CLI use the preview environment. Include `gitMetadata.commitRef` and `gitMetadata.commitSha` from this checkout. This does not replace production.
4. Compare the preview with the live URL.
5. When the user selects the new version, merge it into main, check the password gate and video, and deploy the main commit to production.
6. Save another annotated milestone tag when the user wants to preserve an approved version.

## Restoration and comparison

Inspect the original with `git show v1` or compare using `git diff v1..next-version`.

To experiment from the original without overwriting other work:

    git switch -c revisit-v1 v1

To restore production, first preserve any current work, create a restoration branch from the chosen tag, verify it, then deploy after the user requests the restoration. Do not reset branches or force-push to restore an older design.

## Hosting

- Vercel project: `prj_AAXq69NSG6q4aYXfnlAA4yd7oQmc`
- Team: `team_wA25YpwDvWeAjAIfn8HQvfKc`
- Build: `node build.cjs`
- Runtime variables: `SITE_PASSWORD`, `SITE_SESSION_SECRET` (production and preview; managed in Vercel)

The repository is local. There is no GitHub remote or push-triggered automation configured. Preview deployment is performed explicitly through the connected Vercel tools. A Git bundle is provided as a portable backup of branches, tags, and history. Connecting a private remote later is optional; it does not require another Vercel project.
