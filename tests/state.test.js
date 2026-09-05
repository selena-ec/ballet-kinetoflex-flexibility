import assert from "node:assert/strict";
import test from "node:test";
import { PROGRAMS, WORKOUTS, workoutLevel } from "../src/catalog.js";
import { cycleWeek, PLAN_START } from "../src/dates.js";
import {
  completedInWeek,
  completedOnDay,
  createEmptyState,
  entryKey,
  normalizeState,
  SCHEMA_VERSION,
} from "../src/state.js";

test("catalogue preserves program order and workout counts", () => {
  assert.deepEqual(
    PROGRAMS.map(({ id }) => id),
    ["flexibility", "turnout", "pirouette", "foot-ankle", "backbend"],
  );
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(WORKOUTS).map(([id, values]) => [id, values.length]),
    ),
    {
      flexibility: 24,
      turnout: 6,
      pirouette: 10,
      "foot-ankle": 7,
      backbend: 26,
    },
  );
});

test("new state starts without invented workout assignments", () => {
  assert.deepEqual(createEmptyState(), {
    schemaVersion: SCHEMA_VERSION,
    selections: {},
    completed: {},
    updatedAt: "",
  });
});

test("week, day, and program produce independent keys", () => {
  assert.notEqual(entryKey("flexibility", 1, 3), entryKey("flexibility", 1, 4));
  assert.notEqual(entryKey("flexibility", 1, 3), entryKey("flexibility", 2, 3));
  assert.notEqual(entryKey("flexibility", 1, 3), entryKey("turnout", 1, 3));
});

test("normalization keeps valid selections and rejects unknown workouts", () => {
  const validKey = entryKey("flexibility", 1, 3);
  const invalidKey = entryKey("turnout", 1, 3);
  const state = normalizeState(
    {
      selections: {
        [validKey]: "Front Split Beginner - Workout 1",
        [invalidKey]: "Imaginary workout",
      },
      completed: { [validKey]: true, [invalidKey]: true },
    },
    PROGRAMS,
    WORKOUTS,
  );
  assert.equal(state.selections[validKey], "Front Split Beginner - Workout 1");
  assert.equal(state.completed[validKey], true);
  assert.equal(state.selections[invalidKey], undefined);
  assert.equal(state.completed[invalidKey], undefined);
});

test("legacy completion keys migrate when a matching workout exists", () => {
  const key = entryKey("flexibility", 4, 2);
  const state = normalizeState(
    {
      selections: { [key]: "Pancake Intermediate - Workout 2" },
      completed: { "flexibility:intermediate:week-4:day-2": true },
    },
    PROGRAMS,
    WORKOUTS,
  );
  assert.equal(state.completed[key], true);
});

test("completion totals count programs by day and week", () => {
  const state = createEmptyState();
  state.completed[entryKey("flexibility", 1, 3)] = true;
  state.completed[entryKey("turnout", 1, 3)] = true;
  state.completed[entryKey("backbend", 1, 4)] = true;
  assert.equal(completedOnDay(state, PROGRAMS, 1, 3), 2);
  assert.equal(completedInWeek(state, PROGRAMS, 1), 3);
});

test("cycle dates begin on September 6 and stop at Week 8", () => {
  assert.equal(cycleWeek(new Date(2026, 8, 5)), 1);
  assert.equal(cycleWeek(PLAN_START), 1);
  assert.equal(cycleWeek(new Date(2026, 8, 13)), 2);
  assert.equal(cycleWeek(new Date(2027, 0, 1)), 8);
});

test("level badges are derived from workout names", () => {
  assert.equal(workoutLevel("Front Split Advanced - Workout 1"), "advanced");
  assert.equal(workoutLevel("Workout A"), null);
});
