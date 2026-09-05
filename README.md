# Kineto

A unified ballet conditioning tracker for five daily programs, in this order:

1. Flexibility (Beginner, Intermediate, or Advanced)
2. Turnout
3. Pirouette
4. Foot & Ankle
5. Backbend (Beginner, Intermediate, or Advanced)

The app intentionally contains no session notes, weekly notes, or History view. Progress is stored locally and can sync to the existing Google Sheet through the Apps Script backend.

## Publish

The intended GitHub Pages URL is `https://selena-ec.github.io/kineto/`. Rename the GitHub repository to `kineto`, keep Pages configured for the default branch, and deploy the updated Apps Script code. The old `/beginner/` path redirects to the unified app.

Before using the new app, run `resetForKineto` once in Apps Script. This clears old tracker data while preserving sheet tabs and header rows. The first save also performs this cleanup automatically if it has not already run.
