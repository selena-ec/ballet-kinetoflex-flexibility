# Kineto

Kineto is an eight-week ballet conditioning tracker for Flexibility, Turnout,
Pirouette, Foot & Ankle, and Backbend.

Live app: <https://selena-ec.github.io/kineto/>

## How tracking works

Every assignment is stored independently by program, week, and weekday. New days
start without an assigned workout. A completion can only be recorded after a
workout is selected.

Progress is saved immediately in the browser and then sent to the Google Apps
Script backend. The **Sync now** action retrieves the newest cloud copy.

## Project structure

```text
app.js                 Application bootstrap
src/catalog.js         Program and workout catalogue
src/dates.js           Week and weekday calculations
src/state.js           State schema, validation, and migration
src/storage.js         Browser persistence
src/sync.js            Google Sheets synchronization
src/ui.js              Tracker rendering and interactions
index.html             Accessible application markup and templates
styles.css             Responsive visual system
google-apps-script.gs  Google Sheets backend source
tests/                 Behavioral and repository tests
```

The legacy `/beginner/` URL contains only a redirect to the unified app.

## Local development

```bash
npm install
npm run dev
```

Before publishing, run:

```bash
npm run check
```

This verifies formatting, lint rules, state migrations, workout catalogue
contents, date calculations, and key repository requirements.

## Deployment

GitHub Pages publishes the default branch. A separate quality workflow checks
every proposed change and push.

Changes to `google-apps-script.gs` are not deployed by GitHub Pages. Follow
`google-sheets-backend-setup.md` when that file changes.

## Storage limitations

The current static-site backend uses last-write-wins synchronization. Avoid
editing progress simultaneously on multiple devices. The public Apps Script URL
and any token included in browser configuration must not be treated as secure
authentication.
