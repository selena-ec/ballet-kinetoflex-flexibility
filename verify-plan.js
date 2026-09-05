const fs = require("fs");

const html = fs.readFileSync("index.html", "utf8");
const app = fs.readFileSync("app.js", "utf8");
const backend = fs.readFileSync("google-apps-script.gs", "utf8");
const combined = `${html}\n${app}`.toLowerCase();

const expectedOrder = ["flexibility", "turnout", "pirouette", "foot-ankle", "backbend"];
let cursor = -1;
expectedOrder.forEach((id) => {
  const next = app.indexOf(`id:"${id}"`, cursor + 1);
  if (next < 0) throw new Error(`Missing or incorrectly ordered program: ${id}`);
  cursor = next;
});

if (!app.includes('{id:"flexibility",name:"Flexibility",levels:true}')) throw new Error("Flexibility must have levels");
if (!app.includes('{id:"backbend",name:"Backbend",levels:true}')) throw new Error("Backbend must have levels");
["turnout", "pirouette", "foot-ankle"].forEach((id) => {
  if (!app.includes(`{id:"${id}"`) || !app.includes(`{id:"${id}"`, app.indexOf(`{id:"${id}"`))) throw new Error(`Missing ${id}`);
  const definition = app.slice(app.indexOf(`{id:"${id}"`), app.indexOf(`{id:"${id}"`) + 100);
  if (!definition.includes("levels:false")) throw new Error(`${id} must not have levels`);
});
if (/textarea|session note|weekly notes|week notes|history view/.test(combined)) throw new Error("Notes or history UI remains");
if (!backend.includes("clearOldTrackerDataOnce_")) throw new Error("Sheet reset migration is missing");
if (!backend.includes("KinetoState")) throw new Error("Unified Sheet state is missing");
if (!app.includes("PLAN_START=new Date(2026,8,6)")) throw new Error("Week 1 must start on September 6, 2026");
if (!app.includes("PLAN_WEEKS=8")) throw new Error("The eight-week cycle is missing");
if (html.includes('id="weekJump"')) throw new Error("The obsolete single-week selector remains");
if (!html.includes("data-eight-weeks")) throw new Error("The eight-week progress grid is missing");
if (!html.includes("data-program-workout-select")) throw new Error("Programs view workout dropdown is missing");
if (html.includes("data-level-control")) throw new Error("Programs view must not show level selectors");
if (html.includes("data-today-level-control")) throw new Error("Redundant Backbend level selector remains");
if ((app.match(/Workout [12]\"/g) || []).length < 24) throw new Error("All 24 flexibility workouts must be present");
if (!app.includes('const turnoutWorkouts=["Week 1 & 2 - Workout 1","Week 1 & 2 - Workout 2","Week 3 & 4 - Workout 1","Week 3 & 4 - Workout 2","Week 5 & 6 - Workout 1","Week 5 & 6 - Workout 2"]')) throw new Error("All six Turnout workouts must be present and ordered");
if (!app.includes('const pirouetteWorkouts=["Week 1 & 2 - Workout 1","Week 1 & 2 - Workout 2","Week 3 & 4 - Workout 1","Week 3 & 4 - Workout 2","Week 5 & 6 - Workout 1","Week 5 & 6 - Workout 2","Workout A","Workout B","Workout C","Workout D"]')) throw new Error("All ten Pirouette workouts must be present and ordered");
if (!app.includes('const footAnkleWorkouts=["Week 1 & 2 - Workout 1","Week 1 & 2 - Workout 2","Week 3 & 4 - Workout 1","Week 3 & 4 - Workout 2","Week 5 & 6 - Workout 1","Week 5 & 6 - Workout 2","Pre-Pointe Foundations Plan Booster"]')) throw new Error("All seven Foot & Ankle workouts must be present and ordered");
if ((app.match(/(?:Beginner|Intermediate|Advanced) - Week [135] & [246], Workout [123]/g) || []).length !== 21) throw new Error("The 21 leveled Backbend workouts are incomplete");
if (!app.includes('"The Needle" Training Plan - Workout A') || !app.includes('Wrist Mobility & Strength - Workout B')) throw new Error("The five additional Backbend workouts are incomplete");

console.log("Kineto plan verification passed.");
