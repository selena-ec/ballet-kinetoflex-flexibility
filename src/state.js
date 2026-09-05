export const SCHEMA_VERSION = 2;
export const STORAGE_KEY = "kineto.tracker.v1";

export function createEmptyState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    selections: {},
    completed: {},
    updatedAt: "",
  };
}

export function entryKey(programId, week, day) {
  return `${programId}:week-${week}:day-${day}`;
}

export function normalizeState(value, programs, workouts) {
  const normalized = createEmptyState();
  if (!value || typeof value !== "object") return normalized;

  if (value.selections && typeof value.selections === "object") {
    for (const program of programs) {
      for (let week = 1; week <= 8; week += 1) {
        for (let day = 0; day < 7; day += 1) {
          const key = entryKey(program.id, week, day);
          const selection = value.selections[key];
          if (workouts[program.id].includes(selection)) {
            normalized.selections[key] = selection;
          }
        }
      }
    }
  }

  if (value.completed && typeof value.completed === "object") {
    for (const [legacyKey, done] of Object.entries(value.completed)) {
      if (!done) continue;
      const match = legacyKey.match(
        /^([^:]+):(?:[^:]+:)?week-(\d+):day-(\d+)$/,
      );
      if (!match) continue;
      const key = entryKey(match[1], Number(match[2]), Number(match[3]));
      if (normalized.selections[key]) normalized.completed[key] = true;
    }
  }

  if (typeof value.updatedAt === "string") {
    normalized.updatedAt = value.updatedAt;
  }
  return normalized;
}

export function completedOnDay(state, programs, week, day) {
  return programs.filter(
    (program) => state.completed[entryKey(program.id, week, day)],
  ).length;
}

export function completedInWeek(state, programs, week) {
  return Array.from({ length: 7 }, (_, day) =>
    completedOnDay(state, programs, week, day),
  ).reduce((sum, count) => sum + count, 0);
}
