import { workoutLevel } from "./catalog.js";
import { DAYS, PLAN_WEEKS } from "./dates.js";
import {
  completedInWeek,
  completedOnDay,
  completedWorkoutSessions,
  entryKey,
  latestRelatedSession,
  suggestedRelatedWorkout,
} from "./state.js";

export function createTrackerView({
  programs,
  workouts,
  store,
  onStateChanged,
  initialWeek,
}) {
  const weekList = document.querySelector("#weekList");
  const weekTemplate = document.querySelector("#weekTemplate");
  const rowTemplate = document.querySelector("#programRowTemplate");
  const selectedDays = Object.fromEntries(
    Array.from({ length: PLAN_WEEKS }, (_, index) => [
      index + 1,
      index + 1 === initialWeek ? new Date().getDay() : 0,
    ]),
  );
  let openWeek = initialWeek;
  const openHistories = new Set();

  function render() {
    weekList.replaceChildren();
    for (let week = 1; week <= PLAN_WEEKS; week += 1) renderWeek(week);
    const summaryWeek = openWeek || initialWeek;
    document.querySelector("#weekCompleted").textContent = completedInWeek(
      store.get(),
      programs,
      summaryWeek,
    );
  }

  function renderWeek(week) {
    const state = store.get();
    const fragment = weekTemplate.content.cloneNode(true);
    const panel = fragment.querySelector(".week-panel");
    const toggle = fragment.querySelector("[data-week-toggle]");
    const content = fragment.querySelector("[data-week-content]");
    const day = selectedDays[week];
    const expanded = week === openWeek;

    fragment.querySelector("[data-week-number]").textContent = week;
    fragment.querySelector("[data-week-count]").textContent =
      `${completedInWeek(state, programs, week)}/35`;
    toggle.setAttribute("aria-expanded", String(expanded));
    content.hidden = !expanded;
    panel.classList.toggle("is-open", expanded);
    toggle.addEventListener("click", () => {
      openWeek = expanded ? 0 : week;
      render();
    });

    if (expanded) renderWeekContent(fragment, week, day);
    weekList.append(fragment);
  }

  function renderWeekContent(fragment, week, day) {
    const tabs = fragment.querySelector("[data-day-tabs]");
    for (const [index, name] of DAYS.entries()) {
      const button = document.createElement("button");
      const label = document.createElement("span");
      const count = document.createElement("small");
      button.type = "button";
      button.className = "day-tab";
      button.setAttribute("aria-pressed", String(day === index));
      label.textContent = name.slice(0, 3);
      count.textContent = `${completedOnDay(store.get(), programs, week, index)}/5 done`;
      button.append(label, count);
      button.classList.toggle("is-selected", day === index);
      button.addEventListener("click", () => {
        selectedDays[week] = index;
        render();
      });
      tabs.append(button);
    }

    fragment.querySelector("[data-selected-day]").textContent = DAYS[day];
    fragment.querySelector("[data-workout-heading]").textContent =
      `Workouts for ${DAYS[day]}`;
    const rows = fragment.querySelector("[data-program-rows]");
    programs.forEach((program, index) =>
      rows.append(buildProgramRow(program, index, week, day)),
    );
  }

  function buildProgramRow(program, index, week, day) {
    const fragment = rowTemplate.content.cloneNode(true);
    const select = fragment.querySelector("[data-workout-select]");
    const checkbox = fragment.querySelector("[data-complete]");
    const levelPill = fragment.querySelector("[data-level]");
    const context = fragment.querySelector("[data-workout-context]");
    const history = fragment.querySelector("[data-workout-history]");
    const historyButton = fragment.querySelector("[data-history-toggle]");
    const key = entryKey(program.id, week, day);
    const selectedWorkout = store.get().selections[key] || "";

    fragment.querySelector("[data-program-number]").textContent = index + 1;
    fragment.querySelector("[data-program-name]").textContent = program.name;
    workouts[program.id].forEach((name) => select.add(new Option(name, name)));
    select.value = selectedWorkout;
    select.setAttribute(
      "aria-label",
      `${program.name} workout for ${DAYS[day]}`,
    );
    showLevel(levelPill, program, selectedWorkout);
    renderWorkoutContext(
      context,
      historyButton,
      program,
      selectedWorkout,
      week,
      day,
    );

    const historyKey = `${program.id}:${week}:${day}`;
    const historyIsOpen =
      Boolean(selectedWorkout) && openHistories.has(historyKey);
    history.hidden = !historyIsOpen;
    historyButton.setAttribute("aria-expanded", String(historyIsOpen));
    historyButton.textContent = historyIsOpen
      ? "Hide workout history"
      : "View workout history";
    if (historyIsOpen) renderWorkoutHistory(history, program);
    historyButton.addEventListener("click", () => {
      if (openHistories.has(historyKey)) openHistories.delete(historyKey);
      else openHistories.add(historyKey);
      render();
    });

    select.addEventListener("change", () => {
      store.update((state) => {
        if (select.value) state.selections[key] = select.value;
        else {
          delete state.selections[key];
          delete state.completed[key];
        }
      });
      onStateChanged();
    });

    checkbox.checked = Boolean(store.get().completed[key]);
    checkbox.disabled = !selectedWorkout;
    fragment.querySelector("[data-complete-label]").textContent =
      `Mark ${program.name} complete for ${DAYS[day]}`;
    checkbox.addEventListener("change", () => {
      store.update((state) => {
        if (checkbox.checked) state.completed[key] = true;
        else delete state.completed[key];
      });
      onStateChanged();
    });
    return fragment;
  }

  function renderWorkoutContext(
    context,
    historyButton,
    program,
    selectedWorkout,
    week,
    day,
  ) {
    context.hidden = !selectedWorkout;
    historyButton.hidden = !selectedWorkout;
    if (!selectedWorkout) return;

    const state = store.get();
    const latest = latestRelatedSession(
      state,
      program.id,
      selectedWorkout,
      week,
      day,
    );
    const last = context.querySelector("[data-last-session]");
    const suggestion = context.querySelector("[data-suggestion]");
    if (!latest) {
      last.textContent = "No earlier completed session for this workout type.";
      suggestion.hidden = true;
      return;
    }

    last.textContent = `Last ${workoutLabel(latest.workout)} session: ${workoutPart(latest.workout)} · Week ${latest.week}, ${DAYS[latest.day]}`;
    const next = suggestedRelatedWorkout(workouts[program.id], latest.workout);
    suggestion.hidden = !next;
    if (next) suggestion.textContent = `Suggested next: ${workoutPart(next)}`;
  }

  function renderWorkoutHistory(container, program) {
    const state = store.get();
    container.replaceChildren();
    const heading = document.createElement("div");
    heading.className = "history-grid history-heading";
    heading.append(historyCell("Workout"));
    for (let week = 1; week <= PLAN_WEEKS; week += 1) {
      heading.append(historyCell(`W${week}`));
    }
    heading.append(historyCell("Total"));
    container.append(heading);

    workouts[program.id].forEach((workout) => {
      const sessions = completedWorkoutSessions(state, program.id, workout);
      const row = document.createElement("div");
      row.className = "history-grid history-row";
      row.append(historyCell(workout, "history-workout-name"));
      for (let week = 1; week <= PLAN_WEEKS; week += 1) {
        const count = sessions.filter(
          (session) => session.week === week,
        ).length;
        const cell = historyCell(count ? "●" : "·", count ? "has-session" : "");
        cell.setAttribute(
          "aria-label",
          count ? `${count} completed in Week ${week}` : `None in Week ${week}`,
        );
        row.append(cell);
      }
      row.append(historyCell(String(sessions.length), "history-total"));
      container.append(row);
    });
  }

  return { render };
}

function historyCell(text, className = "") {
  const span = document.createElement("span");
  span.textContent = text;
  if (className) span.className = className;
  return span;
}

function workoutLabel(workout) {
  return workout.replace(/\s*[-,]\s*workout\s+(?:\d+|[a-z])$/i, "");
}

function workoutPart(workout) {
  return workout.match(/workout\s+(?:\d+|[a-z])$/i)?.[0] || workout;
}

function showLevel(pill, program, workout) {
  const level = program.showsLevel ? workoutLevel(workout) : null;
  pill.hidden = !level;
  if (level) pill.textContent = level[0].toUpperCase() + level.slice(1);
}
