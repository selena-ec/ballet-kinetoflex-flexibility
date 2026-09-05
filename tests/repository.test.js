import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile("index.html", "utf8");
const backend = await readFile("google-apps-script.gs", "utf8");

test("interface contains day-first controls and no legacy notes", () => {
  assert.match(html, /data-day-tabs/);
  assert.match(html, /Choose a workout…/);
  assert.doesNotMatch(
    html.toLowerCase(),
    /session note|weekly notes|history view/,
  );
});

test("backend retains the unified state sheet", () => {
  assert.match(backend, /KinetoState/);
  assert.match(backend, /sanitizeState_/);
});
