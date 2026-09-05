import { createEmptyState, normalizeState, STORAGE_KEY } from "./state.js";

export function createStateStore({ programs, workouts, onChange }) {
  let state = load();

  function load() {
    try {
      return normalizeState(
        JSON.parse(localStorage.getItem(STORAGE_KEY)),
        programs,
        workouts,
      );
    } catch {
      return createEmptyState();
    }
  }

  function get() {
    return state;
  }

  function replace(nextState, { persist = true } = {}) {
    state = normalizeState(nextState, programs, workouts);
    if (persist) save();
    onChange?.(state);
  }

  function update(mutator) {
    mutator(state);
    save();
    onChange?.(state);
  }

  function reset() {
    state = createEmptyState();
    save();
    onChange?.(state);
  }

  function save() {
    state.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  return { get, replace, reset, update };
}
