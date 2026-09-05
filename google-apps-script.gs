const STATE_SHEET_NAME = "KinetoState";
const STATE_HEADERS = ["appVersion", "stateJson", "updatedAt"];
const TOKEN = ""; // Optional: set this to match SYNC_TOKEN in config.js.
const OLD_DATA_SHEETS = ["TrackerState", "WorkoutProgress", "CycleNotes", "BeginnerTrackerState", "BeginnerWorkoutProgress", "BeginnerCycleNotes"];

function doGet(e) {
  if (!isAuthorized_(e)) return jsonp_(e, { ok: false, error: "Unauthorized" });
  const sheet = getStateSheet_();
  if (sheet.getLastRow() < 2) return jsonp_(e, { ok: true, state: emptyState_(), updatedAt: "" });
  const row = sheet.getRange(2, 1, 1, 3).getValues()[0];
  const state = safeParse_(row[1] || "{}", emptyState_());
  return jsonp_(e, { ok: true, state: state, updatedAt: row[2] || state.updatedAt || "" });
}

function doPost(e) {
  if (!isAuthorized_(e)) return text_({ ok: false, error: "Unauthorized" });
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    clearOldTrackerDataOnce_();
    const payload = safeParse_(e.parameter.payload || "{}", {});
    const state = sanitizeState_(payload.state);
    const sheet = getStateSheet_();
    if (sheet.getLastRow() > 1) sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).clearContent();
    sheet.getRange(2, 1, 1, 3).setValues([[payload.appVersion || "kineto-v1", JSON.stringify(state), state.updatedAt || new Date().toISOString()]]);
    return text_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

// Run this once from Apps Script if you want to clear the old rows immediately,
// before the first save from the new Kineto app.
function resetForKineto() {
  OLD_DATA_SHEETS.forEach(clearRowsKeepHeader_);
  const stateSheet = getStateSheet_();
  if (stateSheet.getLastRow() > 1) stateSheet.getRange(2, 1, stateSheet.getLastRow() - 1, 3).clearContent();
  PropertiesService.getScriptProperties().setProperty("KINETO_LEGACY_CLEARED", "true");
}

function clearOldTrackerDataOnce_() {
  const properties = PropertiesService.getScriptProperties();
  if (properties.getProperty("KINETO_LEGACY_CLEARED") === "true") return;
  OLD_DATA_SHEETS.forEach(clearRowsKeepHeader_);
  properties.setProperty("KINETO_LEGACY_CLEARED", "true");
}

function clearRowsKeepHeader_(name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (sheet && sheet.getLastRow() > 1) sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
}

function getStateSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(STATE_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(STATE_SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, STATE_HEADERS.length).setValues([STATE_HEADERS]);
  return sheet;
}

function sanitizeState_(value) {
  const source = value && typeof value === "object" ? value : {};
  const levels = source.levels && typeof source.levels === "object" ? source.levels : {};
  const completed = source.completed && typeof source.completed === "object" ? source.completed : {};
  return {
    levels: {
      flexibility: validLevel_(levels.flexibility) ? levels.flexibility : "beginner",
      backbend: validLevel_(levels.backbend) ? levels.backbend : "beginner",
    },
    selections: source.selections && typeof source.selections === "object" ? source.selections : {},
    completed: completed,
    updatedAt: source.updatedAt || new Date().toISOString(),
  };
}

function validLevel_(value) { return ["beginner", "intermediate", "advanced"].indexOf(value) !== -1; }
function emptyState_() { return { levels: { flexibility: "beginner", backbend: "beginner" }, selections: {}, completed: {}, updatedAt: "" }; }
function safeParse_(value, fallback) { try { return JSON.parse(value); } catch (error) { return fallback; } }
function isAuthorized_(e) { return !TOKEN || (e && e.parameter && e.parameter.token === TOKEN); }
function text_(payload) { return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON); }
function jsonp_(e, payload) { const callback = (e && e.parameter && e.parameter.callback) || "callback"; return ContentService.createTextOutput(callback + "(" + JSON.stringify(payload) + ");").setMimeType(ContentService.MimeType.JAVASCRIPT); }
