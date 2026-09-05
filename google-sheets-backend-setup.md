# Kineto Google Sheets backend

The web app uses the `KinetoState` tab in the existing Kineto spreadsheet. It
stores one JSON state record containing:

- Schema version
- Workout selections keyed by program, week, and weekday
- Matching completion values
- Last update time

## Deploy a backend change

1. Open the Apps Script project attached to the Kineto spreadsheet.
2. Replace its source with `google-apps-script.gs`.
3. Create a new web-app deployment version.
4. Keep access set to **Anyone** for the static GitHub Pages app.
5. Confirm the deployment URL still matches `GOOGLE_APPS_SCRIPT_URL` in
   `config.js`.
6. Test one temporary assignment from the app, confirm it reaches `KinetoState`,
   and then remove it.

`resetForKineto` is a destructive maintenance function: it clears tracker rows
while preserving sheet tabs and headers. Run it only when a fresh start is
intended.

## Security note

The optional shared token only reduces accidental access. Because the token must
be present in the public frontend, it is not user authentication. Do not store
sensitive health information, private notes, or credentials in this tracker.
