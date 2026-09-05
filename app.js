const APP_VERSION="kineto-v10",STORAGE_KEY="kineto.tracker.v1",PLAN_WEEKS=8,PLAN_START=new Date(2026,8,6);
const DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],LEVELS=["beginner","intermediate","advanced"];
const CLOUD_CONFIG=window.FLEX_TRACKER_CONFIG||{},CLOUD_URL=(CLOUD_CONFIG.GOOGLE_APPS_SCRIPT_URL||"").trim(),CLOUD_TOKEN=CLOUD_CONFIG.SYNC_TOKEN||"",CLOUD_ENABLED=Boolean(CLOUD_URL);
const programs=[
  {id:"flexibility",name:"Flexibility",levels:true},
  {id:"turnout",name:"Turnout",levels:false},
  {id:"pirouette",name:"Pirouette",levels:false},
  {id:"foot-ankle",name:"Foot & Ankle",levels:false},
  {id:"backbend",name:"Backbend",levels:true}
];
const flexibilityWorkouts=["Hip Mobility Beginner - Workout 1","Hip Mobility Beginner - Workout 2","Hip Mobility Intermediate - Workout 1","Hip Mobility Intermediate - Workout 2","Hip Mobility Advanced - Workout 1","Hip Mobility Advanced - Workout 2","Pancake Beginner - Workout 1","Pancake Beginner - Workout 2","Pancake Intermediate - Workout 1","Pancake Intermediate - Workout 2","Pancake Advanced - Workout 1","Pancake Advanced - Workout 2","Front Split Beginner - Workout 1","Front Split Beginner - Workout 2","Front Split Intermediate - Workout 1","Front Split Intermediate - Workout 2","Front Split Advanced - Workout 1","Front Split Advanced - Workout 2","Middle Split Beginner - Workout 1","Middle Split Beginner - Workout 2","Middle Split Intermediate - Workout 1","Middle Split Intermediate - Workout 2","Middle Split Advanced - Workout 1","Middle Split Advanced - Workout 2"];
const turnoutWorkouts=["Week 1 & 2 - Workout 1","Week 1 & 2 - Workout 2","Week 3 & 4 - Workout 1","Week 3 & 4 - Workout 2","Week 5 & 6 - Workout 1","Week 5 & 6 - Workout 2"];
const pirouetteWorkouts=["Week 1 & 2 - Workout 1","Week 1 & 2 - Workout 2","Week 3 & 4 - Workout 1","Week 3 & 4 - Workout 2","Week 5 & 6 - Workout 1","Week 5 & 6 - Workout 2","Workout A","Workout B","Workout C","Workout D"];
const footAnkleWorkouts=["Week 1 & 2 - Workout 1","Week 1 & 2 - Workout 2","Week 3 & 4 - Workout 1","Week 3 & 4 - Workout 2","Week 5 & 6 - Workout 1","Week 5 & 6 - Workout 2","Pre-Pointe Foundations Plan Booster"];
const backbendWorkouts=["Beginner - Week 1 & 2, Workout 1","Beginner - Week 1 & 2, Workout 2","Beginner - Week 3 & 4, Workout 1","Beginner - Week 3 & 4, Workout 2","Beginner - Week 5 & 6, Workout 1","Beginner - Week 5 & 6, Workout 2","Intermediate - Week 1 & 2, Workout 1","Intermediate - Week 1 & 2, Workout 2","Intermediate - Week 3 & 4, Workout 1","Intermediate - Week 3 & 4, Workout 2","Intermediate - Week 5 & 6, Workout 1","Intermediate - Week 5 & 6, Workout 2","Advanced - Week 1 & 2, Workout 1","Advanced - Week 1 & 2, Workout 2","Advanced - Week 1 & 2, Workout 3","Advanced - Week 3 & 4, Workout 1","Advanced - Week 3 & 4, Workout 2","Advanced - Week 3 & 4, Workout 3","Advanced - Week 5 & 6, Workout 1","Advanced - Week 5 & 6, Workout 2","Advanced - Week 5 & 6, Workout 3",'"The Needle" Training Plan - Workout A','"The Needle" Training Plan - Workout B','"The Needle" Training Plan - Workout C',"Wrist Mobility & Strength - Workout A","Wrist Mobility & Strength - Workout B"];
const workoutOptions={flexibility:flexibilityWorkouts,turnout:turnoutWorkouts,pirouette:pirouetteWorkouts,"foot-ankle":footAnkleWorkouts,backbend:backbendWorkouts};
let state=loadState(),saveTimer=null;
const $=s=>document.querySelector(s),todayPrograms=$("#todayPrograms"),programGrid=$("#programGrid"),todayTemplate=$("#todayProgramTemplate"),cardTemplate=$("#programCardTemplate"),syncStatus=$("#syncStatus"),syncNow=$("#syncNow");

$("#todayDate").textContent=new Intl.DateTimeFormat(undefined,{weekday:"long"}).format(new Date());
document.querySelectorAll("[data-view]").forEach(button=>button.addEventListener("click",()=>selectView(button.dataset.view)));
$("#resetProgress").addEventListener("click",()=>{if(!confirm("Reset all Kineto progress? Your level choices will stay the same."))return;state.completed={};saveState();render()});
syncNow.addEventListener("click",()=>loadCloudState(true));
render();loadCloudState(false);

function defaultState(){return{levels:{flexibility:"beginner",backbend:"beginner"},selections:{},completed:{},updatedAt:""}}
function loadState(){try{return normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY)))}catch{return defaultState()}}
function normalizeState(value){const next=defaultState();if(!value||typeof value!=="object")return next;programs.filter(p=>p.levels).forEach(p=>{if(LEVELS.includes(value.levels?.[p.id]))next.levels[p.id]=value.levels[p.id]});if(value.selections&&typeof value.selections==="object")next.selections=value.selections;if(value.completed&&typeof value.completed==="object")next.completed=value.completed;if(typeof value.updatedAt==="string")next.updatedAt=value.updatedAt;return next}
function render(){renderToday();renderPrograms()}

function renderToday(){
  const now=new Date(),day=now.getDay(),week=cycleWeek(now),ids=[];todayPrograms.replaceChildren();
  programs.forEach((program,index)=>{
    const fragment=todayTemplate.content.cloneNode(true),id=workoutId(program,week,day),box=fragment.querySelector("[data-complete]");ids.push(id);
    fragment.querySelector("[data-program-number]").textContent=`Program ${index+1}`;fragment.querySelector("[data-program-name]").textContent=program.name;
    const workoutControl=fragment.querySelector("[data-workout-control]"),workoutSelect=fragment.querySelector("[data-workout-select]"),options=workoutOptions[program.id];if(options){workoutControl.hidden=false;workoutSelect.setAttribute("aria-label",`${program.name} workout`);options.forEach(name=>workoutSelect.add(new Option(name,name)));workoutSelect.value=selectedWorkout(program,week,day);workoutSelect.addEventListener("change",()=>{state.selections[selectionKey(program,week,day)]=workoutSelect.value;updateLevelFromWorkout(program,workoutSelect.value);saveState();render()})}
    const pill=fragment.querySelector("[data-level]");if(program.levels)pill.textContent=state.levels[program.id];else pill.hidden=true;
    box.checked=Boolean(state.completed[id]);box.setAttribute("aria-label",`Mark ${program.name} complete`);box.addEventListener("change",()=>{state.completed[id]=box.checked;saveState();render()});todayPrograms.append(fragment);
  });
  const count=ids.filter(id=>state.completed[id]).length;$("#todayCompleted").textContent=count;$("#todayPlanned").textContent=ids.length;$("#todayMessage").textContent=count===ids.length?"Today’s routine is complete. Beautiful work.":now<PLAN_START?"Trial week · Your official Week 1 starts Sunday, September 6.":`Week ${week} · Complete one session from each program.`;
}

function renderPrograms(){
  programGrid.replaceChildren();
  programs.forEach((program,index)=>{
    const fragment=cardTemplate.content.cloneNode(true),now=new Date(),currentWeek=cycleWeek(now),currentDay=now.getDay();fragment.querySelector("[data-program-number]").textContent=`Program ${index+1}`;fragment.querySelector("[data-program-name]").textContent=program.name;
    const programWorkoutControl=fragment.querySelector("[data-program-workout-control]"),programWorkoutSelect=fragment.querySelector("[data-program-workout-select]"),options=workoutOptions[program.id];if(options){programWorkoutControl.hidden=false;fragment.querySelector("[data-program-workout-label]").textContent=`${DAYS[currentDay]} workout`;programWorkoutSelect.setAttribute("aria-label",`${program.name} ${DAYS[currentDay]} workout`);options.forEach(name=>programWorkoutSelect.add(new Option(name,name)));programWorkoutSelect.value=selectedWorkout(program,currentWeek,currentDay);programWorkoutSelect.addEventListener("change",()=>{state.selections[selectionKey(program,currentWeek,currentDay)]=programWorkoutSelect.value;updateLevelFromWorkout(program,programWorkoutSelect.value);saveState();render()})}
    const allIds=[];for(let week=1;week<=PLAN_WEEKS;week++)DAYS.forEach((_,day)=>allIds.push(workoutId(program,week,day)));const done=allIds.filter(id=>state.completed[id]).length;fragment.querySelector("[data-progress-count]").textContent=`${done}/${PLAN_WEEKS*7}`;fragment.querySelector("[data-progress-bar]").style.width=`${done/(PLAN_WEEKS*7)*100}%`;
    const grid=fragment.querySelector("[data-eight-weeks]"),corner=document.createElement("span");corner.setAttribute("aria-hidden","true");grid.append(corner);DAYS.forEach(name=>{const label=document.createElement("span");label.className="day-heading";label.textContent=name.slice(0,1);grid.append(label)});for(let week=1;week<=PLAN_WEEKS;week++){const weekLabel=document.createElement("strong");weekLabel.className="week-label";weekLabel.textContent=`Week ${week}`;grid.append(weekLabel);DAYS.forEach((name,day)=>{const id=workoutId(program,week,day),item=document.createElement("span");item.className="day-spot";item.title=`Week ${week}, ${name}: ${sessionName(program,week,day)}`;item.setAttribute("aria-label",item.title+(state.completed[id]?", complete":", not complete"));if(state.completed[id])item.classList.add("is-complete");if(week===currentWeek&&day===currentDay)item.classList.add("is-today");grid.append(item)})}programGrid.append(fragment);
  });
}

function updateLevelFromWorkout(program,value){if(!program.levels)return;const selectedLevel=LEVELS.find(level=>value.includes(title(level)));if(selectedLevel)state.levels[program.id]=selectedLevel}
function selectView(view){$("#todayView").hidden=view!=="today";$("#programsView").hidden=view!=="programs";document.querySelectorAll("[data-view]").forEach(button=>{const active=button.dataset.view===view;button.classList.toggle("is-active",active);active?button.setAttribute("aria-current","page"):button.removeAttribute("aria-current")})}
function cycleWeek(date){if(date<PLAN_START)return 1;const days=Math.floor((date-PLAN_START)/86400000);return Math.floor(days/7)%PLAN_WEEKS+1}
function workoutId(program,week,day){return`${program.id}:${program.levels?state.levels[program.id]:"standard"}:week-${week}:day-${day}`}
function selectionKey(program,week,day){return`${program.id}:week-${week}:day-${day}`}
function selectedWorkout(program,week,day){const options=workoutOptions[program.id]||[],saved=state.selections[selectionKey(program,week,day)];if(options.includes(saved))return saved;if(program.id==="flexibility"){const level=title(state.levels.flexibility),matches=options.filter(name=>name.includes(` ${level} -`));return matches[day%matches.length]||options[0]}if(["turnout","pirouette","foot-ankle"].includes(program.id)){const pairStart=week<=2?0:week<=4?2:4;return options[pairStart+(day%2)]}if(program.id==="backbend"){const pair=week<=2?"1 & 2":week<=4?"3 & 4":"5 & 6",level=title(state.levels.backbend),matches=options.filter(name=>name.startsWith(`${level} - Week ${pair}`));return matches[day%matches.length]||options[0]}return options[0]}
function sessionName(program,week,day){if(workoutOptions[program.id])return selectedWorkout(program,week,day);return"Daily conditioning"}
function title(value){return value.charAt(0).toUpperCase()+value.slice(1)}

function saveState(){state.updatedAt=new Date().toISOString();localStorage.setItem(STORAGE_KEY,JSON.stringify(state));if(!CLOUD_ENABLED)return;clearTimeout(saveTimer);saveTimer=setTimeout(saveCloudState,500)}
function loadCloudState(force){
  if(!CLOUD_ENABLED){syncStatus.textContent="Progress is saved on this device.";syncNow.hidden=true;return}
  syncStatus.textContent=force?"Refreshing…":"Loading synced progress…";syncNow.disabled=true;
  const callback=`kinetoLoad_${Date.now()}`,script=document.createElement("script"),url=new URL(CLOUD_URL);url.searchParams.set("action","load");url.searchParams.set("callback",callback);url.searchParams.set("_",Date.now());if(CLOUD_TOKEN)url.searchParams.set("token",CLOUD_TOKEN);
  const cleanup=()=>{delete window[callback];script.remove();syncNow.disabled=false};window[callback]=response=>{cleanup();if(!response?.ok){syncStatus.textContent="Sync unavailable. Progress is saved on this device.";return}const cloud=normalizeState(response.state);if((Date.parse(cloud.updatedAt)||0)>(Date.parse(state.updatedAt)||0)){state=cloud;localStorage.setItem(STORAGE_KEY,JSON.stringify(state));render();syncStatus.textContent="Progress synced."}else saveCloudState()};script.onerror=()=>{cleanup();syncStatus.textContent="Sync unavailable. Progress is saved on this device."};script.src=url;document.body.append(script);
}
function saveCloudState(){if(!CLOUD_ENABLED)return;syncStatus.textContent="Saving…";const name="kinetoSyncFrame";let frame=document.querySelector(`iframe[name="${name}"]`);if(!frame){frame=document.createElement("iframe");frame.name=name;frame.hidden=true;document.body.append(frame)}const form=document.createElement("form");form.method="POST";form.action=CLOUD_URL;form.target=name;form.hidden=true;addField(form,"payload",JSON.stringify({appVersion:APP_VERSION,state}));if(CLOUD_TOKEN)addField(form,"token",CLOUD_TOKEN);document.body.append(form);form.submit();form.remove();setTimeout(()=>syncStatus.textContent="Progress synced.",700)}
function addField(form,name,value){const input=document.createElement("input");input.type="hidden";input.name=name;input.value=value;form.append(input)}
