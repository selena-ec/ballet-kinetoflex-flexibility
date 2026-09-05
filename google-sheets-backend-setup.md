# Kineto Google Sheets setup

1. Open the Apps Script project attached to the existing tracker Google Sheet.
2. Replace its code with `google-apps-script.gs`.
3. Run `resetForKineto` once and approve the requested Sheet permission. This clears data rows but preserves tabs and headers.
4. Deploy a new Web App version with access set to **Anyone**.
5. Keep the deployment URL in `config.js` as `GOOGLE_APPS_SCRIPT_URL`.

The new app writes a single row to `KinetoState`. It stores only Flexibility and Backbend level selections, daily completion records, and the last update time. It does not store session notes, weekly notes, or history entries.
