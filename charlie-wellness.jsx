import { useState, useEffect, useRef, useMemo, createContext, useContext, useId } from "react";
import { exPhotos } from "./exercise-images.js";
import { hasFigure, figureSVG, figureCue } from "./exercise-figures.js";

const hasDemo = name => !!exPhotos(name) || hasFigure(name);
const useSvgId = () => useId().replace(/[^a-zA-Z0-9]/g, "");

const speakEx = (name, note = "") => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(note ? `${name}. ${note}` : name);
  utt.rate = 0.88;
  window.speechSynthesis.speak(utt);
};

const C = {
  bg:"#080808", card:"#0f0f0f", border:"#1a1a1a",
  yellow:"#D4F53C", red:"#FF3D1F", teal:"#00E5CC",
  blue:"#3D8EFF", purple:"#B06EFF", orange:"#FF8C42", green:"#4CAF50",
  muted:"#3a3a3a", dim:"#181818", text:"#e8e8e8", soft:"#666",
};

// ── Exercise Pools ────────────────────────────────────────────────────────────
const AEROBIC_POOL = ["Jumping Jacks","High Knees","Stair Jumps","Side Skaters","Squat Jumps","Fast Feet","Jump Rope","Side Jump Lunges","Butt Kicks"];

const LOW_IMPACT_POOL = ["Speed Squats","Rapid Reverse Lunges","Low-Impact Skater Steps","Squat to Calf Raise","Speed Lateral Lunges","Kettlebell Swings","Bicycle Crunches","Glute Bridge Marches","Russian Twists"];

const SNACK_CONFIG = [
  { id:1, label:"SNACK 01", name:"NEURAL WAKE-UP",   color:C.yellow, note:"Smooth start — prime the body, don't redline.", duration:60 },
  { id:2, label:"SNACK 02", name:"VO2 BUILDER",      color:C.red,    note:"Main spike. Stay powerful and controlled.",    duration:60 },
  { id:3, label:"SNACK 03", name:"STABILITY FINISH", color:C.teal,   note:"Lock it in. Full output to the end.",          duration:60 },
];

const LIFTING_A = {
  label:"ARMS / CHEST", color:C.yellow,
  // category = guaranteed slot in daily 5: chest_press | chest_iso | bicep | tricep | shoulder
  exercises:[
    { name:"Dumbbell Floor Press",        sets:"3×10", note:"Floor limits range, zero impingement",          muscles:["chest","triceps"], cat:"chest_press" },
    { name:"Neutral-Grip DB Press",       sets:"3×10", note:"Palms facing in, easier on AC joint",           muscles:["chest","triceps"], cat:"chest_press" },
    { name:"Band Chest Press",            sets:"3×12", note:"Band anchored behind, press forward",           muscles:["chest","triceps"], cat:"chest_press" },
    { name:"Band Chest Fly",              sets:"3×12", note:"Band anchored behind, sweep together at chest", muscles:["chest"],           cat:"chest_iso"   },
    { name:"Band Crossover (low anchor)", sets:"3×12", note:"Band low, sweep arm up and across body",        muscles:["chest"],           cat:"chest_iso"   },
    { name:"DB Curl",                     sets:"3×12", note:"Supinate at top, slow negative",                muscles:["biceps"],          cat:"bicep"       },
    { name:"Hammer Curl",                 sets:"3×12", note:"Neutral grip throughout",                       muscles:["biceps"],          cat:"bicep"       },
    { name:"Concentration Curl",          sets:"3×10", note:"Elbow braced on knee, no momentum",             muscles:["biceps"],          cat:"bicep"       },
    { name:"Incline DB Curl",             sets:"3×12", note:"Reclined against wall, arms behind hip line",   muscles:["biceps"],          cat:"bicep"       },
    { name:"Spider Curl",                 sets:"3×10", note:"Face down on pillow stack, arms hang straight", muscles:["biceps"],          cat:"bicep"       },
    { name:"Band Overhead Tricep Ext",    sets:"3×12", note:"Band underfoot, elbows in tight overhead",      muscles:["triceps"],         cat:"tricep"      },
    { name:"Tricep Pushdown (band)",      sets:"3×15", note:"Elbows pinned to sides, extend down",           muscles:["triceps"],         cat:"tricep"      },
    { name:"DB Skull Crusher (floor)",    sets:"3×12", note:"Hinge at elbow only, lower toward forehead",    muscles:["triceps"],         cat:"tricep"      },
    { name:"Band Y-Raise",                sets:"3×15", note:"Arms form Y overhead, light band, mid trap",    muscles:["shoulders"],       cat:"shoulder"    },
    { name:"Band W-Raise",                sets:"3×15", note:"Elbows bent into W shape, lower trap focus",      muscles:["shoulders"],       cat:"shoulder"    },
    { name:"Band Reverse Fly",            sets:"3×15", note:"Bent over, band anchored in front, pull arms wide and back", muscles:["shoulders","back"], cat:"shoulder" },
    { name:"Band Front Raise",            sets:"3×12", note:"Palms up (supinated grip), band underfoot, raise arm forward to shoulder height, slow controlled lower", muscles:["shoulders"], cat:"shoulder" },
    { name:"Band Lateral Raise",          sets:"3×12", note:"Band underfoot, raise arm to side, elbow soft, pause at top", muscles:["shoulders"], cat:"shoulder" },
    { name:"Band Low-to-High Fly",        sets:"3×12", note:"Band anchored low, sweep arm up and across, upper chest focus", muscles:["chest"], cat:"chest_iso" },
    { name:"Band Chest Squeeze",          sets:"3×12", note:"Bands from each side, press palms together at chest, hold 2s", muscles:["chest"], cat:"chest_iso" },
    { name:"Incline DB Press (30°)",      sets:"3×10", note:"30° incline maximizes upper pec. Full ROM — do not cut the top. Palms face forward.", muscles:["chest","triceps"], cat:"chest_press" },
    { name:"Zottman Curl",               sets:"3×10", note:"Supinate on the way up, pronate on the way down. Loads brachioradialis on eccentric — two muscles per rep.", muscles:["biceps"], cat:"bicep" },
    { name:"Overhead DB Tricep Ext",     sets:"3×12", note:"Long head only fully stretches when arm is elevated. Elbows straight to ceiling, no flare. This is the 55% of tricep that pushdowns miss.", muscles:["triceps"], cat:"tricep" },
    { name:"DB Prone Y-T-W",             sets:"3×12", note:"Face down on floor, light DBs. Y=lower trap, T=mid trap+rear delt, W=infraspinatus. Three patterns, one setup.", muscles:["shoulders","back"], cat:"shoulder" },
    { name:"Serratus Wall Slide (A)",    sets:"3×12", note:"Forearms on wall, slide up, push wall away at top. Feel ribs protract. Critical for AC joint stability.", muscles:["shoulders"], cat:"shoulder" },
    { name:"DB Squeeze Press",           sets:"3×10", note:"Press DBs together hard through the whole rep. Constant inner-pec tension — highest pec EMG of any floor-safe press variation.", muscles:["chest","triceps"], cat:"chest_press" },
    { name:"DB Floor Fly",               sets:"3×12", note:"Slight elbow bend, lower until upper arms touch floor — built-in safety stop protects the AC joint at the stretch position.", muscles:["chest"], cat:"chest_iso" },
    { name:"Band Tricep Kickback",       sets:"3×15", note:"Hinge forward, elbow pinned high. Peak contraction at full extension — bands beat DBs here because tension peaks where the muscle shortens.", muscles:["triceps"], cat:"tricep" },
  ],
  // One pick per category — guaranteed full coverage every session
  categories: ["chest_press","chest_iso","bicep","tricep","shoulder"],
};

const LIFTING_B = {
  label:"LEGS / BACK", color:C.teal,
  // category = guaranteed slot in daily 5: hinge | squat | posterior | back_pull | core_acc
  exercises:[
    { name:"Romanian Deadlift",        sets:"3×10",      note:"Hip hinge, soft knees, DBs track down legs",         muscles:["hamstrings","glutes"], cat:"hinge"      },
    { name:"Hip Thrust (DB)",          sets:"3×12",      note:"Shoulders on couch, DB on hips, drive up",           muscles:["glutes","hamstrings"], cat:"hinge"      },
    { name:"Goblet Squat",             sets:"3×12",      note:"DB at chest, full depth, chest up",                  muscles:["quads","glutes"],      cat:"squat"      },
    { name:"Bulgarian Split Squat",    sets:"3×8 each",  note:"Rear foot elevated, front foot forward",             muscles:["quads","glutes"],      cat:"squat"      },
    { name:"Lateral Lunge",            sets:"3×10 each", note:"Step wide, sit into hip, chest tall",                muscles:["quads","glutes"],      cat:"squat"      },
    { name:"Sumo Squat",               sets:"3×12",      note:"Wide stance, toes out, DB between legs",             muscles:["quads","glutes"],      cat:"squat"      },
    { name:"Hamstring Curl (band)",    sets:"3×12",      note:"Face down, band at ankle, curl to glute",            muscles:["hamstrings"],          cat:"hamstring_iso" },
    { name:"Calf Raise",               sets:"3×20",      note:"Full range, hold DBs or single-leg",                 muscles:["calves"],              cat:"core_acc"      },
    { name:"Single-Arm DB Row",        sets:"3×10 each", note:"Brace on knee, pull elbow to hip",                   muscles:["back"],                cat:"back_pull"  },
    { name:"Chest-Supported Row",      sets:"3×10",      note:"Face down on pillow stack, row DBs up",              muscles:["back"],                cat:"back_pull"  },
    { name:"Seated Row (band/door)",   sets:"3×12",      note:"Door anchor, sit on floor, row to hips",             muscles:["back"],                cat:"back_pull"  },
    { name:"Band Pull-Apart",          sets:"3×20",      note:"Band at chest, pull to T, scapular retraction",      muscles:["back","shoulders"],    cat:"back_pull"  },
    { name:"Face Pull (band)",         sets:"3×15",      note:"Band at face height, external rotation at end",      muscles:["back","shoulders"],    cat:"back_pull"  },
    { name:"Dead Bug (band)",          sets:"3×10 each", note:"Band overhead, extend opposite arm and leg",         muscles:["core"],                cat:"core_acc"   },
    { name:"Pallof Press (band/door)", sets:"3×12 each", note:"Door anchor, press out from chest, resist rotation", muscles:["core"],                cat:"core_acc"   },
    { name:"Good Morning (band)",      sets:"3×12",      note:"Band across upper back, hinge at hip. Soft knees — NOT a squat. Trains hip hinge motor pattern under axial load.", muscles:["hamstrings","glutes","back"], cat:"hinge" },
    { name:"DB Step-Up (stair)",       sets:"3×12 each", note:"Step height so hip reaches 90° at bottom. Eliminates stretch reflex, forces true quad concentric. Underrated for VMO.", muscles:["quads","glutes"], cat:"squat" },
    { name:"Copenhagen Plank",         sets:"3×25s each",note:"Side plank with top knee on bench. Gold standard adductor exercise. Progress to foot on bench when easy.", muscles:["core","glutes"], cat:"core_acc" },
    { name:"DB Seal Row",              sets:"3×10",      note:"Face down on elevated surface, elbow flares 45-60° from torso. Covers mid-trap/rhomboid angle all standard rows miss.", muscles:["back","shoulders"], cat:"back_pull" },
    { name:"Single-Leg RDL (DB)",      sets:"3×10 each", note:"DB in opposite hand to working leg. Balance demand recruits glute med while loading the hinge — two adaptations per rep.", muscles:["hamstrings","glutes"], cat:"hinge" },
    { name:"B-Stance Hip Thrust",      sets:"3×10 each", note:"Shoulders on couch, 80% load on front leg, back foot just for balance. Unilateral glute drive without full single-leg instability.", muscles:["glutes","hamstrings"], cat:"hinge" },
    { name:"Sliding Leg Curl (towel)", sets:"3×10",      note:"On back, heels on towel. Bridge up, slide heels out and in keeping hips tall. Highest hamstring EMG of any home variation — eccentric is everything.", muscles:["hamstrings","glutes"], cat:"hamstring_iso" },
    { name:"Single-Leg Sliding Curl",  sets:"3×6 each",  note:"Same as sliding curl, one leg. Brutal eccentric load — the closest home substitute for a Nordic curl.", muscles:["hamstrings"], cat:"hamstring_iso" },
    { name:"Standing Band Leg Curl",   sets:"3×15 each", note:"Band at ankle, anchored low behind. Curl heel to glute standing tall. Constant tension, zero lower-back involvement.", muscles:["hamstrings"], cat:"hamstring_iso" },
    { name:"Banded Razor Curl",        sets:"3×8",       note:"Kneel, ankles anchored under couch, band assist from front. Lower torso forward hinging at knee only. Eccentric hamstring strength — injury-proofing gold.", muscles:["hamstrings"], cat:"hamstring_iso" },
    { name:"Suitcase Carry",           sets:"3×30s each",note:"One heavy DB at side, walk tall without leaning. Anti-lateral-flexion core, obliques, QL, and grip in one movement.", muscles:["core"], cat:"core_acc" },
  ],
  // One pick per category — guaranteed full coverage every session
  categories: ["hinge","squat","hamstring_iso","back_pull","core_acc"],
};

const REHAB = [
  { name:"Band Pull-Apart",          sets:"3×20",       note:"Light band, full retraction" },
  { name:"Face Pull (band)",         sets:"3×15",       note:"External rotation at end" },
  { name:"Pendulum Circles",         sets:"2×30s each", note:"Passive arm hang" },
  { name:"Scapular Retraction",      sets:"3×15",       note:"Squeeze shoulder blades" },
  { name:"Wall Slide",               sets:"3×10",       note:"Forearms on wall, slide up" },
  { name:"Sleeper Stretch",          sets:"3×30s each", note:"Side-lying internal rotation" },
  { name:"Cross-Body Stretch",       sets:"3×30s each", note:"Gentle posterior capsule" },
  { name:"External Rotation (band)", sets:"3×15 each",  note:"Elbow at 90°, band at side" },
];

const SCIENCE_CUES = {
  chest_press:   "Lead with your elbows on the descent — the pec is fully lengthened under load at the bottom stretch. That's where growth happens.",
  chest_iso:     "Keep tension on the pec throughout — the moment you lock out, tension drops to near zero. Stop 10° short of full extension.",
  bicep:         "Pin your elbow slightly behind your hip at the top — the bicep can only fully contract past neutral. Anterior delt cannot substitute that final range.",
  tricep:        "Overhead position only loads the long head (55% of total tricep volume). Pushdowns and kickbacks miss it entirely.",
  shoulder:      "Finish every face pull rep with thumbs behind your ears — that forced external rotation trains the infraspinatus, not just the rear delt.",
  hinge:         "Push the floor away with your hips at lockout — glute drive prevents the lumbar hyperextension most people default to.",
  squat:         "Screw your feet into the floor without moving them — external rotation torque activates glute med and eliminates knee valgus without any conscious knee thought.",
  back_pull:     "Lead with your elbow, not your hand — if you feel it in your forearms, the bicep is driving, not the lat.",
  core:          "Brace like you're about to take a punch from all four directions simultaneously. 360° compression — not sucking in, not pushing out.",
  hamstring_iso: "Initiate the curl by digging your heel down before bending your knee — pre-loads the hamstring at insertion and eliminates quad substitution.",
};

const EXTRAS_POOLS = {
  serratus: {
    id:"serratus", label:"SERRATUS ANTERIOR", icon:"⟁", color:"#D4F53C",
    urgency:"CRITICAL", shoulderSafe:true,
    note:"The shoulder's foundation. Weak serratus is the #1 contributor to AC joint issues. This is not optional.",
    exercises:[
      { name:"Serratus Wall Slide",      sets:"3×12",     note:"Forearms on wall, slide up, push wall away at top. Feel the blade wrap around your ribcage. That final push IS the exercise." },
      { name:"Serratus Punch (lying)",   sets:"3×15",     note:"Arm vertical, light DB. Reach for the ceiling by protracting the scapula — not lifting the arm. The blade moves, not the humerus." },
      { name:"Bear Crawl (slow)",        sets:"3×20m",    note:"Hips low, back flat, ribs braced. Every step demands constant serratus activation to prevent winging. Harder than it looks." },
      { name:"Quadruped Shoulder Tap",   sets:"3×10 each",note:"Slow, no hip rotation. Planted arm serratus stabilizes the blade under full bodyweight while opposite hand lifts." },
      { name:"Wall Push-Up Plus",        sets:"3×12",     note:"At the top of each rep, add an extra push — chest further from wall. That last 2cm is the serratus contraction. Never skip it." },
    ],
  },
  neck: {
    id:"neck", label:"NECK", icon:"◎", color:"#FF3D1F",
    urgency:"HIGH", shoulderSafe:true,
    note:"Neck strength reduces impact force transmission. Never load heavy. Stop immediately if you feel any sharp or shooting sensation.",
    exercises:[
      { name:"Neck Flexion (hand resist)",sets:"3×12",     note:"Palm on forehead. Push head forward against hand resistance — hand wins. Tongue on roof of mouth activates deep cervical flexors." },
      { name:"Lateral Flexion (hand)",   sets:"3×10 each",note:"Hand on side of head, ear to shoulder. Shoulder stays depressed — zero shrugging. Pain means stop immediately." },
      { name:"Isometric Rotation Hold",  sets:"3×25s each",note:"Hand on temple, try to rotate — hand prevents movement. No forced range. Jaw relaxed, breathe normally." },
      { name:"Neck Extension (light)",   sets:"3×10",     note:"Hand on back of skull, push head back gently against hand. Small range, avoid hyperextension. Most undertrained cervical pattern." },
      { name:"Chin Tuck",                sets:"3×10",     note:"Pull chin straight back — double chin position. Hold 3s. Releases forward-head posture that loads the cervical spine under any pressing load." },
    ],
  },
  tibialis: {
    id:"tibialis", label:"TIBIALIS ANTERIOR", icon:"◈", color:"#00E5CC",
    urgency:"HIGH", shoulderSafe:true,
    note:"The shin muscle that decelerates every foot strike. Weakness causes shin splints and knee pain via altered gait mechanics.",
    exercises:[
      { name:"Tibialis Raise (heels on step)",sets:"3×20",     note:"Heels on step edge, feet hanging. Pull toes to shins as high as possible. Controlled return. Add ankle weight when easy." },
      { name:"Banded Dorsiflexion (seated)", sets:"3×15 each",note:"Band around forefoot, anchored low. Pull toes to shin against resistance. Full range, slow return." },
      { name:"Heel Walk",                    sets:"3×20m",    note:"Walk on heels only, toes pointed up. By 15 meters you will feel exactly where your tibialis is." },
      { name:"Farmer Carry on Heels",        sets:"2×20m",    note:"Same as heel walk but with light DBs. Forces constant anterior shin activation for shock absorption." },
      { name:"Single-Leg Heel Balance",      sets:"3×30s each",note:"Balance on one heel only, toes raised. Tibialis works isometrically to maintain position." },
    ],
  },
  adductors: {
    id:"adductors", label:"ADDUCTORS", icon:"◉", color:"#3D8EFF",
    urgency:"HIGH", shoulderSafe:true,
    note:"Athletes with weak adductors are 17× more likely to sustain a groin injury. They're also primary hip stabilizers in every step you take.",
    exercises:[
      { name:"Copenhagen Plank (knee)",   sets:"3×25s each",note:"Side plank with top knee on bench. Gold standard adductor exercise. Progress to foot on bench when ready." },
      { name:"Band Hip Adduction (stand)",sets:"3×15 each",note:"Band at ankle, anchored to side. Slow cross-body pull. Control the return. The leg moves — not the hip." },
      { name:"Lateral Lunge + 3s Hold",  sets:"3×8 each", note:"Step wide, hold 3s at bottom before returning. End range under stretch-load is the most undertrained adductor position." },
      { name:"Sumo Squat Pulse",          sets:"3×15",     note:"Wide stance, toes out 45°. Lower to parallel, pulse 2 inches × 5, then return. Adductors under sustained tension throughout." },
      { name:"Adductor Squeeze Hold",     sets:"3×15",     note:"On back, knees bent, rolled towel between knees. Squeeze and hold 2s, slow release. Pure isometric adductor activation." },
    ],
  },
  glutemed: {
    id:"glutemed", label:"GLUTE MED", icon:"◯", color:"#B06EFF",
    urgency:"HIGH", shoulderSafe:true,
    note:"Standard squats activate glute med at 28–40% MVC. Dedicated work hits 81% MVC. You cannot squat your way to adequate glute med strength.",
    exercises:[
      { name:"Side-Lying Abduction (band)",sets:"3×18 each",note:"Toes pointed slightly DOWN — isolates the posterior glute med, the weak and undertrained portion in nearly everyone." },
      { name:"Single-Leg Glute Bridge",    sets:"3×12 each",note:"Band above knees creates adduction pressure the glute med must resist. Drive through heel, not toe." },
      { name:"Lateral Band Walk",          sets:"3×15 each",note:"Band above knees, hip-width, partial squat. Constant tension — knees track over toes at all times." },
      { name:"Clamshell (band)",           sets:"3×18 each",note:"Side-lying, hips stacked, knees 90°. Rotate top knee toward ceiling keeping feet together. Band adds end-range resistance." },
      { name:"Single-Leg Hip Hike",        sets:"3×10 each",note:"Stand on one leg. Slowly drop opposite hip, drive it back up using standing-leg glute med. This is what your glute med does in every step." },
    ],
  },
  obliques: {
    id:"obliques", label:"OBLIQUES", icon:"⬡", color:"#FF8C42",
    urgency:"MEDIUM", shoulderSafe:true,
    note:"Anti-rotation patterns are 3:1 priority over crunch-based oblique work. Resist rotation before you produce it.",
    exercises:[
      { name:"Pallof Press (2s hold)",    sets:"3×12 each",note:"Band at sternum height. Press straight out, hold 2 seconds, return. The pause at full extension IS the anti-rotation work." },
      { name:"Band Woodchop (high-low)",  sets:"3×10 each",note:"Controlled full range. The eccentric return phase is where obliques are most loaded — do not rush it." },
      { name:"Suitcase Carry (one DB)",   sets:"3×35m each",note:"Single DB at side. Walk without letting torso lean toward the weight. Covers obliques, QL, and glute med simultaneously." },
      { name:"Side Plank Hip Dip",        sets:"3×10 each",note:"Standard side plank. Lower hip toward floor, drive back up. Adds dynamic load to the isometric hold." },
      { name:"Dead Bug + Band Resist",    sets:"3×8 each", note:"Band around one foot, anchored at floor. Extending that leg pulls the band — core resists rotation and extension simultaneously." },
    ],
  },
  forearms: {
    id:"forearms", label:"FOREARMS & GRIP", icon:"◌", color:"#00E5CC",
    urgency:"MEDIUM", shoulderSafe:true,
    note:"Grip strength is a top predictor of all-cause mortality. Every 5kg decline correlates with 17% increased cardiovascular death risk (Lancet, 2015, 140,000-person study).",
    exercises:[
      { name:"Farmer Carry (heavy)",      sets:"3×35m",    note:"Most time-efficient grip builder. Walk at moderate pace, shoulders depressed — do not let them creep toward your ears." },
      { name:"Wrist Curl + Reverse Curl", sets:"3×15 each dir",note:"Both directions required — training only flexion without extension creates an imbalance that leads to tendinitis. Full range, slow eccentric." },
      { name:"Dead Hang",                 sets:"3×30s",    note:"Decompresses the spine simultaneously. Start bent-arm if AC joint is sensitive — test conservatively, progress to full hang." },
      { name:"Plate Pinch Carry",         sets:"3×25s",    note:"Two plates held together smooth-sides out. Builds pinch strength — most undertrained grip pattern and strongest predictor of hand strength." },
      { name:"Towel Wring",               sets:"2×90s",    note:"Both hands, wring in both directions. Conditions tendons and pulleys — structural tissue that only responds to sustained low-load time-under-tension." },
    ],
  },
  wrists: {
    id:"wrists", label:"WRISTS & HANDS", icon:"◑", color:"#FF8C42",
    urgency:"MEDIUM", shoulderSafe:true,
    note:"Tendons and ligaments thicken in response to progressive load over weeks, not sessions. Consistency here is everything.",
    exercises:[
      { name:"Wrist Roller",              sets:"3× full up-down",note:"Both pronated and supinated grip. Slow descent — eccentric phase is where connective tissue loading occurs." },
      { name:"Finger Extension (band)",   sets:"3×20 each",note:"Band around all five fingers, spread against resistance. Restores extensor-flexor balance that desk work destroys." },
      { name:"Reverse Curl (light DB)",   sets:"3×15",     note:"Palms facing down, curl as normal. Isolates brachioradialis and wrist extensor complex. Completely absent in most programs." },
      { name:"Wrist Stretch (both ways)", sets:"3×30s each",note:"Palm flat on wall, fingers down (flexor stretch), then fingers up (extensor stretch). Equal time both directions." },
      { name:"DB Forearm Rotation",       sets:"3×12 each",note:"Light DB at end. Rotate from neutral (hammer) to fully supinated and back. Trains forearm rotation ROM under load." },
    ],
  },
};

// ── Bonus Library — curated anytime workouts, not tied to a daily plan ───────
const BONUS_POOLS = {
  shaolin: {
    id:"shaolin", label:"SHAOLIN ISOMETRIC HOLDS", icon:"☯", color:"#FF3D1F",
    urgency:"BONUS",
    note:"6 bodyweight holds, no equipment. Each has a 3-week progression — start at Week 1 regardless of fitness level and let time-under-tension do the work.",
    exercises:[
      { name:"Hollow Body Hold",     sets:"Wk1 3×15s · Wk2 3×20s · Wk3 both legs extended", note:"Press lower back into the floor, arms extended overhead, knees bent then legs extended as you progress. Hold and breathe — don't let the lower back arch off the floor." },
      { name:"Horse Stance",         sets:"Wk1 3×20s quarter squat · Wk2 3×30s half depth · Wk3 3×60s thighs parallel", note:"Feet wider than shoulders, toes slightly out, chest tall, spine tall. Sink lower each week — knees track over toes." },
      { name:"Wall Sit",             sets:"Wk1 3×20s 45° · Wk2 3×30s near parallel · Wk3 3×60s thighs parallel", note:"Back flat against wall, slide down, knees stack over ankles. Press back into the wall and drive through heels." },
      { name:"Bottom Push-Up Hold",  sets:"Wk1 3×10-15s · Wk2 3×20-30s · Wk3 3×45-60s", note:"Lower into a push-up until chest is just above the floor and hold there. Elbows ~45° from the body, stay rigid, breathe." },
      { name:"Bear Crawl Hold",      sets:"Wk1 3×15-20s · Wk2 3×20-30s · Wk3 3×45-60s", note:"Hands under shoulders, knees hover 1-2 inches off the ground, back flat, core braced. Hold and breathe." },
      { name:"Iron Bridge",          sets:"Wk1 3×20-30s · Wk2 3×45-60s · Wk3 3×60-90s", note:"Lie on your back, drive hips up into a bridge, squeeze glutes hard at the top. Body forms one straight line — hold and breathe." },
    ],
  },
  fullbody: {
    id:"fullbody", label:"FULL BODY STRENGTH", icon:"⬢", color:"#D4F53C",
    urgency:"BONUS",
    note:"Five compound lifts that cover the whole body in one session. Use whenever you want a straightforward strength day outside the normal split.",
    exercises:[
      { name:"Weighted Lunges",          sets:"3×10 each leg", note:"DB or barbell load. Step forward or back, control the descent, drive through the front heel to stand." },
      { name:"Bench Press",              sets:"4×8",           note:"Shoulder blades pulled together, feet planted. Controlled descent to the chest, press explosively back up." },
      { name:"Pull Ups",                 sets:"4×AMRAP",       note:"Full hang to chin over the bar. Control the negative — the eccentric is where most of the growth happens." },
      { name:"Romanian Deadlift",        sets:"3×10",          note:"Soft knees, hinge at the hips, bar/DBs stay close to the legs. Feel the hamstring stretch, drive hips forward to finish." },
      { name:"Standing Overhead Press",  sets:"3×8",           note:"Brace the core, press straight overhead. Squeeze glutes to stay stacked — don't let the lower back arch." },
    ],
  },
  overall: {
    id:"overall", label:"OVERALL BODY · MOBILITY & CARDIO", icon:"◍", color:"#00E5CC",
    urgency:"BONUS",
    note:"General-health staples — mobility, aerobic base, and power. Sprinkle these in throughout the week whenever you have a spare 10-20 minutes.",
    exercises:[
      { name:"Bar Hangs",                  sets:"3×30-45s",       note:"Dead hang from a pull-up bar, shoulders relaxed. Decompresses the spine and builds serious grip strength." },
      { name:"Japanese Interval Walking",  sets:"5×3min fast/slow", note:"Alternate 3 minutes brisk walking with 3 minutes easy walking. Proven to improve fitness better than steady-pace walking alone." },
      { name:"Asian Squat",                sets:"2-5 min total/day", note:"Full-depth squat, heels flat, chest up. A daily mobility reset for ankles, knees, and hips most desk-bound bodies have lost." },
      { name:"World's Greatest Stretch",   sets:"2×5 each side",  note:"Lunge forward, drop the back hand to the floor, rotate the front elbow to the sky. Hits hips, hamstrings, and t-spine in one flow." },
      { name:"Zone 2 Cardio",              sets:"30-45min, 2-3x/wk", note:"Easy pace — you should be able to hold a conversation. Builds the aerobic base everything else sits on." },
      { name:"Plyometrics",                sets:"3×6-8",          note:"Box jumps, bounds, or jump squats. Focus on quiet, soft landings — power matters more than height." },
      { name:"Loaded Carries",             sets:"3×40m",          note:"Farmer's or suitcase carry, heavy DBs/KBs. Walk tall, brace the core — grip, traps, and core all work overtime." },
    ],
  },
  back: {
    id:"back", label:"BACK & SPINE STABILITY", icon:"◫", color:"#3D8EFF",
    urgency:"BONUS",
    note:"Low-load spinal stability work — the kind that prevents injury rather than builds size. Great as a short standalone session or a warm-up.",
    exercises:[
      { name:"Reverse Hyperextension", sets:"3×12",           note:"Targets the multifidus at the base of the spine. Hinge over a bench edge, legs lift with control — no swinging." },
      { name:"Glute Bridges",          sets:"3×15",           note:"Stabilizes the pelvis, which supports the lumbar spine. Drive through the heels, squeeze hard at the top." },
      { name:"Dead Bug",               sets:"3×10 each side", note:"Focuses on the deep core — specifically the transversus abdominis. Lower back stays flat on the floor the entire time." },
      { name:"Bird Dog",               sets:"3×10 each side", note:"Activates both the multifidus and the deep core together. Opposite arm/leg extend in sync, hips stay square." },
      { name:"McGill Side Plank",      sets:"3×20-30s each side", note:"Trains the lateral chain and stabilizes the spine against rotational forces. Top hip stacked directly over the bottom." },
    ],
  },
  legs: {
    id:"legs", label:"BEST LEG EXERCISES", icon:"◭", color:"#FF8C42",
    urgency:"BONUS",
    note:"A leg-day add-on list — pick a few whenever you want extra volume beyond the standard LEGS/BACK split.",
    exercises:[
      { name:"Lateral Step Up",                  sets:"3×10 each leg", note:"Step up and over sideways onto a box or bench. Drives the glute med and outer quad through a range most leg days skip." },
      { name:"Bulgarian Split Squat",             sets:"3×10 each leg", note:"Rear foot elevated on a bench, front leg does the work. Torso stays tall, front knee tracks over the toes." },
      { name:"Glute Bridge with Feet Elevated",   sets:"3×15",          note:"Feet up on a bench, hips drive to full extension. The added range recruits more hamstring and glute than a floor bridge." },
      { name:"Deficit Calf Raises",               sets:"3×15",          note:"Stand on a step so the heels drop below toe level. Full stretch at the bottom, full squeeze at the top." },
      { name:"Farmer's Carry",                    sets:"3×40m",         note:"Heavy DB/KB in each hand, walk tall. Builds grip, trap, and core stability that transfers to every other leg lift." },
      { name:"Tibialis Raises",                   sets:"3×20",          note:"Heels on a step edge, pull toes up toward the shins. Protects the knees and ankles by balancing out calf-dominant training." },
    ],
  },
};

const SUPPLEMENTS = [
  { name:"Creatine",            dose:"5g",       timing:"Morning" },
  { name:"Fish Oil",            dose:"1000mg",   timing:"With meal" },
  { name:"Magnesium Glycinate", dose:"400mg",    timing:"Evening" },
  { name:"Berberine+",          dose:"1200mg",   timing:"With meal" },
  { name:"Protein Shake",       dose:"21g",      timing:"Post workout" },
  { name:"Biotin Gummies",      dose:"6000mcg",  timing:"Morning" },
  { name:"Zinc",               dose:"50mg",     timing:"With meal 2-3x/wk", color:C.red },
];

const DAILY_ITEMS = [
  { label:"Morning Sauna",   sublabel:"5–7×/week", color:C.red },
  { label:"Yoga",            sublabel:"2×/week",   color:C.purple },
  { label:"HIIT Snack 1",    sublabel:"Morning",   color:C.yellow },
  { label:"HIIT Snack 2",    sublabel:"Midday",    color:C.yellow },
  { label:"HIIT Snack 3",    sublabel:"Afternoon", color:C.yellow },
  { label:"Greens Smoothie", sublabel:"Daily",     color:C.teal },
  { label:"Protein Target",  sublabel:"Daily",     color:C.blue },
];

// ── Flex Day Pools ────────────────────────────────────────────────────────────
const FLEX_POOLS = {
  core: {
    id:"core", label:"CORE & STABILITY", color:C.blue, icon:"⬡",
    exercises:[
      { name:"Dead Bug (band)",          sets:"3×10 each", note:"Band overhead, extend opposite arm and leg" },
      { name:"Pallof Press (band/door)", sets:"3×12 each", note:"Door anchor, press out, resist rotation" },
      { name:"Bird Dog",                 sets:"3×10 each", note:"Contralateral, 5s hold each rep" },
      { name:"Hollow Body Hold",         sets:"3×30s",     note:"Full exhale at top, full core tension" },
      { name:"Side Plank",               sets:"3×30s each",note:"Lateral core, glute med engaged" },
      { name:"Band Woodchop (door)",     sets:"3×12 each", note:"Door anchor, diagonal pull, rotational core" },
      { name:"Banded Bridge",            sets:"3×15",      note:"Band above knees, squeeze glutes at top" },
      { name:"Band Lateral Walk",        sets:"3×15 each", note:"Band above knees, stay low, glute med" },
      { name:"Single-Leg Balance Hold",  sets:"3×45s each",note:"Eyes closed progression, DB in hands" },
      { name:"DB Farmer Carry",          sets:"3×30s",     note:"Heavy DBs, tall posture, brace core" },
    ],
  },
  mobility: {
    id:"mobility", label:"MOBILITY & LONGEVITY", color:C.teal, icon:"◎",
    exercises:[
      { name:"Hip Flexor Lunge Stretch",  sets:"3×60s each", note:"Deep front line release, tall torso" },
      { name:"Pigeon Pose",               sets:"3×60s each", note:"Glute/piriformis, breathe into the hold" },
      { name:"Figure-4 Stretch",          sets:"3×45s each", note:"IT band/glute, floor-based" },
      { name:"Supine Twist",              sets:"3×45s each", note:"Spinal rotation, lower back decompression" },
      { name:"Thread the Needle",         sets:"3×30s each", note:"Thoracic rotation, zero shoulder load" },
      { name:"DB Tempo Goblet Squat",     sets:"3×8",        note:"5s down, pause, 5s up — loaded mobility" },
      { name:"DB Single-Leg RDL (light)", sets:"3×10 each",  note:"Balance + hamstring lengthening" },
      { name:"Band Overhead Reach",       sets:"3×10 each",  note:"Band anchored low, reach overhead, lat stretch" },
      { name:"90/90 Hip Switch",          sets:"3×10 each",  note:"Hip internal/external rotation, floor-based" },
      { name:"DB Farmer Carry",           sets:"3×30s",      note:"Loaded gait, grip, full-body bracing" },
    ],
  },
  functional: {
    id:"functional", label:"FUNCTIONAL / ATHLETIC", color:C.yellow, icon:"◈",
    exercises:[
      { name:"Single-Leg Balance Hold",      sets:"3×45s each", note:"Eyes closed progression, DB in hands" },
      { name:"Single-Leg DB Deadlift",       sets:"3×10 each",  note:"Balance + hinge pattern, slow and controlled" },
      { name:"Band Lateral Walk",            sets:"3×15 each",  note:"Band above knees, stay low, glute med" },
      { name:"DB Lateral Lunge to Balance",  sets:"3×10 each",  note:"Step out, drive back to single-leg hold" },
      { name:"Band Diagonal Chop (door)",    sets:"3×12 each",  note:"Rotational power, athletic pattern" },
      { name:"Reverse Lunge to Knee Drive",  sets:"3×10 each",  note:"Single-leg, coordination, controlled" },
      { name:"DB Suitcase Carry",            sets:"3×30s each", note:"Unilateral load, anti-lateral-bend core" },
      { name:"Plank Shoulder Tap",           sets:"3×20 total", note:"Core stability, anti-rotation" },
      { name:"Band Resisted Step-Back Lunge",sets:"3×10 each",  note:"Band at waist, glute/hip control" },
      { name:"Staggered-Stance DB RDL",      sets:"3×10 each",  note:"Asymmetrical hinge, balance demand" },
    ],
  },
  mindbody: {
    id:"mindbody", label:"MIND-BODY / FLOW", color:C.purple, icon:"◯",
    exercises:[
      { name:"Cat-Cow (breath-led)",        sets:"3×60s",      note:"Full inhale arch, full exhale round, no rush" },
      { name:"Child's Pose to Cobra Flow",  sets:"3×8",        note:"Continuous movement, breath sets the pace" },
      { name:"Bird Dog (slow hold)",        sets:"3×8 each",   note:"5s hold each rep, full breath cycle" },
      { name:"DB Slow Romanian Deadlift",   sets:"3×8",        note:"6s down, pause at bottom, 6s up" },
      { name:"Prone Cobra Hold",            sets:"3×30s",      note:"Isometric back extension, chin down" },
      { name:"DB Goblet Squat (slow pulse)",sets:"3×10",       note:"Bottom pause, breathe, controlled return" },
      { name:"Band Pull-Apart (slow)",      sets:"3×15",       note:"Full breath with each rep, scapular retraction" },
      { name:"Hollow Body Hold",            sets:"3×30s",      note:"Full exhale, tension through breath" },
      { name:"Supine Leg Lowering (slow)",  sets:"3×10",       note:"Core control, lower only as far as form holds" },
      { name:"Seated Meditation Breathing", sets:"5 min",      note:"Box breath: 4s in, 4s hold, 4s out, 4s hold" },
    ],
  },
  cardio: {
    id:"cardio", label:"ACTIVE CARDIO", color:C.red, icon:"◉",
    exercises:[
      { name:"Brisk Walk",              sets:"20–30 min",  note:"Steady state, conversational pace, zone 2" },
      { name:"Stair Climb Intervals",   sets:"5 rounds",   note:"Up and down controlled, rest 60s between" },
      { name:"Jump Rope (continuous)",  sets:"5×2 min",    note:"60s rest between rounds" },
      { name:"March in Place (weighted)",sets:"3×3 min",   note:"DBs in hands, knees high, steady pace" },
      { name:"Step Touch Cardio",       sets:"3×3 min",    note:"Lateral, continuous, low impact" },
      { name:"Stair Jumps (intervals)", sets:"6×30s",      note:"30s on, 30s off, controlled landing" },
      { name:"Shadow Boxing",           sets:"5×2 min",    note:"Arms only, no shoulder stress, cardio output" },
      { name:"Low-Impact Freestyle",    sets:"10–15 min",  note:"Whatever moves you, keep heart rate up" },
      { name:"Extended HIIT Snack",     sets:"3×1 min",    note:"Run all 3 snack timers back to back" },
      { name:"Cycling (stationary)",    sets:"20–30 min",  note:"Zone 2, conversational pace, sustainable" },
    ],
  },
};

const YOGA_PLACEHOLDER = {
  id:"yoga", label:"YOGA", color:C.purple, icon:"☽",
};

const EX_INDEX = {};
[...LIFTING_A.exercises, ...LIFTING_B.exercises, ...REHAB,
 ...[EXTRAS_POOLS, BONUS_POOLS, FLEX_POOLS].flatMap(g => Object.values(g).flatMap(p => p.exercises || []))
].forEach(e => { if (!EX_INDEX[e.name]) EX_INDEX[e.name] = e; });

const DemoContext = createContext(() => {});

// ── Muscle map ────────────────────────────────────────────────────────────────
const MUSCLE_REGIONS = {
  chest:      { front:"M 44,38 Q 50,34 56,38 Q 60,48 56,54 Q 50,56 44,54 Q 40,48 44,38 Z", back:null },
  biceps:     { front:"M 34,42 Q 30,46 31,54 Q 34,56 37,54 Q 40,48 38,42 Z M 62,42 Q 66,46 69,54 Q 66,56 63,54 Q 60,48 62,42 Z", back:null },
  triceps:    { front:null, back:"M 34,42 Q 30,46 31,54 Q 34,56 37,54 Q 40,48 38,42 Z M 62,42 Q 66,46 69,54 Q 66,56 63,54 Q 60,48 62,42 Z" },
  shoulders:  { front:"M 36,36 Q 32,38 32,44 Q 36,46 40,42 Q 40,36 36,36 Z M 64,36 Q 68,38 68,44 Q 64,46 60,42 Q 60,36 64,36 Z", back:"M 36,36 Q 32,38 32,44 Q 36,46 40,42 Q 40,36 36,36 Z M 64,36 Q 68,38 68,44 Q 64,46 60,42 Q 60,36 64,36 Z" },
  back:       { front:null, back:"M 40,38 Q 50,34 60,38 Q 62,50 60,58 Q 50,60 40,58 Q 38,50 40,38 Z" },
  quads:      { front:"M 40,68 Q 37,76 38,88 Q 42,92 46,88 Q 48,78 47,68 Z M 60,68 Q 63,76 62,88 Q 58,92 54,88 Q 52,78 53,68 Z", back:null },
  hamstrings: { front:null, back:"M 40,68 Q 37,76 38,88 Q 42,92 46,88 Q 48,78 47,68 Z M 60,68 Q 63,76 62,88 Q 58,92 54,88 Q 52,78 53,68 Z" },
  glutes:     { front:null, back:"M 40,60 Q 50,58 60,60 Q 62,68 60,72 Q 50,74 40,72 Q 38,68 40,60 Z" },
  calves:     { front:"M 40,90 Q 38,98 39,108 Q 42,112 45,108 Q 46,98 45,90 Z M 60,90 Q 62,98 61,108 Q 58,112 55,108 Q 54,98 55,90 Z", back:"M 40,90 Q 38,98 39,108 Q 42,112 45,108 Q 46,98 45,90 Z M 60,90 Q 62,98 61,108 Q 58,112 55,108 Q 54,98 55,90 Z" },
  core:       { front:"M 44,56 Q 50,54 56,56 Q 58,64 56,70 Q 50,72 44,70 Q 42,64 44,56 Z", back:null },
};
const BODY_OUTLINE = "M50,8 Q58,8 62,14 Q66,20 65,28 Q68,30 68,36 Q66,40 62,42 Q64,48 62,56 Q60,60 58,68 Q62,78 62,90 Q62,100 60,108 Q58,116 55,118 Q52,120 50,118 Q48,120 45,118 Q42,116 40,108 Q38,100 38,90 Q38,78 42,68 Q40,60 38,56 Q36,48 38,42 Q34,40 32,36 Q32,30 35,28 Q34,20 38,14 Q42,8 50,8 Z";
const HEAD     = "M50,2 Q56,2 59,7 Q62,12 60,17 Q58,22 50,23 Q42,22 40,17 Q38,12 41,7 Q44,2 50,2 Z";

function MuscleMap({ activeMuscles, color, pulse }) {
  return (
    <div style={{ display:"flex", gap:"16px", justifyContent:"center", margin:"16px 0 8px" }}>
      {["front","back"].map(side => (
        <div key={side} style={{ textAlign:"center" }}>
          <svg width="60" height="130" viewBox="0 0 100 130">
            <path d={HEAD} fill="#1e1e1e" stroke="#2a2a2a" strokeWidth="1"/>
            <path d={BODY_OUTLINE} fill="#1e1e1e" stroke="#2a2a2a" strokeWidth="1"/>
            {activeMuscles.map(m => { const d = MUSCLE_REGIONS[m]?.[side]; return d ? <path key={m} d={d} fill={color} opacity="0.75" style={{ filter:`drop-shadow(0 0 ${pulse?8:4}px ${color}88)`, animation:pulse?"musclePulse 1.5s ease-in-out infinite":"none" }}/> : null; })}
          </svg>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"8px", color:"#444", letterSpacing:"0.1em", textTransform:"uppercase", marginTop:"2px" }}>{side}</div>
        </div>
      ))}
    </div>
  );
}

function ArcRing({ pct, color, size=80 }) {
  const r = (size-10)/2, cx = size/2, cy = size/2;
  const circumference = 2*Math.PI*r, arcLen = circumference*0.75;
  const startAngle = 135, startRad = (startAngle*Math.PI)/180;
  const x1 = cx+r*Math.cos(startRad), y1 = cy+r*Math.sin(startRad);
  const endAngle = startAngle+270, endRad = (endAngle*Math.PI)/180;
  const x2 = cx+r*Math.cos(endRad), y2 = cy+r*Math.sin(endRad);
  const trackPath = `M ${x1} ${y1} A ${r} ${r} 0 1 1 ${x2} ${y2}`;
  const progressEnd = startAngle+270*(pct/100), pe = (progressEnd*Math.PI)/180;
  const px = cx+r*Math.cos(pe), py = cy+r*Math.sin(pe);
  const largeArc = 270*(pct/100)>180?1:0;
  const progressPath = pct===0?"": `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${px} ${py}`;
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size}>
        <path d={trackPath} fill="none" stroke={C.dim} strokeWidth="5" strokeLinecap="round"/>
        {pct>0 && <path d={progressPath} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" style={{ filter:`drop-shadow(0 0 6px ${color}88)`, transition:"all 0.4s ease" }}/>}
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", marginTop:"-4px" }}>
        <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:size>60?"22px":"16px", color:pct===100?color:C.text, lineHeight:1, transition:"all 0.4s" }}>{pct}%</span>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"7px", color:C.muted, letterSpacing:"0.1em", marginTop:"1px" }}>TODAY</span>
      </div>
    </div>
  );
}

// Date-seeded RNG — same result every time the app opens on the same day
const getDaySeed = (salt="") => {
  const d = new Date();
  const base = d.getFullYear()*10000 + (d.getMonth()+1)*100 + d.getDate();
  const str = `${base}-${salt}`;
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = Math.imul(31, h) + str.charCodeAt(i) | 0; }
  return Math.abs(h);
};
const seededShuffle = (arr, seed) => {
  const a = [...arr];
  let s = seed;
  for (let i = a.length-1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i+1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const pick = (arr, n, salt="") => seededShuffle(arr, getDaySeed(salt)).slice(0, n);

// Balanced pick — one exercise per category, seeded by date. Guarantees full coverage.
const pickBalanced = (pool, salt="") => {
  return (pool.categories || []).map((cat, i) => {
    const options = pool.exercises.filter(e => e.cat === cat);
    return seededShuffle(options, getDaySeed(salt + cat))[0];
  }).filter(Boolean);
};
// Core-pattern moves that must never share a snack section together
const HIIT_CORE_MOVES = ["Bicycle Crunches","Glute Bridge Marches","Russian Twists"];

const dealHiit = (mode="high") => {
  let pool;
  if (mode==="low") pool = LOW_IMPACT_POOL;
  else if (mode==="mixed") pool = [...AEROBIC_POOL, ...LOW_IMPACT_POOL];
  else pool = AEROBIC_POOL;

  const core = pool.filter(e => HIIT_CORE_MOVES.includes(e));
  const power = pool.filter(e => !HIIT_CORE_MOVES.includes(e));
  const coreShuffled = seededShuffle(core, getDaySeed("hiitcore"+mode));
  const powerShuffled = seededShuffle(power, getDaySeed("hiitpower"+mode));

  // low mode: always feature all 3 core moves, one per section. mixed: 1-2 for variety. high: none exist.
  const coreCount = mode==="low" ? Math.min(3, coreShuffled.length)
    : Math.min(coreShuffled.length, 1 + (getDaySeed("hiitcorecount"+mode) % 2));
  const chosenCore = coreShuffled.slice(0, coreCount);
  const chosenPower = powerShuffled.slice(0, 9 - chosenCore.length);

  const groups = [[],[],[]];
  chosenCore.forEach((ex,i) => groups[i % 3].push(ex));
  let gi = 0;
  chosenPower.forEach(ex => {
    while (groups[gi].length >= 3) gi = (gi+1) % 3;
    groups[gi].push(ex);
    gi = (gi+1) % 3;
  });
  return groups.map((g,i) => seededShuffle(g, getDaySeed("hiitorder"+mode+i)));
};

const getDayPlan = () => {
  const d = new Date().getDay();
  if ([1,4].includes(d)) return { type:"lift", split:"B" };
  if ([2,5].includes(d)) return { type:"lift", split:"A" };
  if (d===3)             return { type:"flex", isWeekend:false };
  if ([0,6].includes(d)) return { type:"flex", isWeekend:true };
  return { type:"flex", isWeekend:false };
};

const mono = (x={}) => ({ fontFamily:"'DM Mono',monospace", ...x });
const cond = (x={}) => ({ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, textTransform:"uppercase", ...x });
const body = (x={}) => ({ fontFamily:"'Barlow',sans-serif", ...x });

const cardBase = (accent, allDone=false) => ({
  background:"linear-gradient(145deg,rgba(22,22,22,0.9) 0%,rgba(12,12,12,0.85) 100%)",
  border:`1px solid ${allDone?accent+"50":accent===C.border?"#ffffff08":accent+"18"}`,
  borderRadius:"16px", padding:"22px", marginBottom:"14px",
  boxShadow:allDone?`0 8px 32px #00000060,inset 0 1px 0 #ffffff0a,0 0 24px ${accent}15`:`0 8px 32px #00000050,inset 0 1px 0 #ffffff0a`,
  position:"relative", overflow:"hidden", transition:"border 0.5s,box-shadow 0.5s",
  animation:"cardIn 0.45s cubic-bezier(0.22,1.2,0.36,1) both",
});

// ── Countdown FX — audio ticks, haptics, screen wake-lock ────────────────────
let _audioCtx = null;
const getAudioCtx = () => {
  if (!_audioCtx) { try { _audioCtx = new (window.AudioContext||window.webkitAudioContext)(); } catch { return null; } }
  if (_audioCtx.state === "suspended") { try { _audioCtx.resume(); } catch {} }
  return _audioCtx;
};
const playTone = (freq, duration=0.09, type="sine", gain=0.16) => {
  const ctx = getAudioCtx(); if(!ctx) return;
  const osc = ctx.createOscillator(), g = ctx.createGain();
  osc.type = type; osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+duration);
  osc.connect(g); g.connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime+duration);
};
const playTick = () => playTone(880, 0.08, "square", 0.12);
const playChime = () => { playTone(660,0.14,"sine",0.16); setTimeout(()=>playTone(880,0.16,"sine",0.16),110); setTimeout(()=>playTone(1320,0.3,"sine",0.18),230); };
const vibrate = (pattern) => { try { navigator.vibrate && navigator.vibrate(pattern); } catch {} };

function useWakeLock(active) {
  const lockRef = useRef(null);
  useEffect(() => {
    let cancelled = false;
    const release = () => { try { lockRef.current?.release?.(); } catch {} lockRef.current = null; };
    const request = async () => {
      try { if ("wakeLock" in navigator) lockRef.current = await navigator.wakeLock.request("screen"); } catch {}
    };
    if (active) request(); else release();
    const onVisible = () => { if (active && document.visibilityState==="visible" && !cancelled) request(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { cancelled = true; document.removeEventListener("visibilitychange", onVisible); release(); };
  }, [active]);
}

const hexToRgb = h => { const n = parseInt(h.replace("#",""),16); return [(n>>16)&255,(n>>8)&255,n&255]; };
const mixColor = (hexA, hexB, t) => {
  const a=hexToRgb(hexA), b=hexToRgb(hexB), m=Math.max(0,Math.min(1,t));
  const mixed = a.map((v,i)=>Math.round(v+(b[i]-v)*m));
  return `rgb(${mixed[0]},${mixed[1]},${mixed[2]})`;
};

function CountdownRing({ progress, color, size=260, urgent }) {
  const r = (size-16)/2, cx=size/2, cy=size/2, circumference = 2*Math.PI*r;
  const dashOffset = circumference*(1-progress);
  const ringColor = mixColor(color, C.red, progress);
  return (
    <svg width={size} height={size} style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%) rotate(-90deg)" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.dim} strokeWidth="4"/>
      {progress>0 && <circle cx={cx} cy={cy} r={r} fill="none" stroke={ringColor} strokeWidth="4" strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={dashOffset}
        style={{ transition:"stroke-dashoffset 1s linear, stroke 1s linear", filter:`drop-shadow(0 0 ${urgent?14:8}px ${ringColor})` }}/>}
    </svg>
  );
}

function useCountdownFX(running, timeLeft, done) {
  const prevDone = useRef(false);
  useEffect(() => {
    if (running && timeLeft>0 && timeLeft<=3) { playTick(); vibrate(30); }
  }, [running, timeLeft]);
  useEffect(() => {
    if (done && !prevDone.current) { playChime(); vibrate([40,60,40,60,120]); }
    prevDone.current = done;
  }, [done]);
}

function useTimer(duration) {
  const [timeLeft,setTimeLeft] = useState(duration);
  const [running,setRunning]   = useState(false);
  const [done,setDone]         = useState(false);
  const ref = useRef(null);
  useEffect(()=>{
    if(running&&timeLeft>0){
      ref.current=setInterval(()=>{ setTimeLeft(t=>{ if(t<=1){clearInterval(ref.current);setRunning(false);setDone(true);return 0;} return t-1; }); },1000);
    }
    return ()=>clearInterval(ref.current);
  },[running]);
  const reset = ()=>{ clearInterval(ref.current);setRunning(false);setDone(false);setTimeLeft(duration); };
  const mins=Math.floor(timeLeft/60), secs=timeLeft%60;
  return { timeLeft,running,done,setRunning,reset,mins,secs, fmt:done?"DONE":`${mins}:${secs.toString().padStart(2,"0")}`, progress:(duration-timeLeft)/duration };
}

function DoneBadge({ color }) {
  return (
    <>
      <div style={{ position:"absolute", top:"-10px", right:"-10px", width:"100px", height:"100px", borderRadius:"50%", background:`radial-gradient(circle, ${color}18 0%, transparent 70%)`, animation:"burst 1s ease-out forwards", pointerEvents:"none" }}/>
      <div style={{ position:"absolute", top:"16px", right:"16px", background:`${color}14`, border:`1px solid ${color}44`, borderRadius:"20px", padding:"4px 12px", display:"flex", alignItems:"center", gap:"6px", animation:"fadeIn 0.4s ease" }}>
        <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:color, boxShadow:`0 0 6px ${color}` }}/>
        <span style={mono({ fontSize:"10px", color, letterSpacing:"0.12em" })}>COMPLETE</span>
      </div>
    </>
  );
}

function DemoFrames({ name, color, animate=true, bare=false }) {
  const media = useDemoMedia(name);
  const srcs = exPhotos(name);
  const [frame, setFrame] = useState(0);
  const uid = useSvgId();
  const svg = useMemo(() => (!srcs && hasFigure(name) ? figureSVG(name, { color, frame: animate ? "anim" : "b", uid }) : null), [name, color, animate, uid]);
  useEffect(() => {
    if (!srcs || !animate) return;
    const id = setInterval(() => setFrame(f => 1 - f), 1100);
    return () => clearInterval(id);
  }, [name, animate]);
  const box = bare
    ? { position:"absolute", inset:0, overflow:"hidden" }
    : { position:"relative", width:"100%", maxWidth:"100%", aspectRatio:"3 / 2", borderRadius:"12px", overflow:"hidden", border:`1px solid ${color}55`, flexShrink:0 };
  const chip = (text, extra={}) => <span style={{ ...mono({ fontSize:"8px", letterSpacing:"0.12em", fontWeight:700 }), position:"absolute", left:"10px", top:"8px", padding:"3px 8px", borderRadius:"10px", background:"rgba(0,0,0,0.6)", color, border:`1px solid ${color}44`, ...extra }}>{text}</span>;
  if (media) return <div style={{ ...box, background:"#000" }}><MediaView media={media} label={`${name} demo`}/>{!bare && chip("YOUR CLIP")}</div>;
  if (svg) {
    const cue = figureCue(name);
    return (
      <div style={{ ...box, background:`radial-gradient(ellipse at 50% 70%, ${color}26, #000 72%)` }}>
        <div style={{ position:"absolute", inset:0 }} dangerouslySetInnerHTML={{ __html: svg }}/>
        {cue && !bare && chip(cue)}
      </div>
    );
  }
  if (!srcs) return bare ? <div style={{ ...box, display:"grid", placeItems:"center", background:`radial-gradient(ellipse at 50% 60%, ${color}22, #000 75%)` }}><span style={cond({ fontSize:"26px", color:color+"99" })}>{name.slice(0,1)}</span></div> : null;
  return (
    <div style={{ ...box, background:"#000" }}>
      {srcs.map((s,i)=>(
        <img key={s} src={s} alt={`${name} ${i?"end":"start"} position`} loading="lazy"
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", opacity:(animate?frame===i:i===1)?1:0, transition:"opacity 0.45s ease" }}/>
      ))}
      {animate && !bare && <div style={{ position:"absolute", left:"10px", bottom:"8px", display:"flex", gap:"6px" }}>
        {["START","END"].map((l,i)=>(
          <span key={l} style={{ ...mono({ fontSize:"8px", letterSpacing:"0.12em", fontWeight:700 }), padding:"3px 8px", borderRadius:"10px", background:frame===i?color:"rgba(0,0,0,0.6)", color:frame===i?"#000":"#aaa", transition:"all 0.3s" }}>{l}</span>
        ))}
      </div>}
    </div>
  );
}

function DemoThumb({ name, color, size=40, fallback=false }) {
  const openDemo = useContext(DemoContext);
  const media = useDemoMedia(name);
  const srcs = exPhotos(name);
  const uid = useSvgId();
  const svg = useMemo(() => (!srcs && hasFigure(name) ? figureSVG(name, { color, frame: "b", crop: true, uid }) : null), [name, color, uid]);
  const frameStyle = { width:size, height:size, flexShrink:0, padding:0, borderRadius:size>44?"12px":"8px", overflow:"hidden", border:`1px solid ${color}66`, position:"relative",
    background:srcs||media?"#000":`radial-gradient(ellipse at 50% 60%, ${color}26, #000 75%)`, boxShadow:`0 0 14px -6px ${color}` };
  if (!srcs && !svg && !media) return fallback
    ? <div style={{ ...frameStyle, display:"grid", placeItems:"center" }} aria-hidden="true"><span style={cond({ fontSize:"22px", color:color+"99" })}>{name.slice(0,1)}</span></div>
    : null;
  return (
    <button onClick={e=>{e.stopPropagation();openDemo(name,color);}} onPointerDown={e=>e.stopPropagation()} aria-label={`Show ${name} demo`} style={{ ...frameStyle, cursor:"pointer" }}>
      {media ? <MediaView media={media} label=""/>
        : srcs ? <img src={srcs[1]} alt="" loading="lazy" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
        : <div style={{ width:"100%", height:"100%" }} dangerouslySetInnerHTML={{ __html: svg }}/>}
    </button>
  );
}

function DemoViewer({ name, color, onClose }) {
  const app = useContext(AppCtx);
  const ex = app.findEx(name) || { name };
  const [confirmDel, setConfirmDel] = useState(false);
  const [lbs, setLbs] = useState("");
  const [clipErr, setClipErr] = useState("");
  const clipRef = useRef(null);
  useEffect(() => {
    const onKey = e => { if (e.key==="Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const inToday = app.inToday(name), pr = app.prWeights[name], own = !!app.overrides[name];
  const pickClip = async e => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    if (f.size > 80*1024*1024) { setClipErr("That clip is too big to store. Trim it to a few seconds."); return; }
    try { setClipErr(""); await app.setOwnClip(name, f); } catch { setClipErr("Couldn't save that clip on this phone. Try a shorter one."); }
  };
  const savePR = e => { e.preventDefault(); const v = parseFloat(lbs); if (v > 0) { app.setPR(name, Math.round(v*10)/10); setLbs(""); } };
  const fact = t => <span key={t} style={{ ...mono({ fontSize:"10px", letterSpacing:"0.08em" }), padding:"6px 9px", borderRadius:"20px", border:`1px solid ${color}44`, color, background:color+"12" }}>{t}</span>;
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:10000, background:"rgba(0,0,0,0.88)", backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"calc(env(safe-area-inset-top) + 20px) 16px calc(env(safe-area-inset-bottom) + 20px)", animation:"fadeIn 0.2s ease" }}>
      <div onClick={e=>e.stopPropagation()} role="dialog" aria-modal="true" aria-label={ex.name} style={{ width:"100%", maxWidth:"440px", maxHeight:"100%", overflowY:"auto", background:UI.surface, backgroundImage:`linear-gradient(170deg, ${color}1f, transparent 40%)`, border:`1px solid ${color}55`, borderRadius:"20px", padding:"18px", boxShadow:`0 20px 60px #000, 0 0 40px ${color}2e`, display:"flex", flexDirection:"column", gap:"12px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"12px" }}>
          <div style={{ minWidth:0 }}>
            <p style={mono({ fontSize:"9px", letterSpacing:"0.2em", color, marginBottom:"4px", textTransform:"uppercase" })}>{ex.source || "How to"}</p>
            <h2 style={cond({ fontSize:"26px", color:UI.ink, lineHeight:1.05 })}>{ex.name}</h2>
          </div>
          <IconBtn onClick={onClose} label="Close"><XIcon/></IconBtn>
        </div>
        <DemoFrames name={name} color={color}/>
        <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>{[ex.sets, ...(ex.body||[]), ex.equip].filter(Boolean).map(fact)}{pr ? fact(`BEST ${pr} LB`) : null}</div>
        {ex.note && <p style={body({ fontSize:"14.5px", color:UI.ink2, lineHeight:1.6 })}>{ex.note}</p>}
        {inToday
          ? <div style={{ ...btnStyle("line"), cursor:"default", color }}>✓ IN TODAY'S WORKOUT</div>
          : <button onClick={()=>app.addToToday(name)} style={btnStyle("solid", color)}>+ ADD TO TODAY</button>}
        <button onClick={()=>speakEx(ex.name, ex.note)} style={btnStyle("line")}>🔊 HEAR CUES</button>
        <form onSubmit={savePR} style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:"8px" }}>
          <label htmlFor="pr-input" style={{ position:"absolute", width:1, height:1, overflow:"hidden", clip:"rect(0 0 0 0)" }}>Best weight in pounds</label>
          <input id="pr-input" inputMode="decimal" value={lbs} onChange={e=>setLbs(e.target.value.replace(/[^0-9.]/g,""))} placeholder={pr ? `Best: ${pr} lb · new best?` : "Log your best weight (lb)"} style={{ ...searchStyle, padding:"12px" }}/>
          <button type="submit" disabled={!(parseFloat(lbs)>0)} style={{ ...btnStyle("line"), width:"auto", padding:"12px 16px", opacity:parseFloat(lbs)>0?1:0.5 }}>SAVE</button>
        </form>
        <input ref={clipRef} type="file" accept="image/*,video/*" onChange={pickClip} hidden/>
        {own
          ? <button onClick={()=>app.clearOwnClip(name)} style={btnStyle("ghost", UI.ink2)}>REMOVE MY CLIP</button>
          : !ex.custom && <button onClick={()=>clipRef.current?.click()} style={btnStyle("ghost", color)}>USE MY OWN CLIP AS THE DEMO</button>}
        {ex.custom && !ex.media && <button onClick={()=>clipRef.current?.click()} style={btnStyle("ghost", color)}>ADD A PHOTO OR CLIP</button>}
        {clipErr && <p role="alert" style={body({ fontSize:"13px", color:C.red })}>{clipErr}</p>}
        {ex.custom && (confirmDel
          ? <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
              <button onClick={()=>setConfirmDel(false)} style={btnStyle("line")}>KEEP IT</button>
              <button onClick={()=>app.deleteCustom(name)} style={{ ...btnStyle("solid", C.red), color:"#fff" }}>DELETE</button>
            </div>
          : <button onClick={()=>setConfirmDel(true)} style={{ ...btnStyle("ghost", C.red) }}>DELETE THIS EXERCISE</button>)}
      </div>
    </div>
  );
}

function SwipeRow({ label, sublabel, checked, onToggle, onSwap, onAudio, color, isLast }) {
  const [dragX,setDragX] = useState(0);
  const [dragging,setDragging] = useState(false);
  const startX = useRef(null);
  const threshold = 75;
  const onPointerDown = e=>{ startX.current=e.clientX; setDragging(true); };
  const onPointerMove = e=>{
    if(!dragging||startX.current===null) return;
    const dx=e.clientX-startX.current;
    if(!checked) setDragX(Math.max(0,Math.min(dx,140)));
    else setDragX(Math.min(0,Math.max(dx,-140)));
  };
  const onPointerUp = ()=>{
    if(!dragging) return;
    setDragging(false);
    if(!checked&&dragX>=threshold){onToggle();setDragX(0);}
    else if(checked&&dragX<=-threshold){onToggle();setDragX(0);}
    else setDragX(0);
    startX.current=null;
  };
  const revealPct = Math.min(Math.abs(dragX)/threshold,1);
  return (
    <div style={{ position:"relative", overflow:"hidden", borderBottom:isLast?"none":`1px solid ${C.dim}` }}>
      <div style={{ position:"absolute", top:0, bottom:0, left:checked?"auto":0, right:checked?0:"auto", width:`${Math.abs(dragX)}px`, background:checked?`rgba(255,61,31,${0.1+revealPct*0.2})`:`rgba(100,100,100,0.08)`, display:"flex", alignItems:"center", justifyContent:checked?"flex-start":"flex-end", paddingInline:"14px", pointerEvents:"none", transition:dragging?"none":"width 0.2s ease" }}>
        <span style={mono({ fontSize:"10px", color:checked?C.red:color, letterSpacing:"0.12em", opacity:revealPct })}>{checked?"UNDO ←":"→ DONE"}</span>
      </div>
      <div onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}
        style={{ display:"flex", alignItems:"center", gap:"12px", padding:"11px 0", transform:`translateX(${dragX}px)`, transition:dragging?"none":"transform 0.2s ease,opacity 0.3s", opacity:checked?0.38:1, cursor:"grab", userSelect:"none", touchAction:"pan-y" }}>
        <div style={{ width:"22px", height:"22px", borderRadius:"5px", flexShrink:0, border:`1.5px solid ${checked?color:C.muted}`, background:checked?color:"transparent", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.25s", boxShadow:checked?`0 0 10px ${color}55`:"none" }}>
          {checked && <span style={{ color:"#000", fontSize:"12px", fontWeight:900 }}>✓</span>}
        </div>
        <DemoThumb name={label} color={color}/>
        <div style={{ flex:1, cursor:(onSwap&&!checked)?"pointer":undefined }} onClick={()=>{ if(onSwap&&!checked&&!dragging&&dragX===0) onSwap(); }}>
          <div style={body({ fontSize:"15px", fontWeight:500, color:checked?"#4a4a4a":"#d0d0d0", textDecoration:checked?"line-through":"none", transition:"color 0.3s" })}>{label}</div>
          {sublabel && <div style={mono({ fontSize:"11px", color:checked?"#3a3a3a":"#777", marginTop:"3px", letterSpacing:"0.05em", transition:"color 0.3s" })}>{sublabel}</div>}
        </div>
        {!checked&&!dragging&&dragX===0 && (
          <div style={{ display:"flex", gap:"4px", alignItems:"center", flexShrink:0 }}>
            {onAudio && <button onClick={e=>{e.stopPropagation();onAudio();}} onPointerDown={e=>e.stopPropagation()} style={{ ...mono({ fontSize:"13px" }), width:"28px", height:"28px", borderRadius:"50%", border:`1px solid ${color}22`, background:"transparent", color:color+"55", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1, padding:0 }}>🔊</button>}
            {onSwap
              ? <button onClick={e=>{e.stopPropagation();onSwap();}} onPointerDown={e=>e.stopPropagation()} style={{ ...mono({ fontSize:"13px" }), width:"28px", height:"28px", borderRadius:"50%", border:`1px solid ${color}33`, background:"transparent", color:color+"77", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1, padding:0 }}>&#x27F3;</button>
              : <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ opacity:0.18 }}><path d="M2 7h10M8 3l4 4-4 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            }
          </div>
        )}
      </div>
    </div>
  );
}

function bigBtn(color,active){ return { ...mono({ fontSize:"13px", letterSpacing:"0.15em", fontWeight:700 }), padding:"16px 48px", borderRadius:"12px", border:`2px solid ${color}`, background:active?"transparent":color, color:active?color:"#000", cursor:"pointer", transition:"all 0.2s", boxShadow:active?`0 0 24px ${color}44`:`0 4px 20px ${color}44` }; }
function smallBtn(color,active){ return { ...mono({ fontSize:"11px", letterSpacing:"0.1em", fontWeight:700 }), padding:"8px 16px", borderRadius:"7px", border:`1.5px solid ${color}`, background:active?"transparent":color, color:active?color:"#000", cursor:"pointer", transition:"all 0.2s", whiteSpace:"nowrap", boxShadow:active?`0 0 10px ${color}44`:"none" }; }

function ActiveMode({ config, exercises, onClose }) {
  const t = useTimer(config.duration);
  const urgent = t.running&&t.timeLeft<=10;
  useCountdownFX(t.running, t.timeLeft, t.done);
  useWakeLock(t.running);
  return (
    <div style={{ position:"fixed", inset:0, zIndex:999, background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 28px", maxWidth:"480px", margin:"0 auto" }}>
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", background:`radial-gradient(ellipse at 50% 35%,${config.color}${t.running?"1a":"0a"} 0%,transparent 60%)`, transition:"background 0.6s" }}/>
      <button onClick={onClose} style={{ position:"absolute", top:"calc(env(safe-area-inset-top) + 20px)", left:"20px", zIndex:2, ...mono({ fontSize:"11px", letterSpacing:"0.1em" }), background:"transparent", border:`1px solid ${C.muted}`, color:C.soft, borderRadius:"8px", padding:"7px 16px", cursor:"pointer" }}>← BACK</button>
      <div style={{ textAlign:"center", marginBottom:"16px", zIndex:1 }}>
        <p style={mono({ fontSize:"10px", color:config.color, letterSpacing:"0.25em", marginBottom:"8px" })}>{config.label}</p>
        <h1 style={cond({ fontSize:"38px", color:config.color, textShadow:`0 0 40px ${config.color}66` })}>{config.name}</h1>
      </div>
      <div style={{ zIndex:1, textAlign:"center", marginBottom:"40px" }}>
        {exercises.map((ex,i)=>(
          <div key={i} style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <span style={mono({ fontSize:"10px", color:C.muted })}>{i+1}</span>
            <DemoThumb name={ex} color={config.color} size={32}/>
            <span style={{ ...body({ fontSize:"18px", fontWeight:500, transition:"color 0.3s" }), color:t.running?"#aaa":C.soft, flex:1, lineHeight:2.1 }}>{ex}</span>
            <button onClick={()=>speakEx(ex)} style={{ ...mono({ fontSize:"13px" }), width:"28px", height:"28px", borderRadius:"50%", border:`1px solid ${config.color}22`, background:"transparent", color:config.color+"55", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, padding:0, lineHeight:1 }}>🔊</button>
          </div>
        ))}
      </div>
      <div style={{ zIndex:1, textAlign:"center", marginBottom:"16px", position:"relative", width:"280px", height:"280px", display:"flex", alignItems:"center", justifyContent:"center" }}>
        {!t.done && <CountdownRing progress={t.progress} color={config.color} size={280} urgent={urgent}/>}
        {t.done ? (
          <div><div style={cond({ fontSize:"80px", color:config.color, textShadow:`0 0 60px ${config.color}88`, lineHeight:1 })}>DONE</div><p style={body({ fontSize:"15px", color:"#777", marginTop:"12px" })}>Great work. Rest up.</p></div>
        ) : (
          <div style={{ display:"flex", alignItems:"baseline", justifyContent:"center", gap:"2px", zIndex:1 }}>
            <span style={cond({ fontSize:urgent?"96px":"84px", color:t.running?config.color:"#ccc", textShadow:t.running?`0 0 60px ${config.color}${urgent?"bb":"44"}`:"none", lineHeight:1, transition:"font-size 0.12s,color 0.3s", animation:urgent?"urgentPulse 0.35s ease-in-out infinite alternate":"none" })}>{t.mins}</span>
            <span style={cond({ fontSize:"52px", color:C.muted, lineHeight:1, marginBottom:"6px" })}>:</span>
            {t.secs.toString().padStart(2,"0").split("").map((d,i)=>(
              <span key={`${i}-${d}`} style={cond({ fontSize:urgent?"96px":"84px", color:t.running?config.color:"#ccc", textShadow:t.running?`0 0 60px ${config.color}${urgent?"bb":"44"}`:"none", lineHeight:1, transition:"font-size 0.12s", animation:urgent?`urgentPulse 0.35s ${i*0.07}s ease-in-out infinite alternate`:"none" })}>{d}</span>
            ))}
          </div>
        )}
      </div>
      <div style={{ zIndex:1, width:"100%", height:"4px", background:C.dim, borderRadius:"4px", marginBottom:"40px", overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${t.progress*100}%`, background:`linear-gradient(90deg,${config.color}88,${config.color})`, borderRadius:"4px", transition:"width 1s linear", boxShadow:`0 0 12px ${config.color}` }}/>
      </div>
      <div style={{ zIndex:1 }}>
        {t.done?<button onClick={t.reset} style={bigBtn(C.muted,false)}>RESET</button>:<button onClick={()=>t.setRunning(r=>!r)} style={bigBtn(config.color,t.running)}>{t.running?"PAUSE":"START"}</button>}
      </div>
      <p style={body({ fontSize:"13px", color:"#555", fontStyle:"italic", marginTop:"28px", textAlign:"center", zIndex:1 })}>{config.note}</p>
    </div>
  );
}

function LiftWorkoutMode({ data, checked, setChecked, onClose, onComplete }) {
  const [idx,setIdx] = useState(()=>{ const f=data.exercises.findIndex((_,i)=>!checked[i]); return f===-1?0:f; });
  const [restActive,setRestActive] = useState(false);
  const [supersetMode,setSupersetMode] = useState(false);
  const restTimer = useTimer(60);
  const ex = data.exercises[idx];
  const guidedMedia = useDemoMedia(ex.name);
  const supersetPartnerIdx = idx+1 < data.exercises.length ? idx+1 : null;
  const nextEx = supersetPartnerIdx !== null ? data.exercises[supersetPartnerIdx] : null;
  const doneCount = data.exercises.filter((_,i)=>checked[i]).length;
  const allDone = doneCount===data.exercises.length;
  const markAndNext = ()=>{
    if(supersetMode && supersetPartnerIdx !== null){
      setChecked(c=>({...c,[idx]:true,[supersetPartnerIdx]:true}));
      const next=data.exercises.findIndex((_,i)=>i>supersetPartnerIdx&&!checked[i]);
      if(next!==-1){restTimer.reset();setRestActive(true);setTimeout(()=>{setIdx(next);setRestActive(false);},100);}
    } else {
      setChecked(c=>({...c,[idx]:true}));
      const next=data.exercises.findIndex((_,i)=>i>idx&&!checked[i]);
      if(next!==-1){restTimer.reset();setRestActive(true);setTimeout(()=>{setIdx(next);setRestActive(false);},100);}
    }
  };
  return (
    <div style={{ position:"fixed", inset:0, zIndex:998, background:C.bg, display:"flex", flexDirection:"column", maxWidth:"480px", margin:"0 auto" }}>
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", background:`radial-gradient(ellipse at 50% 25%,${data.color}12 0%,transparent 55%)` }}/>
      <div style={{ padding:"calc(env(safe-area-inset-top) + 20px) 20px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", zIndex:1 }}>
        <button onClick={onClose} style={{ ...mono({ fontSize:"11px", letterSpacing:"0.1em" }), background:"transparent", border:`1px solid ${C.muted}`, color:C.soft, borderRadius:"8px", padding:"7px 16px", cursor:"pointer" }}>← BACK</button>
        <div style={{ display:"flex", gap:"6px" }}>
          {data.exercises.map((_,i)=><div key={i} style={{ width:"6px", height:"6px", borderRadius:"50%", background:checked[i]?data.color:(i===idx||(supersetMode&&i===supersetPartnerIdx))?data.color+"66":C.muted, transition:"all 0.3s", boxShadow:(i===idx||(supersetMode&&i===supersetPartnerIdx))?`0 0 6px ${data.color}`:"none" }}/>)}
        </div>
        <button onClick={()=>setSupersetMode(m=>!m)} style={{ ...mono({ fontSize:"9px", letterSpacing:"0.08em" }), background:supersetMode?data.color+"22":"transparent", border:`1px solid ${supersetMode?data.color:C.muted}`, color:supersetMode?data.color:C.soft, borderRadius:"6px", padding:"5px 10px", cursor:"pointer" }}>{supersetMode?"SUPER ON":"SUPERSET"}</button>
      </div>
      {allDone?(
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", zIndex:1, padding:"28px" }}>
          <div style={cond({ fontSize:"72px", color:data.color, textShadow:`0 0 60px ${data.color}88`, lineHeight:1, marginBottom:"16px" })}>DONE</div>
          <p style={body({ fontSize:"16px", color:"#777", textAlign:"center" })}>Session complete.</p>
          <button onClick={()=>{ onComplete&&onComplete(); onClose(); }} style={{ ...bigBtn(data.color,false), marginTop:"40px" }}>FINISH</button>
        </div>
      ):restActive?(
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", zIndex:1 }}>
          <p style={mono({ fontSize:"11px", color:C.soft, letterSpacing:"0.2em", marginBottom:"16px" })}>REST</p>
          <div style={cond({ fontSize:"96px", color:restTimer.timeLeft<=10?C.red:C.muted, lineHeight:1, transition:"color 0.3s" })}>{restTimer.fmt}</div>
          <div style={{ display:"flex", gap:"12px", marginTop:"32px" }}>
            <button onClick={()=>setRestActive(false)} style={smallBtn(C.muted,false)}>SKIP</button>
            <button onClick={()=>restTimer.setRunning(r=>!r)} style={smallBtn(data.color,restTimer.running)}>{restTimer.running?"PAUSE":"START"}</button>
          </div>
        </div>
      ):(
        <div style={{ flex:1, minHeight:0, display:"flex", flexDirection:"column", padding:"0 28px calc(env(safe-area-inset-bottom) + 20px)", zIndex:1 }}>
          {supersetMode && nextEx ? (
            <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", gap:"12px" }}>
              {[{e:ex,label:"A — PRIMARY"},{e:nextEx,label:"B — SUPERSET"}].map(({e,label})=>(
                <div key={label} style={{ background:`${data.color}0a`, border:`1px solid ${data.color}22`, borderRadius:"12px", padding:"16px" }}>
                  <p style={mono({ fontSize:"9px", color:data.color, letterSpacing:"0.2em", marginBottom:"6px" })}>{label}</p>
                  <h2 style={cond({ fontSize:"26px", color:data.color, lineHeight:1.1, marginBottom:"6px" })}>{e.name}</h2>
                  <span style={{ ...mono({ fontSize:"11px", color:C.text }), background:`${data.color}14`, border:`1px solid ${data.color}22`, borderRadius:"6px", padding:"4px 10px", display:"inline-block", marginBottom:"6px" }}>{e.sets}</span>
                  <p style={body({ fontSize:"13px", color:"#777", fontStyle:"italic", marginTop:"4px" })}>{e.note}</p>
                  <button onClick={()=>speakEx(e.name,e.note)} style={{ ...mono({ fontSize:"10px" }), marginTop:"8px", padding:"5px 12px", borderRadius:"6px", border:`1px solid ${data.color}22`, background:"transparent", color:data.color+"66", cursor:"pointer" }}>🔊</button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ flex:1, minHeight:0, overflowY:"auto", display:"flex", flexDirection:"column" }}>
             <div style={{ margin:"auto 0" }}>
              <p style={mono({ fontSize:"10px", color:data.color, letterSpacing:"0.25em", marginBottom:"12px" })}>EXERCISE {idx+1} OF {data.exercises.length}</p>
              <h1 style={cond({ fontSize:"42px", color:data.color, lineHeight:1.1, textShadow:`0 0 40px ${data.color}55`, marginBottom:"16px" })}>{ex.name}</h1>
              <span style={{ ...mono({ fontSize:"13px", color:C.text }), background:`${data.color}18`, border:`1px solid ${data.color}33`, borderRadius:"8px", padding:"6px 14px", display:"inline-block", marginBottom:"16px" }}>{ex.sets}</span>
              <p style={body({ fontSize:"15px", color:"#888", lineHeight:1.7, fontStyle:"italic" })}>{ex.note}</p>
              <button onClick={()=>speakEx(ex.name,ex.note)} style={{ ...mono({ fontSize:"11px" }), marginTop:"10px", padding:"6px 16px", borderRadius:"8px", border:`1px solid ${data.color}28`, background:"transparent", color:data.color+"66", cursor:"pointer", display:"inline-flex", alignItems:"center", gap:"6px" }}>🔊 <span>HEAR CUES</span></button>
              {(guidedMedia || hasDemo(ex.name))
                ? <div style={{ margin:"16px 0 12px" }}><DemoFrames name={ex.name} color={data.color}/></div>
                : <MuscleMap activeMuscles={ex.muscles||[]} color={data.color} pulse/>}
             </div>
            </div>
          )}
          <div style={{ display:"flex", gap:"10px", paddingTop:"12px", flexShrink:0 }}>
            {idx>0&&<button onClick={()=>setIdx(i=>i-1)} style={{ ...smallBtn(C.muted,false), flex:1 }}>← PREV</button>}
            <button onClick={markAndNext} style={{ ...bigBtn(data.color,false), flex:2, padding:"16px 0" }}>{supersetMode&&nextEx?"DONE BOTH ✓":checked[idx]?"NEXT →":"DONE ✓"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SnackCard({ config, exercises, timerState, setTimerState, options=[], onSwap }) {
  const [activeMode,setActiveMode] = useState(false);
  const [optOpen,setOptOpen] = useState(null);
  const { timeLeft, running, done } = timerState;
  const urgent = running&&timeLeft<=10;
  const ref = useRef(null);
  useEffect(()=>{
    if(running&&timeLeft>0){
      ref.current=setInterval(()=>{ setTimerState(s=>{ if(s.timeLeft<=1){clearInterval(ref.current);return{...s,timeLeft:0,running:false,done:true};} return{...s,timeLeft:s.timeLeft-1}; }); },1000);
    }
    return ()=>clearInterval(ref.current);
  },[running]);
  const toggle = ()=>setTimerState(s=>({...s,running:!s.running}));
  const reset = ()=>{ clearInterval(ref.current); setTimerState({timeLeft:config.duration,running:false,done:false}); };
  const mins=Math.floor(timeLeft/60), secs=timeLeft%60;
  const progress=(config.duration-timeLeft)/config.duration;
  useCountdownFX(running, timeLeft, done);
  useWakeLock(running);
  if(activeMode) return <ActiveMode config={config} exercises={exercises} onClose={()=>setActiveMode(false)}/>;
  return (
    <div style={{ ...cardBase(config.color,done), border:`1.5px solid ${running?config.color:done?config.color+"55":config.color+"22"}` }}>
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"3px", background:C.dim }}>
        <div style={{ height:"100%", width:`${progress*100}%`, background:config.color, transition:"width 1s linear", boxShadow:`0 0 8px ${config.color}` }}/>
      </div>
      {done&&<DoneBadge color={config.color}/>}
      <div style={{ marginBottom:"14px" }}>
        <p style={mono({ fontSize:"10px", letterSpacing:"0.2em", color:config.color, textTransform:"uppercase", marginBottom:"4px" })}>{config.label}</p>
        <h2 style={cond({ fontSize:"24px", color:done?config.color+"88":config.color, textShadow:`0 0 20px ${config.color}${done?"20":"55"}`, transition:"all 0.4s" })}>{config.name}</h2>
      </div>
      <div style={{ marginBottom:"14px", opacity:done?0.35:1, transition:"opacity 0.4s" }}>
        {exercises.map((ex,i)=>(
          <div key={i}>
            <div style={{ display:"flex", gap:"10px", alignItems:"center", padding:"6px 0", borderBottom:(i<2&&optOpen!==i)?`1px solid ${C.dim}`:"none" }}>
              <span style={mono({ fontSize:"10px", color:C.muted, minWidth:"14px" })}>{i+1}</span>
              <DemoThumb name={ex} color={config.color} size={32}/>
              <span onClick={()=>onSwap&&!done&&setOptOpen(o=>o===i?null:i)} style={{ ...body({ fontSize:"15px", color:"#c8c8c8", fontWeight:500 }), flex:1, cursor:onSwap&&!done?"pointer":undefined }}>{ex}</span>
              {onSwap&&!done&&<button onClick={()=>setOptOpen(o=>o===i?null:i)} aria-label={`Swap ${ex}`} style={{ ...mono({ fontSize:"13px" }), width:"26px", height:"26px", borderRadius:"50%", border:`1px solid ${config.color}33`, background:optOpen===i?config.color+"22":"transparent", color:config.color+"88", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, padding:0, lineHeight:1 }}>&#x27F3;</button>}
              <button onClick={()=>speakEx(ex)} style={{ ...mono({ fontSize:"13px" }), width:"26px", height:"26px", borderRadius:"50%", border:`1px solid ${config.color}22`, background:"transparent", color:config.color+"55", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, padding:0, lineHeight:1 }}>🔊</button>
            </div>
            {optOpen===i&&(
              <OptionScroller color={config.color} current={ex}
                options={[ex, ...options].map(n=>({ name:n, sets:AEROBIC_POOL.includes(n)?"HIGH-IMPACT":"LOW-IMPACT" }))}
                onPick={name=>{ onSwap(i,name); setOptOpen(null); }}/>
            )}
          </div>
        ))}
      </div>
      <p style={body({ fontSize:"13px", color:done?"#484848":"#999", fontStyle:"italic", marginBottom:"18px", lineHeight:1.6, transition:"color 0.4s" })}>{config.note}</p>
      <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
        <div style={{ minWidth:"96px" }}>
          {done?<span style={cond({ fontSize:"28px", color:C.muted })}>DONE</span>:(
            <div style={{ display:"flex", alignItems:"baseline", gap:"1px" }}>
              <span style={cond({ fontSize:urgent?"56px":"46px", color:running?config.color:"#ccc", lineHeight:1, textShadow:running?`0 0 30px ${config.color}88`:"none", transition:"font-size 0.12s,color 0.3s", animation:urgent?"urgentPulse 0.35s ease-in-out infinite alternate":"none" })}>{mins}</span>
              <span style={cond({ fontSize:"30px", color:C.muted, marginBottom:"2px" })}>:</span>
              {secs.toString().padStart(2,"0").split("").map((d,i)=>(
                <span key={`${i}-${d}`} style={cond({ fontSize:urgent?"56px":"46px", color:running?config.color:"#ccc", lineHeight:1, textShadow:running?`0 0 30px ${config.color}88`:"none", transition:"font-size 0.12s", animation:urgent?`urgentPulse 0.35s ${i*0.07}s ease-in-out infinite alternate`:"none" })}>{d}</span>
              ))}
            </div>
          )}
        </div>
        <div style={{ flex:1, height:"2px", background:C.dim, borderRadius:"2px", overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${progress*100}%`, background:`linear-gradient(90deg,${config.color}77,${config.color})`, borderRadius:"2px", transition:"width 1s linear", boxShadow:`2px 0 8px ${config.color}` }}/>
        </div>
        <div style={{ display:"flex", gap:"6px" }}>
          {!done&&<button onClick={()=>setActiveMode(true)} style={{ ...mono({ fontSize:"14px" }), padding:"7px 10px", borderRadius:"7px", border:`1px solid ${config.color}33`, background:"transparent", color:config.color+"77", cursor:"pointer", lineHeight:1 }}>⛶</button>}
          {done?<button onClick={reset} style={smallBtn(C.muted,false)}>RESET</button>:<button onClick={toggle} style={smallBtn(config.color,running)}>{running?"PAUSE":"START"}</button>}
        </div>
      </div>
    </div>
  );
}

// ── OptionScroller — horizontal swipe-through of every exercise in a category ─
function OptionScroller({ options, current, color, onPick }) {
  return (
    <div style={{ margin:"2px 0 10px", padding:"10px 0 12px", borderBottom:`1px solid ${C.dim}` }}>
      <p style={mono({ fontSize:"8px", color:"#555", letterSpacing:"0.15em", marginBottom:"8px" })}>{options.length} OPTIONS · SWIPE → TAP TO SELECT</p>
      <div style={{ display:"flex", gap:"8px", overflowX:"auto", paddingBottom:"4px", WebkitOverflowScrolling:"touch", scrollSnapType:"x proximity" }}>
        {options.map(opt=>{
          const isCurrent = opt.name===current;
          return (
            <button key={opt.name} onClick={()=>!isCurrent&&onPick(opt.name)}
              style={{ flexShrink:0, scrollSnapAlign:"start", width:"160px", textAlign:"left", cursor:isCurrent?"default":"pointer",
                background:isCurrent?`${color}16`:"rgba(255,255,255,0.025)", border:`1.5px solid ${isCurrent?color:C.muted+"66"}`,
                borderRadius:"10px", padding:"10px 12px", transition:"all 0.2s",
                boxShadow:isCurrent?`0 0 12px ${color}33`:"none" }}>
              <p style={body({ fontSize:"12px", fontWeight:600, color:isCurrent?color:"#bbb", marginBottom:"4px", lineHeight:1.3 })}>{opt.name}</p>
              <p style={mono({ fontSize:"9px", color:isCurrent?color+"99":"#555" })}>{opt.sets}{isCurrent?" · ACTIVE":""}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SupplementsSection({ checked, setChecked }) {
  const done = SUPPLEMENTS.filter((_,i)=>checked[i]).length;
  const allDone = done===SUPPLEMENTS.length;
  return (
    <div style={cardBase(C.blue,allDone)}>
      {allDone&&<DoneBadge color={C.blue}/>}
      <p style={mono({ fontSize:"10px", letterSpacing:"0.2em", color:C.blue, textTransform:"uppercase", marginBottom:"4px" })}>DAILY STACK</p>
      <h2 style={cond({ fontSize:"22px", color:allDone?C.blue+"77":C.blue, marginBottom:"4px", textShadow:`0 0 20px ${C.blue}${allDone?"18":"44"}`, transition:"all 0.4s" })}>SUPPLEMENTS</h2>
      <p style={mono({ fontSize:"11px", color:"#777", marginBottom:"16px" })}>{done}/{SUPPLEMENTS.length} taken today</p>
      {SUPPLEMENTS.map((s,i)=><SwipeRow key={i} label={s.name} sublabel={`${s.dose} · ${s.timing}`} checked={!!checked[i]} onToggle={()=>setChecked(c=>({...c,[i]:!c[i]}))} color={s.color||C.blue} isLast={i===SUPPLEMENTS.length-1}/>)}
    </div>
  );
}

function DailyLog({ checked, setChecked }) {
  const done = DAILY_ITEMS.filter((_,i)=>checked[i]).length;
  const pct = Math.round((done/DAILY_ITEMS.length)*100);
  const allDone = done===DAILY_ITEMS.length;
  return (
    <div style={cardBase(C.border,allDone)}>
      {allDone&&<DoneBadge color={C.yellow}/>}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
        <div>
          <p style={mono({ fontSize:"10px", letterSpacing:"0.2em", color:C.soft, textTransform:"uppercase", marginBottom:"4px" })}>TODAY</p>
          <h2 style={cond({ fontSize:"22px", color:allDone?"#777":C.text, transition:"color 0.4s" })}>DAILY LOG</h2>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
          <WeeklyMomentum/>
          <ArcRing pct={pct} color={allDone?C.yellow:C.blue} size={72}/>
        </div>
      </div>
      {DAILY_ITEMS.map((item,i)=><SwipeRow key={i} label={item.label} sublabel={item.sublabel} checked={!!checked[i]} onToggle={()=>setChecked(c=>({...c,[i]:!c[i]}))} color={item.color} isLast={i===DAILY_ITEMS.length-1}/>)}
    </div>
  );
}

// ── WeeklyMomentum — 12-week bar replaces streak flame ───────────────────────
function WeeklyMomentum() {
  const WEEKS = 12;
  const segments = useMemo(() => {
    const segs = [];
    const now = new Date();
    for (let w = WEEKS - 1; w >= 0; w--) {
      const monday = new Date(now);
      const dow = monday.getDay();
      const daysToMon = dow === 0 ? -6 : 1 - dow;
      monday.setDate(monday.getDate() + daysToMon - w * 7);
      let totalChecked = 0, totalItems = 0, anyDay = 0;
      for (let d = 0; d < 7; d++) {
        const day = new Date(monday);
        day.setDate(monday.getDate() + d);
        if (day > now) continue;
        const key = `cw-${day.getFullYear()}-${day.getMonth()+1}-${day.getDate()}-daily`;
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const n = Object.values(JSON.parse(raw)).filter(Boolean).length;
            totalChecked += n; totalItems += 7; anyDay++;
          }
        } catch {}
      }
      const pct = totalItems > 0 ? totalChecked / totalItems : -1;
      segs.push({ w, pct, isShield: pct >= 1.0, isDone: pct >= 0.8, isCurrent: w === 0, anyDay });
    }
    return segs;
  }, []);
  const weekStreak = segments.filter(s => s.isDone).length;
  const shields = segments.filter(s => s.isShield).length;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"4px" }}>
      <div style={{ display:"flex", gap:"3px", alignItems:"flex-end" }}>
        {segments.map((s, i) => {
          const fill = s.isCurrent ? Math.max(0, Math.min(s.pct >= 0 ? s.pct : 0, 1)) : (s.isDone ? 1 : (s.anyDay > 0 ? 0.18 : 0));
          return (
            <div key={i} style={{ position:"relative", width:"8px", height:s.isCurrent?"24px":"16px", borderRadius:"2px", background:C.muted, overflow:"hidden" }}>
              <div style={{ position:"absolute", bottom:0, left:0, right:0, height:`${fill*100}%`, background:s.isShield?C.teal:(s.isDone?C.yellow:C.orange), transition:"height 0.4s ease", boxShadow:s.isShield?`0 0 6px ${C.teal}88`:(s.isDone?`0 0 4px ${C.yellow}44`:"none") }}/>
              {s.isShield && <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"5px" }}>🔒</div>}
            </div>
          );
        })}
      </div>
      <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
        <span style={mono({ fontSize:"9px", color:weekStreak>0?C.yellow:C.muted, letterSpacing:"0.1em", fontWeight:700 })}>{weekStreak}W</span>
        {shields > 0 && <span style={mono({ fontSize:"8px", color:C.teal })}>{shields}🔒</span>}
      </div>
    </div>
  );
}

// ── ScienceCue — evidence-based tip shown in workout sections ─────────────────
function ScienceCue({ category, color }) {
  const cue = SCIENCE_CUES[category];
  if (!cue) return null;
  return (
    <div style={{ background:`${color}08`, border:`1px solid ${color}18`, borderRadius:"8px", padding:"10px 14px", marginBottom:"12px", display:"flex", gap:"10px", alignItems:"flex-start" }}>
      <span style={{ fontSize:"12px", marginTop:"2px", flexShrink:0 }}>🧬</span>
      <p style={body({ fontSize:"13px", color:"#888", lineHeight:1.6, fontStyle:"italic" })}>{cue}</p>
    </div>
  );
}

// ── SessionCinematic — completion flash (#7) ──────────────────────────────────
function SessionCinematic({ data, onDone }) {
  const [visible, setVisible] = useState(false);
  const templates = [
    "Every set. Every rep. Done.",
    `${data.label} — Complete.`,
    "Built different.",
    "The work is in the log.",
  ];
  const headline = templates[getDaySeed("cinematic") % templates.length];
  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 150);
    const t2 = setTimeout(() => setVisible(false), 1900);
    const t3 = setTimeout(() => onDone(), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);
  return (
    <div style={{ position:"fixed", inset:0, zIndex:9999, background:"#000", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", maxWidth:"480px", margin:"0 auto" }}>
      <div style={{ opacity:visible?1:0, transform:visible?"scale(1)":"scale(0.92)", transition:"opacity 0.35s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)", textAlign:"center", padding:"32px" }}>
        <div style={cond({ fontSize:"64px", color:data.color, textShadow:`0 0 80px ${data.color}88`, lineHeight:1.1, marginBottom:"24px" })}>{headline}</div>
        <div style={mono({ fontSize:"11px", color:"#555", letterSpacing:"0.2em" })}>SESSION COMPLETE</div>
      </div>
    </div>
  );
}

// ── RPECapture — 3-tap effort rating post-session (#6) ────────────────────────
function RPECapture({ onSubmit }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:9998, background:"rgba(0,0,0,0.9)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", maxWidth:"480px", margin:"0 auto" }}>
      <p style={mono({ fontSize:"10px", letterSpacing:"0.2em", color:C.soft, marginBottom:"28px" })}>HOW WAS THAT SESSION?</p>
      <div style={{ display:"flex", gap:"16px" }}>
        {[{label:"EASY",val:2,c:C.teal},{label:"HARD",val:3,c:C.orange},{label:"MAX",val:5,c:C.red}].map(({label,val,c})=>(
          <button key={val} onClick={()=>onSubmit(val)} style={{ ...cond({ fontSize:"15px" }), background:`${c}18`, border:`2px solid ${c}44`, color:c, borderRadius:"12px", padding:"22px 20px", cursor:"pointer", transition:"all 0.15s" }}>{label}</button>
        ))}
      </div>
      <button onClick={()=>onSubmit(0)} style={{ ...mono({ fontSize:"10px", letterSpacing:"0.1em" }), marginTop:"28px", background:"transparent", border:"none", color:C.muted, cursor:"pointer" }}>SKIP</button>
    </div>
  );
}

// ── CoachPulse — Monday morning brief (#8) ────────────────────────────────────
function useCoachPulse() {
  return useMemo(() => {
    const today = new Date();
    if (today.getDay() !== 1) return null;
    const dismissKey = `cw-coach-${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`;
    try { if (localStorage.getItem(dismissKey)) return null; } catch {}
    let sessionsCompleted = 0;
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = `cw-${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}-daily`;
      try {
        const raw = localStorage.getItem(key);
        if (raw) { if (Object.values(JSON.parse(raw)).filter(Boolean).length >= 5) sessionsCompleted++; }
      } catch {}
    }
    const positive = sessionsCompleted >= 5 ? `Strong week — you hit your daily targets ${sessionsCompleted} out of 7 days.`
      : sessionsCompleted >= 3 ? `Solid foundation — ${sessionsCompleted} complete days last week.`
      : "New week, clean slate. Last week is logged. This week is open.";
    return { positive, focus:"This week: protect the morning window. The first habit sets the tone for every one after it.", action:"Action: before you open anything else this morning, mark one item done. Momentum starts with the first check.", dismissKey };
  }, []);
}

function CoachPulseBrief({ pulse, onDismiss }) {
  if (!pulse) return null;
  return (
    <div style={{ ...cardBase(C.yellow, false), borderLeft:`3px solid ${C.yellow}`, marginBottom:"14px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"12px" }}>
        <div>
          <p style={mono({ fontSize:"9px", letterSpacing:"0.2em", color:C.yellow, marginBottom:"4px" })}>MONDAY · COACH PULSE</p>
          <h3 style={cond({ fontSize:"18px", color:C.yellow })}>THIS WEEK'S BRIEF</h3>
        </div>
        <button onClick={onDismiss} style={{ background:"transparent", border:"none", color:C.muted, cursor:"pointer", fontSize:"20px", lineHeight:1, padding:"0 4px" }}>×</button>
      </div>
      {[pulse.positive, pulse.focus, pulse.action].map((line, i) => (
        <div key={i} style={{ display:"flex", gap:"10px", marginBottom:i<2?"10px":0 }}>
          <span style={mono({ fontSize:"10px", color:C.yellow, marginTop:"3px", flexShrink:0 })}>{["01","02","03"][i]}</span>
          <p style={body({ fontSize:"14px", color:"#bbb", lineHeight:1.6 })}>{line}</p>
        </div>
      ))}
    </div>
  );
}

// ── PRProofBoard (#3) ─────────────────────────────────────────────────────────
function PRProofBoard({ prWeights }) {
  const entries = Object.entries(prWeights||{}).filter(([,v])=>v>0);
  if (entries.length === 0) return (
    <div style={{ ...cardBase(C.yellow, false), marginBottom:"14px" }}>
      <p style={mono({ fontSize:"10px", letterSpacing:"0.2em", color:C.yellow, textTransform:"uppercase", marginBottom:"4px" })}>PROOF BOARD</p>
      <h2 style={cond({ fontSize:"22px", color:"#444", marginBottom:"8px" })}>PERSONAL RECORDS</h2>
      <p style={body({ fontSize:"13px", color:"#555", fontStyle:"italic" })}>No best weights yet. Open any exercise and log your best weight; it shows up here.</p>
    </div>
  );
  return (
    <div style={{ ...cardBase(C.yellow, false), marginBottom:"14px" }}>
      <p style={mono({ fontSize:"10px", letterSpacing:"0.2em", color:C.yellow, textTransform:"uppercase", marginBottom:"4px" })}>PROOF BOARD</p>
      <h2 style={cond({ fontSize:"22px", color:C.yellow, marginBottom:"16px", textShadow:`0 0 20px ${C.yellow}44` })}>PERSONAL RECORDS</h2>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
        {entries.map(([name,weight])=>(
          <div key={name} style={{ background:`${C.yellow}08`, border:`1px solid ${C.yellow}18`, borderRadius:"10px", padding:"12px" }}>
            <p style={mono({ fontSize:"8px", color:"#555", letterSpacing:"0.1em", marginBottom:"4px", textTransform:"uppercase" })}>{name.length>20?name.slice(0,18)+"…":name}</p>
            <p style={cond({ fontSize:"28px", color:C.yellow, lineHeight:1 })}>{weight}<span style={mono({ fontSize:"10px", color:"#666", marginLeft:"3px" })}>lbs</span></p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImpactPicker({ mode, onSet }) {
  const opts = [
    { id:"high",  label:"HIGH-IMPACT",  c:C.red    },
    { id:"low",   label:"LOW-IMPACT",   c:C.teal   },
    { id:"mixed", label:"MIXED",        c:C.purple },
  ];
  return (
    <div style={{ marginBottom:"14px" }}>
      <p style={mono({ fontSize:"9px", letterSpacing:"0.2em", color:"#555", marginBottom:"8px" })}>IMPACT LEVEL</p>
      <div style={{ display:"flex", gap:"6px", overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
        {opts.map(o=>{
          const active = mode===o.id;
          return (
            <button key={o.id} onClick={()=>onSet(o.id)}
              style={{ ...mono({ fontSize:"10px", letterSpacing:"0.1em", fontWeight:700 }), flexShrink:0, padding:"8px 14px", borderRadius:"8px",
                border:`1.5px solid ${active?o.c:C.muted}`, background:active?o.c+"1a":"transparent", color:active?o.c:"#777",
                cursor:"pointer", transition:"all 0.2s", boxShadow:active?`0 0 10px ${o.c}33`:"none" }}>
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const TABS = [
  { id:"today",    label:"TODAY"    },
  { id:"hiit",     label:"HIIT"     },
  { id:"library",  label:"LIBRARY"  },
  { id:"progress", label:"PROGRESS" },
  { id:"habits",   label:"HABITS"   },
];

// ── Daily Wisdom — seeded by date, same quote all day ────────────────────────
const DAILY_WISDOM = [
  { text:"We are what we repeatedly do. Excellence, then, is not an act, but a habit.", source:"Will Durant" },
  { text:"The impediment to action advances action. What stands in the way becomes the way.", source:"Marcus Aurelius" },
  { text:"Take care of your body. It's the only place you have to live.", source:"Jim Rohn" },
  { text:"No citizen has a right to be an amateur in the matter of physical training. What a disgrace it is for a man to grow old without ever seeing the beauty and strength of which his body is capable.", source:"Socrates" },
  { text:"The mind is everything. What you think, you become.", source:"Buddha" },
  { text:"Strength does not come from winning. Your struggles develop your strengths.", source:"Arnold Schwarzenegger" },
  { text:"You don't have to be extreme, just consistent.", source:"Anonymous" },
  { text:"Sleep is the greatest legal performance-enhancing drug that most people are probably neglecting.", source:"Dr. Matthew Walker" },
  { text:"Exercise is the most transformative thing you can do for your brain today.", source:"Dr. Wendy Suzuki" },
  { text:"The first wealth is health.", source:"Ralph Waldo Emerson" },
  { text:"Discipline is choosing between what you want now and what you want most.", source:"Abraham Lincoln" },
  { text:"He who has health has hope, and he who has hope has everything.", source:"Arabian Proverb" },
  { text:"The pain you feel today will be the strength you feel tomorrow.", source:"Anonymous" },
  { text:"Meditation is not about stopping thoughts, but recognizing that we are more than our thoughts.", source:"Arianna Huffington" },
  { text:"It is not the strongest of the species that survives, nor the most intelligent, but the one most responsive to change.", source:"Charles Darwin" },
  { text:"The groundwork of all happiness is health.", source:"Leigh Hunt" },
  { text:"Happiness is the highest form of health.", source:"Dalai Lama" },
  { text:"In the midst of movement and chaos, keep stillness inside of you.", source:"Deepak Chopra" },
  { text:"Your body hears everything your mind says.", source:"Naomi Judd" },
  { text:"When the breath wanders the mind also is unsteady. But when the breath is calmed the mind too will be still.", source:"Hatha Yoga Pradipika" },
  { text:"The doctor of the future will give no medicine, but will instruct his patient in the care of the human frame.", source:"Thomas Edison" },
  { text:"Almost everything will work again if you unplug it for a few minutes — including you.", source:"Anne Lamott" },
  { text:"Lack of activity destroys the good condition of every human being, while movement and methodical physical exercise save it and preserve it.", source:"Plato" },
  { text:"To keep the body in good health is a duty. Otherwise we shall not be able to keep our mind strong and clear.", source:"Buddha" },
  { text:"Motivation is what gets you started. Habit is what keeps you going.", source:"Jim Ryun" },
  { text:"Physical fitness is not only one of the most important keys to a healthy body, it is the basis of dynamic and creative intellectual activity.", source:"John F. Kennedy" },
  { text:"Don't count the days. Make the days count.", source:"Muhammad Ali" },
  { text:"Calm mind brings inner strength and self-confidence, so that's very important for good health.", source:"Dalai Lama" },
  { text:"The only person you are destined to become is the person you decide to be.", source:"Ralph Waldo Emerson" },
  { text:"What we achieve inwardly will change outer reality.", source:"Plutarch" },
  { text:"True enjoyment comes from activity of the mind and exercise of the body; the two are ever united.", source:"Alexander von Humboldt" },
  { text:"Every morning, we are born again. What we do today is what matters most.", source:"Buddha" },
  { text:"You have power over your mind, not outside events. Realize this, and you will find strength.", source:"Marcus Aurelius" },
  { text:"One hour of increased brain activity via focused thinking or exercise can make the next two to four hours better.", source:"Dr. Andrew Huberman" },
  { text:"The resistance that you fight physically in the gym and the resistance that you fight in life can only build a strong character.", source:"Arnold Schwarzenegger" },
  { text:"How long are you going to wait before you demand the best for yourself?", source:"Epictetus" },
  { text:"Healing is a matter of time, but it is sometimes also a matter of opportunity.", source:"Hippocrates" },
  { text:"A feeble body weakens the mind.", source:"Jean-Jacques Rousseau" },
  { text:"The secret of getting ahead is getting started.", source:"Mark Twain" },
  { text:"It is easier to build strong children than to repair broken men.", source:"Frederick Douglass" },
];

function DailyWisdom() {
  const w = DAILY_WISDOM[getDaySeed("wisdom") % DAILY_WISDOM.length];
  return (
    <div style={{ padding:"16px 22px", marginBottom:"14px", borderRadius:"12px", border:`1px solid #ffffff08`, background:"linear-gradient(145deg,rgba(22,22,22,0.6) 0%,rgba(14,14,14,0.4) 100%)" }}>
      <p style={mono({ fontSize:"9px", letterSpacing:"0.2em", color:C.soft, marginBottom:"10px" })}>DAILY WISDOM</p>
      <p style={body({ fontSize:"15px", color:"#b8b8b8", lineHeight:1.7, fontStyle:"italic" })}>&ldquo;{w.text}&rdquo;</p>
      <p style={mono({ fontSize:"10px", color:C.muted, marginTop:"10px" })}>— {w.source}</p>
    </div>
  );
}

// ── Date-keyed localStorage persistence — auto-resets at midnight ────────────
const todayKey = () => {
  const d = new Date();
  return `cw-${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
};
const readStore = (key, fallback) => {
  try {
    const raw = localStorage.getItem(`${todayKey()}-${key}`);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};
const writeStore = (key, val) => {
  try { localStorage.setItem(`${todayKey()}-${key}`, JSON.stringify(val)); } catch {}
};
function usePersisted(key, fallback) {
  const [val, setVal] = useState(() => readStore(key, fallback));
  const set = (updater) => {
    setVal(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      writeStore(key, next);
      return next;
    });
  };
  return [val, set];
}

// ── PR weights — persistent, no date reset (cumulative) ──────────────────────
const PR_KEY = "cw-pr";
const readPR = () => { try { return JSON.parse(localStorage.getItem(PR_KEY) || "{}"); } catch { return {}; } };
const writePR = (val) => { try { localStorage.setItem(PR_KEY, JSON.stringify(val)); } catch {} };
function usePR() {
  const [pr, setPRState] = useState(readPR);
  const setPR = (updater) => {
    setPRState(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      writePR(next);
      return next;
    });
  };
  return [pr, setPR];
}

// ── Redesign: one library, swap anything, add-ons, your own exercises ────────
const UI = { surface:"#101214", surface2:"#171a1d", line:"#1f2327", ink:"#eceeea", ink2:"#a3a8a6", ink3:"#61676a" };
const BODY_COLOR = { Chest:"#FF8C42", Back:"#3D8EFF", Shoulders:"#B06EFF", Arms:"#D4F53C", Legs:"#00E5CC", Glutes:"#FF5FA2", Core:"#FFC23D", Neck:"#FF3D1F", Grip:"#E8C547", Mobility:"#5BC8FF", Cardio:"#FF3D1F", Rehab:"#4CAF50", "Full body":"#D4F53C" };
const BODY_PARTS = ["All", ...Object.keys(BODY_COLOR)];
const SLOT_COLOR = { chest_press:"#FF8C42", chest_iso:"#FF5FA2", bicep:"#D4F53C", tricep:"#B06EFF", shoulder:"#5BC8FF", hinge:"#FF5FA2", squat:"#00E5CC", hamstring_iso:"#FF8C42", back_pull:"#3D8EFF", core_acc:"#FFC23D" };
const CAT_LABEL = { chest_press:"Chest press", chest_iso:"Chest fly", bicep:"Biceps", tricep:"Triceps", shoulder:"Shoulders", hinge:"Hinge", squat:"Squat", hamstring_iso:"Hamstrings", back_pull:"Back pull", core_acc:"Core" };
const exColor = e => BODY_COLOR[e?.body?.[0]] || C.yellow;

const MUSCLE_BODY = { chest:"Chest", shoulders:"Shoulders", biceps:"Arms", triceps:"Arms", forearms:"Grip", back:"Back", lats:"Back", traps:"Back", quads:"Legs", hamstrings:"Legs", calves:"Legs", adductors:"Legs", glutes:"Glutes", core:"Core", abs:"Core", obliques:"Core" };
const POOL_BODY = { serratus:["Shoulders"], neck:["Neck"], tibialis:["Legs"], adductors:["Legs"], glutemed:["Glutes"], obliques:["Core"], forearms:["Grip"], wrists:["Grip"], shaolin:["Core"], fullbody:["Full body"], overall:["Mobility","Cardio"], back:["Back","Core"], legs:["Legs","Glutes"], core:["Core"], mobility:["Mobility"], functional:["Legs","Core"], mindbody:["Mobility"], cardio:["Cardio"] };
const equipOf = n => /band/i.test(n) ? "Band" : /\bDB\b|Dumbbell|Farmer|Suitcase|Goblet/i.test(n) ? "Dumbbells" : /Kettlebell/i.test(n) ? "Kettlebell" : /Bench Press|Pull Ups|Bar Hang|Dead Hang|Hyperextension/i.test(n) ? "Gym" : "Bodyweight";

const LIBRARY = (() => {
  const m = new Map();
  const add = (e, parts, source, extra) => {
    const prev = m.get(e.name);
    if (prev) { prev.body = [...new Set([...prev.body, ...parts])]; return; }
    m.set(e.name, { ...e, body:[...new Set(parts)], source, ...extra });
  };
  for (const [split, pool] of [["A", LIFTING_A], ["B", LIFTING_B]])
    for (const e of pool.exercises) add(e, (e.muscles||[]).map(x=>MUSCLE_BODY[x]||"Full body"), split==="A"?"Arms / Chest lift":"Legs / Back lift", { equip:/band/i.test(e.name)?"Band":"Dumbbells", split });
  for (const e of REHAB) add(e, ["Rehab","Shoulders"], "Shoulder rehab", { equip:equipOf(e.name) });
  for (const [prefix, group] of [["Extras", EXTRAS_POOLS], ["Bonus", BONUS_POOLS], ["Flex", FLEX_POOLS]])
    for (const p of Object.values(group)) for (const e of (p.exercises||[])) add(e, POOL_BODY[p.id]||["Full body"], `${prefix} · ${p.label}`, { equip:equipOf(e.name) });
  return [...m.values()];
})();
const LIB_INDEX = Object.fromEntries(LIBRARY.map(e=>[e.name, e]));

const COLLECTIONS = [
  { id:"lift-A", label:"ARMS / CHEST LIFTS", color:C.yellow, names:LIFTING_A.exercises.map(e=>e.name) },
  { id:"lift-B", label:"LEGS / BACK LIFTS", color:C.teal, names:LIFTING_B.exercises.map(e=>e.name) },
  { id:"rehab", label:"SHOULDER REHAB", color:C.purple, names:REHAB.map(e=>e.name) },
  ...[EXTRAS_POOLS, BONUS_POOLS, FLEX_POOLS].flatMap(g=>Object.values(g).filter(p=>p.exercises).map(p=>({ id:"p-"+p.id, label:p.label, color:p.color, names:p.exercises.map(e=>e.name) }))),
];

const SUGGEST_POOLS = { A:["serratus","neck","forearms","wrists"], B:["tibialis","adductors","glutemed","obliques"], flex:["obliques","glutemed","serratus","tibialis"] };
const suggestionsFor = key => SUGGEST_POOLS[key].map(id => seededShuffle(EXTRAS_POOLS[id].exercises, getDaySeed("sugg-"+id))[0].name);

// Your own exercises + demo clips: list in localStorage, media files in IndexedDB
const CUSTOM_KEY = "cw-custom-exercises", OVERRIDE_KEY = "cw-demo-overrides";
const readJSON = (k, fb) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fb; } catch { return fb; } };
const writeJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
function useStoredJSON(key, fb) {
  const [v, setV] = useState(() => readJSON(key, fb));
  const set = u => setV(p => { const n = typeof u === "function" ? u(p) : u; writeJSON(key, n); return n; });
  return [v, set];
}
const mediaDB = (() => {
  let p = null;
  const open = () => (p ||= new Promise((res, rej) => { const r = indexedDB.open("cw-media", 1); r.onupgradeneeded = () => r.result.createObjectStore("files"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }));
  const run = (mode, fn) => open().then(db => new Promise((res, rej) => { const tx = db.transaction("files", mode); const req = fn(tx.objectStore("files")); tx.oncomplete = () => res(req.result); tx.onerror = () => rej(tx.error); }));
  return { put:(k, v) => run("readwrite", s => s.put(v, k)), get:k => run("readonly", s => s.get(k)), del:k => run("readwrite", s => s.delete(k)) };
})();
const mediaUrls = new Map();
function useMediaUrl(id) {
  const [url, setUrl] = useState(() => (id && mediaUrls.get(id)) || null);
  useEffect(() => {
    if (!id) { setUrl(null); return; }
    if (mediaUrls.has(id)) { setUrl(mediaUrls.get(id)); return; }
    let live = true;
    mediaDB.get(id).then(blob => { if (!blob || !live) return; const u = URL.createObjectURL(blob); mediaUrls.set(id, u); setUrl(u); }).catch(() => {});
    return () => { live = false; };
  }, [id]);
  return url;
}
const AppCtx = createContext({ findEx:n => LIB_INDEX[n] || EX_INDEX[n], overrides:{}, prWeights:{}, inToday:() => false });
function useDemoMedia(name) {
  const app = useContext(AppCtx);
  const m = app.overrides[name] || app.findEx(name)?.media || null;
  const url = useMediaUrl(m?.id);
  return m && url ? { url, kind:m.kind } : null;
}
function MediaView({ media, label }) {
  const st = { position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", display:"block" };
  return media.kind === "video"
    ? <video src={media.url} muted autoPlay loop playsInline aria-label={label} style={st}/>
    : <img src={media.url} alt={label} style={st}/>;
}

function Tag({ color, children }) {
  return <span style={mono({ fontSize:"9.5px", letterSpacing:"0.13em", color, textTransform:"uppercase", lineHeight:1.2 })}>{children}</span>;
}
function CheckBtn({ on, color, onToggle, label }) {
  return (
    <button onClick={e=>{ e.stopPropagation(); onToggle(); }} aria-pressed={on} aria-label={`Mark ${label} done`}
      style={{ width:"36px", height:"36px", flexShrink:0, borderRadius:"50%", border:`1.5px solid ${on?color:color+"66"}`, background:on?color:"transparent", color:on?"#07080a":"transparent", display:"grid", placeItems:"center", cursor:"pointer", padding:0, boxShadow:on?`0 0 14px ${color}99`:"none", transition:"all .2s ease" }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m3 8.5 3.2 3L13 4.5"/></svg>
    </button>
  );
}
function IconBtn({ onClick, label, children }) {
  return <button onClick={e=>{ e.stopPropagation(); onClick(); }} aria-label={label} style={{ width:"36px", height:"36px", flexShrink:0, borderRadius:"50%", border:`1px solid ${UI.line}`, background:"transparent", color:UI.ink3, display:"grid", placeItems:"center", cursor:"pointer", padding:0 }}>{children}</button>;
}
const XIcon = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m4 4 8 8M12 4l-8 8"/></svg>;

function ExCard({ ex, color, tag, hint, done, onTap, right }) {
  return (
    <div role={onTap?"button":undefined} tabIndex={onTap?0:undefined} onClick={onTap}
      onKeyDown={e=>{ if (onTap && (e.key==="Enter"||e.key===" ")) { e.preventDefault(); onTap(); } }}
      style={{ display:"grid", gridTemplateColumns:"58px minmax(0,1fr) auto", gap:"12px", alignItems:"center", padding:"10px", borderRadius:"16px", cursor:onTap?"pointer":"default", opacity:done?0.55:1,
        backgroundColor:UI.surface, backgroundImage:`linear-gradient(115deg, ${color}2b 0%, transparent 62%)`, border:`1px solid ${color}55`, boxShadow:`0 0 22px -12px ${color}`, transition:"opacity .25s ease" }}>
      <DemoThumb name={ex.name} color={color} size={58} fallback/>
      <div style={{ minWidth:0, display:"flex", flexDirection:"column", gap:"3px" }}>
        {(tag||hint) && <div style={{ display:"flex", gap:"8px", alignItems:"center", flexWrap:"wrap" }}>{tag}{hint}</div>}
        <p style={body({ fontSize:"16px", fontWeight:600, color:UI.ink, lineHeight:1.2, textDecoration:done?"line-through":"none" })}>{ex.name}</p>
        {(ex.sets||ex.note) && <p style={body({ fontSize:"12.5px", color:UI.ink2, lineHeight:1.35, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" })}>{[ex.sets, ex.note].filter(Boolean).join(" · ")}</p>}
      </div>
      <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>{right}</div>
    </div>
  );
}
function SectionHead({ title, aside }) {
  return (
    <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", gap:"12px", margin:"24px 0 10px" }}>
      <h2 style={cond({ fontSize:"22px", color:UI.ink, letterSpacing:"0.02em" })}>{title}</h2>
      {aside && <span style={mono({ fontSize:"10px", letterSpacing:"0.14em", color:UI.ink3, textTransform:"uppercase" })}>{aside}</span>}
    </div>
  );
}
const btnStyle = (kind, color) => ({ display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", width:"100%", padding:"14px", borderRadius:"14px", cursor:"pointer", ...mono({ fontSize:"12px", letterSpacing:"0.12em", fontWeight:600, textTransform:"uppercase" }),
  ...(kind==="solid" ? { background:color, color:"#07080a", border:"none", boxShadow:`0 6px 24px -8px ${color}` }
    : kind==="ghost" ? { background:"transparent", color, border:`1.5px dashed ${color}88` }
    : { background:UI.surface2, color:UI.ink, border:`1px solid ${UI.line}` }) });

function SessionPicker({ override, onSet }) {
  const opts = [[null,"AUTO",UI.ink2],["A","ARMS/CHEST",C.yellow],["B","LEGS/BACK",C.teal],["flex","FLEX",C.orange]];
  return (
    <div role="group" aria-label="Today's session" style={{ display:"flex", gap:"4px", marginTop:"14px", background:UI.surface, border:`1px solid ${UI.line}`, borderRadius:"12px", padding:"4px" }}>
      {opts.map(([k,l,c])=>{
        const on = override===k;
        return <button key={l} onClick={()=>onSet(k)} aria-pressed={on} style={{ flex:1, minWidth:0, padding:"9px 2px", borderRadius:"9px", border:"none", cursor:"pointer", whiteSpace:"nowrap", ...mono({ fontSize:"10px", letterSpacing:"0.08em", fontWeight:on?700:500 }), background:on?c+"22":"transparent", color:on?c:UI.ink3, boxShadow:on?`inset 0 0 0 1px ${c}66`:"none" }}>{l}</button>;
      })}
    </div>
  );
}

function TodayHeader({ title, accent, pct, eyebrow, override, scheduledLabel, onSetOverride, theme, onTheme }) {
  const L = 2*Math.PI*31;
  return (
    <header style={{ paddingTop:"calc(env(safe-area-inset-top) + 16px)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <p style={mono({ fontSize:"10px", letterSpacing:"0.16em", color:UI.ink3, textTransform:"uppercase" })}>{eyebrow}</p>
        <button onClick={onTheme} aria-label="Toggle background" style={{ background:"transparent", border:"none", cursor:"pointer", fontSize:"15px", opacity:0.5, color:UI.ink, padding:"4px" }}>{theme==="midnight"?"☀":"☽"}</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"minmax(0,1fr) auto", gap:"12px", alignItems:"center", marginTop:"6px" }}>
        <h1 style={cond({ fontSize:"clamp(34px, 11.5vw, 52px)", lineHeight:0.92, color:accent, textShadow:`0 0 34px ${accent}88`, letterSpacing:"0.005em", whiteSpace:"nowrap" })}>
          {title[0]}{title[1] && <><span style={{ color:UI.ink3, fontWeight:600, padding:"0 3px" }}>/</span>{title[1]}</>}
        </h1>
        <div style={{ position:"relative", width:"74px", height:"74px" }} aria-label={`${pct}% done today`}>
          <svg viewBox="0 0 74 74" style={{ width:"100%", height:"100%", transform:"rotate(-90deg)" }}>
            <circle cx="37" cy="37" r="31" fill="none" stroke={UI.line} strokeWidth="6"/>
            <circle cx="37" cy="37" r="31" fill="none" stroke={accent} strokeWidth="6" strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L*(1-pct/100)} style={{ transition:"stroke-dashoffset .5s ease", filter:`drop-shadow(0 0 6px ${accent}aa)` }}/>
          </svg>
          <span style={{ position:"absolute", inset:0, display:"grid", placeItems:"center", ...cond({ fontSize:"22px", color:UI.ink }) }}>{pct}%</span>
        </div>
      </div>
      <SessionPicker override={override} onSet={onSetOverride}/>
      {override!==null && <p style={mono({ fontSize:"9px", color:UI.ink3, letterSpacing:"0.12em", marginTop:"8px" })}>SCHEDULED TODAY: {scheduledLabel} · TAP AUTO TO SWITCH BACK</p>}
    </header>
  );
}

function SuggestRail({ names, onAdd }) {
  const app = useContext(AppCtx);
  const items = names.filter(n=>!app.inToday(n)).map(n=>app.findEx(n)).filter(Boolean);
  if (!items.length) return <p style={body({ fontSize:"14px", color:UI.ink2, padding:"14px", background:UI.surface, border:`1px solid ${UI.line}`, borderRadius:"16px" })}>All of today's suggestions are added. Use Add any exercise for more.</p>;
  return (
    <div style={{ display:"flex", gap:"8px", overflowX:"auto", scrollSnapType:"x mandatory", paddingBottom:"4px", WebkitOverflowScrolling:"touch" }}>
      {items.map(e=>{
        const c = exColor(e);
        return (
          <button key={e.name} onClick={()=>onAdd(e.name)} style={{ flex:"0 0 148px", scrollSnapAlign:"start", textAlign:"left", cursor:"pointer", display:"flex", flexDirection:"column", gap:"8px", padding:"10px", borderRadius:"16px",
            backgroundColor:UI.surface, backgroundImage:`linear-gradient(180deg, ${c}2e, transparent 70%)`, border:`1px solid ${c}66`, color:UI.ink }}>
            <div style={{ width:"100%", height:"84px", borderRadius:"12px", overflow:"hidden", position:"relative" }}><DemoFrames name={e.name} color={c} animate={false} bare/></div>
            <span style={body({ fontSize:"13.5px", fontWeight:600, lineHeight:1.2, minHeight:"2.4em" })}>{e.name}</span>
            <Tag color={UI.ink3}>{e.source.replace(/^\w+ · /,"")}</Tag>
            <Tag color={c}>+ Add to today</Tag>
          </button>
        );
      })}
    </div>
  );
}

function Fold({ title, eyebrow, color, count, open, onToggle, children }) {
  return (
    <div style={{ borderRadius:"16px", backgroundColor:UI.surface, backgroundImage:`linear-gradient(115deg, ${color}1f, transparent 60%)`, border:`1px solid ${color}44`, marginBottom:"8px" }}>
      <button onClick={onToggle} aria-expanded={open} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", padding:"14px", gap:"12px", background:"transparent", border:"none", color:UI.ink, cursor:"pointer", textAlign:"left" }}>
        <div><Tag color={color}>{eyebrow}</Tag><p style={body({ fontSize:"16px", fontWeight:600, marginTop:"4px" })}>{title}</p></div>
        <span style={{ display:"flex", gap:"10px", alignItems:"center" }}>
          {count && <span style={mono({ fontSize:"11px", color:UI.ink3 })}>{count}</span>}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={UI.ink3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform:open?"rotate(180deg)":"none", transition:"transform .2s ease" }}><path d="m4 6 4 4 4-4"/></svg>
        </span>
      </button>
      {open && <div style={{ display:"flex", flexDirection:"column", gap:"6px", padding:"0 8px 8px" }}>{children}</div>}
    </div>
  );
}

function Sheet({ color=C.yellow, onClose, children }) {
  useEffect(() => {
    const onKey = e => { if (e.key==="Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, []);
  return (
    <div style={{ position:"fixed", inset:0, zIndex:9000 }}>
      <div onClick={onClose} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.62)", backdropFilter:"blur(3px)", WebkitBackdropFilter:"blur(3px)", animation:"fadeIn .2s ease" }}/>
      <div role="dialog" aria-modal="true" style={{ position:"absolute", left:0, right:0, bottom:0, maxWidth:"480px", margin:"0 auto", maxHeight:"88%", display:"flex", flexDirection:"column", background:UI.surface, border:`1px solid ${color}44`, borderBottom:"none", borderRadius:"24px 24px 0 0", padding:"10px 16px calc(env(safe-area-inset-bottom) + 16px)", animation:"sheetRise .28s cubic-bezier(.2,.9,.25,1)", boxShadow:`0 -12px 40px ${color}22` }}>
        <div style={{ width:"40px", height:"4px", borderRadius:"4px", background:UI.line, margin:"0 auto 12px", flexShrink:0 }}/>
        {children}
      </div>
    </div>
  );
}
function SheetHead({ eyebrow, title, sub, color, onClose }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"12px", flexShrink:0 }}>
      <div style={{ minWidth:0 }}>
        <Tag color={color}>{eyebrow}</Tag>
        <h2 style={cond({ fontSize:"28px", color:UI.ink, lineHeight:1, marginTop:"4px" })}>{title}</h2>
        {sub && <p style={body({ fontSize:"13px", color:UI.ink2, marginTop:"4px" })}>{sub}</p>}
      </div>
      <IconBtn onClick={onClose} label="Close"><XIcon/></IconBtn>
    </div>
  );
}

const filterLibrary = (list, q, part) => {
  const s = q.trim().toLowerCase();
  return list.filter(e => (part==="All" || e.body.includes(part)) && (!s || e.name.toLowerCase().includes(s) || (e.note||"").toLowerCase().includes(s)));
};
function PartChips({ value, onChange }) {
  return (
    <div role="group" aria-label="Body part" style={{ display:"flex", gap:"6px", overflowX:"auto", padding:"12px 0", WebkitOverflowScrolling:"touch", flexShrink:0 }}>
      {BODY_PARTS.map(p=>{
        const c = BODY_COLOR[p] || UI.ink2, on = p===value;
        return <button key={p} onClick={()=>onChange(p)} aria-pressed={on} style={{ flex:"0 0 auto", padding:"8px 12px", borderRadius:"20px", cursor:"pointer", ...mono({ fontSize:"11px", letterSpacing:"0.08em" }), border:`1px solid ${on?c:c+"55"}`, background:on?c:UI.surface, color:on?"#07080a":c, boxShadow:on?`0 0 14px ${c}88`:"none" }}>{p}</button>;
      })}
    </div>
  );
}
const searchStyle = { width:"100%", padding:"13px 14px", borderRadius:"14px", border:`1px solid ${UI.line}`, background:UI.surface2, color:UI.ink, fontSize:"16px", fontFamily:"'Barlow',sans-serif", outline:"none" };
const bodyTag = e => <Tag color={exColor(e)}>{e.custom ? "Your exercise · " : ""}{e.body.slice(0,2).join(" · ")} · {e.equip}</Tag>;

function PickerSheet({ eyebrow, title, sub, color, primary, library, inUse, onPick, onClose }) {
  const [scope, setScope] = useState(primary ? "primary" : "all");
  const [q, setQ] = useState("");
  const [part, setPart] = useState("All");
  const byName = useMemo(()=>Object.fromEntries(library.map(e=>[e.name,e])), [library]);
  const list = scope==="primary" ? primary.names.map(n=>byName[n]).filter(Boolean) : filterLibrary(library, q, part);
  return (
    <Sheet color={color} onClose={onClose}>
      <SheetHead eyebrow={eyebrow} title={title} sub={sub} color={color} onClose={onClose}/>
      {primary && (
        <div role="group" aria-label="Show" style={{ display:"flex", gap:"4px", marginTop:"12px", background:UI.surface2, border:`1px solid ${UI.line}`, borderRadius:"12px", padding:"4px", flexShrink:0 }}>
          {[["primary", `${primary.label} (${primary.names.length})`],["all", `ALL EXERCISES (${library.length})`]].map(([k,l])=>(
            <button key={k} onClick={()=>setScope(k)} aria-pressed={scope===k} style={{ flex:1, minWidth:0, padding:"9px 4px", borderRadius:"9px", border:"none", cursor:"pointer", ...mono({ fontSize:"10px", letterSpacing:"0.08em" }), whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", background:scope===k?color+"22":"transparent", color:scope===k?color:UI.ink3 }}>{l.toUpperCase()}</button>
          ))}
        </div>
      )}
      {scope==="all" && <>
        <input id="picker-search" type="search" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search exercises" autoComplete="off" style={{ ...searchStyle, marginTop:"12px", flexShrink:0 }}/>
        <PartChips value={part} onChange={setPart}/>
      </>}
      <div style={{ overflowY:"auto", minHeight:0, display:"flex", flexDirection:"column", gap:"8px", marginTop:scope==="all"?0:"12px", WebkitOverflowScrolling:"touch" }}>
        {list.length ? list.map(e=>(
          <ExCard key={e.name} ex={e} color={exColor(e)} onTap={()=>onPick(e.name)} tag={bodyTag(e)}
            right={inUse.has(e.name) ? <span style={{ ...mono({ fontSize:"9px", letterSpacing:"0.12em" }), color, border:`1px solid ${color}66`, borderRadius:"20px", padding:"4px 7px" }}>IN USE</span> : null}/>
        )) : <p style={body({ fontSize:"14px", color:UI.ink2, padding:"14px" })}>Nothing matches that. Try another body part, or add it from the Library as a new exercise.</p>}
      </div>
    </Sheet>
  );
}

function LibraryView({ library, onNew }) {
  const openDemo = useContext(DemoContext);
  const [q, setQ] = useState("");
  const [part, setPart] = useState("All");
  const [coll, setColl] = useState(null);
  const active = COLLECTIONS.find(c=>c.id===coll);
  const pool = active ? library.filter(e=>active.names.includes(e.name)) : library;
  const list = filterLibrary(pool, q, part).sort((a,b)=>(b.custom?1:0)-(a.custom?1:0) || a.name.localeCompare(b.name));
  return (
    <>
      <header style={{ paddingTop:"calc(env(safe-area-inset-top) + 18px)", paddingBottom:"6px" }}>
        <Tag color={UI.ink3}>Everything in one place</Tag>
        <h1 style={cond({ fontSize:"44px", color:C.yellow, textShadow:`0 0 30px ${C.yellow}66`, marginTop:"4px" })}>Library</h1>
        <p style={body({ fontSize:"14px", color:UI.ink2, marginTop:"6px", lineHeight:1.5 })}>Every lift, extra, bonus workout, rehab and flex move. Tap one to see the demo or add it to today.</p>
      </header>
      <input id="library-search" type="search" value={q} onChange={e=>setQ(e.target.value)} placeholder={`Search ${library.length} exercises`} autoComplete="off" style={{ ...searchStyle, marginTop:"10px" }}/>
      <PartChips value={part} onChange={setPart}/>
      <SectionHead title="Collections" aside={active ? "tap again to clear" : `${COLLECTIONS.length} sets`}/>
      <div style={{ display:"flex", gap:"8px", overflowX:"auto", paddingBottom:"4px", WebkitOverflowScrolling:"touch" }}>
        {COLLECTIONS.map(c=>{
          const on = c.id===coll;
          return (
            <button key={c.id} onClick={()=>setColl(on?null:c.id)} aria-pressed={on} style={{ flex:"0 0 auto", maxWidth:"170px", textAlign:"left", cursor:"pointer", padding:"12px", borderRadius:"14px",
              backgroundColor:on?c.color+"26":UI.surface, backgroundImage:`linear-gradient(160deg, ${c.color}24, transparent 70%)`, border:`1px solid ${on?c.color:c.color+"55"}`, boxShadow:on?`0 0 18px -6px ${c.color}`:"none", color:UI.ink }}>
              <span style={mono({ fontSize:"9.5px", letterSpacing:"0.12em", color:c.color, display:"block", lineHeight:1.35 })}>{c.label}</span>
              <span style={mono({ fontSize:"10px", color:UI.ink3, display:"block", marginTop:"6px" })}>{c.names.length} moves</span>
            </button>
          );
        })}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", margin:"18px 0 10px" }}>
        <Tag color={UI.ink3}>{list.length} exercise{list.length===1?"":"s"}</Tag>
        <Tag color={active?active.color:UI.ink3}>{active ? active.label : part==="All" ? "A to Z" : part}</Tag>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
        {list.length ? list.map(e=><ExCard key={e.name} ex={e} color={exColor(e)} onTap={()=>openDemo(e.name, exColor(e))} tag={bodyTag(e)}/>)
          : <p style={body({ fontSize:"14px", color:UI.ink2, padding:"14px" })}>Nothing matches that. Try another body part, or add it as a new exercise.</p>}
      </div>
      <button onClick={onNew} style={{ position:"fixed", right:"max(16px, calc(50% - 224px))", bottom:"calc(env(safe-area-inset-bottom) + 84px)", zIndex:50, display:"flex", alignItems:"center", gap:"8px", padding:"14px 18px", borderRadius:"30px", border:"none", cursor:"pointer", background:C.yellow, color:"#07080a", ...mono({ fontSize:"12px", letterSpacing:"0.1em", fontWeight:700 }), boxShadow:`0 10px 30px rgba(0,0,0,.6), 0 0 24px ${C.yellow}55` }}>+ NEW EXERCISE</button>
    </>
  );
}

function NewExerciseSheet({ existing, onSave, onClose }) {
  const [form, setForm] = useState({ name:"", part:"Core", equip:"Bodyweight", sets:"", note:"" });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);
  const set = k => e => setForm(f=>({ ...f, [k]:e.target.value }));
  const pickFile = e => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 80*1024*1024) { setErr("That clip is too big to store. Trim it to a few seconds and try again."); return; }
    setErr(""); setFile(f); setPreview({ url:URL.createObjectURL(f), kind:f.type.startsWith("video")?"video":"image" });
  };
  const submit = async e => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) { setErr("Give the exercise a name so you can find it later."); return; }
    if (existing(name)) { setErr("You already have an exercise with that name."); return; }
    setSaving(true);
    try { await onSave({ name, body:[form.part], equip:form.equip, sets:form.sets.trim(), note:form.note.trim() }, file); }
    catch { setErr("Couldn't save the clip on this phone. Try a shorter one, or save without it."); setSaving(false); }
  };
  const field = { width:"100%", padding:"12px", borderRadius:"12px", border:`1px solid ${UI.line}`, background:UI.surface2, color:UI.ink, fontSize:"16px", fontFamily:"'Barlow',sans-serif" };
  const lab = mono({ fontSize:"10px", letterSpacing:"0.14em", color:UI.ink3, textTransform:"uppercase", display:"flex", flexDirection:"column", gap:"6px" });
  return (
    <Sheet color={C.yellow} onClose={onClose}>
      <SheetHead eyebrow="Library" title="New exercise" sub="Saved on this phone and available everywhere right away." color={C.yellow} onClose={onClose}/>
      <form onSubmit={submit} noValidate style={{ overflowY:"auto", minHeight:0, display:"flex", flexDirection:"column", gap:"12px", marginTop:"12px", WebkitOverflowScrolling:"touch" }}>
        <label htmlFor="nx-name" style={lab}>Name<input id="nx-name" value={form.name} onChange={set("name")} placeholder="e.g. Landmine Press" autoComplete="off" style={field}/></label>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
          <label htmlFor="nx-part" style={lab}>Body part<select id="nx-part" value={form.part} onChange={set("part")} style={field}>{BODY_PARTS.slice(1).map(p=><option key={p}>{p}</option>)}</select></label>
          <label htmlFor="nx-equip" style={lab}>Equipment<select id="nx-equip" value={form.equip} onChange={set("equip")} style={field}>{["Bodyweight","Band","Dumbbells","Kettlebell","Gym"].map(p=><option key={p}>{p}</option>)}</select></label>
        </div>
        <label htmlFor="nx-sets" style={lab}>Sets &amp; reps<input id="nx-sets" value={form.sets} onChange={set("sets")} placeholder="3×12" autoComplete="off" style={field}/></label>
        <label htmlFor="nx-note" style={lab}>Form cues<textarea id="nx-note" value={form.note} onChange={set("note")} placeholder="What to focus on. Read out loud when you tap Hear cues." style={{ ...field, minHeight:"76px", resize:"vertical" }}/></label>
        <label htmlFor="nx-media" style={lab}>Photo or clip (optional)
          <div style={{ border:`1.5px dashed ${UI.line}`, borderRadius:"14px", padding:"14px", display:"grid", gap:"10px", textAlign:"center", ...body({ fontSize:"13px", color:UI.ink2, textTransform:"none", letterSpacing:0 }) }}>
            {preview ? <div style={{ position:"relative", width:"100%", aspectRatio:"3 / 2", borderRadius:"12px", overflow:"hidden", background:"#000" }}><MediaView media={preview} label="Your clip"/></div>
              : <span>Film 5 seconds of the move, or pick one from your camera roll. It loops like a GIF.</span>}
            <input id="nx-media" type="file" accept="image/*,video/*" onChange={pickFile} style={{ color:UI.ink2, fontSize:"13px" }}/>
          </div>
        </label>
        {err && <p role="alert" style={body({ fontSize:"13px", color:C.red })}>{err}</p>}
        <button type="submit" disabled={saving} style={btnStyle("solid", C.yellow)}>{saving ? "SAVING..." : "SAVE TO LIBRARY"}</button>
      </form>
    </Sheet>
  );
}

const dayKeyOf = d => `cw-${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
function weekDays() {
  const now = new Date(), dow = now.getDay(), mon = new Date(now);
  mon.setDate(now.getDate() + (dow===0 ? -6 : 1-dow));
  return Array.from({ length:7 }, (_,i)=>{ const d = new Date(mon); d.setDate(mon.getDate()+i); return d; }).filter(d=>d<=now);
}
function MomentumChart() {
  const weeks = useMemo(() => {
    const out = [], now = new Date();
    for (let w = 11; w >= 0; w--) {
      const mon = new Date(now), dow = mon.getDay();
      mon.setDate(mon.getDate() + (dow===0 ? -6 : 1-dow) - w*7);
      let sessions = 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date(mon); d.setDate(mon.getDate()+i);
        if (d > now) continue;
        const lift = readJSON(`${dayKeyOf(d)}-lift`, {}), addons = readJSON(`${dayKeyOf(d)}-addonChecked`, {}), daily = readJSON(`${dayKeyOf(d)}-daily`, {});
        const lifted = Object.values(lift).some(s => s && Object.values(s).some(Boolean)) || Object.values(addons).some(Boolean);
        const busy = Object.values(daily).filter(Boolean).length >= 4;
        if (lifted || busy) sessions++;
      }
      out.push({ sessions, now:w===0 });
    }
    return out;
  }, []);
  return (
    <div style={{ padding:"14px", borderRadius:"16px", backgroundColor:UI.surface, backgroundImage:`linear-gradient(160deg, ${C.teal}1f, transparent 65%)`, border:`1px solid ${C.teal}44` }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(12, 1fr)", gap:"5px", alignItems:"end", height:"96px" }}>
        {weeks.map((w,i)=>(
          <div key={i} title={`${w.sessions} active days`} style={{ height:`${Math.max(6, w.sessions/7*100)}%`, borderRadius:"4px 4px 2px 2px", background:w.now?`linear-gradient(to top, ${C.teal}, ${C.yellow})`:`linear-gradient(to top, ${C.teal}66, ${C.yellow}55)`, boxShadow:w.now?`0 0 14px ${C.teal}99`:"none" }}/>
        ))}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:"8px" }}><Tag color={UI.ink3}>12 weeks ago</Tag><Tag color={UI.ink3}>This week</Tag></div>
    </div>
  );
}
function WeekStats() {
  const s = useMemo(() => {
    let lifts = 0, addons = 0; const rpe = [];
    for (const d of weekDays()) {
      const k = dayKeyOf(d);
      if (Object.values(readJSON(`${k}-lift`, {})).some(x => x && Object.values(x).some(Boolean))) lifts++;
      addons += Object.values(readJSON(`${k}-addonChecked`, {})).filter(Boolean).length;
      const r = readJSON(`cw-rpe-${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`, null);
      if (r) rpe.push(r);
    }
    const avg = rpe.length ? rpe.reduce((a,b)=>a+b,0)/rpe.length : 0;
    return { lifts, addons, effort: !avg ? "—" : avg <= 2.5 ? "EASY" : avg <= 4 ? "HARD" : "MAX" };
  }, []);
  const tile = (v, l, c) => (
    <div style={{ padding:"12px", borderRadius:"16px", backgroundColor:UI.surface, backgroundImage:`linear-gradient(160deg, ${c}24, transparent 70%)`, border:`1px solid ${c}44` }}>
      <p style={cond({ fontSize:"30px", color:c, textShadow:`0 0 16px ${c}66` })}>{v}</p>
      <p style={mono({ fontSize:"9.5px", letterSpacing:"0.1em", color:UI.ink3, textTransform:"uppercase", marginTop:"4px", lineHeight:1.3 })}>{l}</p>
    </div>
  );
  return <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:"8px" }}>{tile(s.lifts, "lift days this week", C.teal)}{tile(s.addons, "add-ons done", C.yellow)}{tile(s.effort, "avg effort", C.orange)}</div>;
}

const blobToDataURL = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(b); });
function BackupCard({ custom, overrides, prWeights, onRestore, toast }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const exportBackup = async () => {
    setBusy(true);
    try {
      const ids = [...custom.map(e=>e.media?.id), ...Object.values(overrides).map(m=>m.id)].filter(Boolean);
      const media = {};
      for (const id of ids) { const b = await mediaDB.get(id); if (b) media[id] = await blobToDataURL(b); }
      const data = JSON.stringify({ app:"charlies-wellness", version:1, saved:new Date().toISOString(), custom, overrides, prWeights, media });
      const fname = `wellness-backup-${new Date().toISOString().slice(0,10)}.json`;
      const file = new File([data], fname, { type:"application/json" });
      if (navigator.canShare && navigator.canShare({ files:[file] })) { await navigator.share({ files:[file], title:"Wellness backup" }); toast("Backup ready to save"); }
      else { const a = document.createElement("a"); a.href = URL.createObjectURL(file); a.download = fname; a.click(); toast("Backup downloaded"); }
    } catch (e) { if (e?.name !== "AbortError") toast("Backup didn't finish. Try again."); }
    setBusy(false);
  };
  const importBackup = async e => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (d.app !== "charlies-wellness") throw new Error("wrong file");
      for (const [id, url] of Object.entries(d.media||{})) await mediaDB.put(id, await (await fetch(url)).blob());
      onRestore(d); toast("Backup restored");
    } catch { toast("That file isn't a wellness backup"); }
  };
  return (
    <div style={{ padding:"14px", borderRadius:"16px", background:UI.surface, border:`1px solid ${UI.line}`, display:"flex", flexDirection:"column", gap:"10px" }}>
      <p style={body({ fontSize:"14px", color:UI.ink2, lineHeight:1.5 })}>Your own exercises, clips and best weights live on this phone. Save a backup now and then so clearing Safari data can't erase them.</p>
      <button onClick={exportBackup} disabled={busy} style={btnStyle("line")}>{busy ? "PREPARING..." : "SAVE A BACKUP"}</button>
      <button onClick={()=>fileRef.current?.click()} style={btnStyle("ghost", UI.ink2)}>RESTORE FROM BACKUP</button>
      <input ref={fileRef} type="file" accept="application/json,.json" onChange={importBackup} hidden/>
    </div>
  );
}

function TabBar({ tab, onTab }) {
  const I = {
    today:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>,
    hiit:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V9.5M10 2.5h4"/></svg>,
    library:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/></svg>,
    progress:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 19.5h16M7 16v-5M12 16V6.5M17 16v-3"/></svg>,
    habits:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20s-7-4.3-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.7-7 10-7 10Z"/></svg>,
  };
  return (
    <nav aria-label="Sections" style={{ position:"fixed", left:0, right:0, bottom:0, zIndex:60, background:"rgba(7,8,10,0.9)", backdropFilter:"blur(18px)", WebkitBackdropFilter:"blur(18px)", borderTop:`1px solid ${UI.line}`, padding:"8px 8px calc(env(safe-area-inset-bottom) + 8px)" }}>
      <div style={{ maxWidth:"480px", margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(5, 1fr)" }}>
        {TABS.map(t=>{
          const on = tab===t.id;
          return (
            <button key={t.id} onClick={()=>onTab(t.id)} aria-current={on?"page":undefined} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"5px", padding:"6px 0", background:"transparent", border:"none", cursor:"pointer", color:on?C.yellow:UI.ink3, filter:on?`drop-shadow(0 0 6px ${C.yellow}88)`:"none" }}>
              <span style={{ width:"21px", height:"21px", display:"block" }}>{I[t.id]}</span>
              <span style={mono({ fontSize:"9.5px", letterSpacing:"0.1em" })}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  return <div role="status" style={{ position:"fixed", left:"50%", bottom:"calc(env(safe-area-inset-bottom) + 92px)", transform:"translateX(-50%)", zIndex:11000, background:UI.ink, color:"#07080a", padding:"11px 16px", borderRadius:"30px", maxWidth:"calc(100% - 32px)", textAlign:"center", animation:"fadeIn .2s ease", ...body({ fontSize:"13px", fontWeight:600 }) }}>{msg}</div>;
}

export default function App() {
  const [tab,setTab] = useState("today");
  const [dayOverride, setDayOverride] = usePersisted("dayOverride", null); // null | "A" | "B" | "flex"
  const day = useMemo(()=>{
    if(dayOverride==="A")    return { type:"lift", split:"A" };
    if(dayOverride==="B")    return { type:"lift", split:"B" };
    if(dayOverride==="flex") return { type:"flex", isWeekend:true };
    return getDayPlan();
  },[dayOverride]);
  const today = new Date().toLocaleDateString("en-US",{ weekday:"long", month:"short", day:"numeric" });
  const scheduled = getDayPlan();
  const scheduledLabel = scheduled.type==="lift" ? (scheduled.split==="A"?"ARMS/CHEST":"LEGS/BACK") : "FLEX";

  // ── Persisted state: survives app close, auto-resets at midnight ──
  const [dailyChecked, setDailyChecked] = usePersisted("daily", {});
  const [rehabChecked, setRehabChecked] = usePersisted("rehab", {});
  const [stackChecked, setStackChecked] = usePersisted("stack", {});
  const [liftChecked,  setLiftChecked]  = usePersisted("lift",  {});
  const [flexChecked,  setFlexChecked]  = usePersisted("flex",  {});
  const [addons, setAddons] = usePersisted("addons", []);
  const [addonChecked, setAddonChecked] = usePersisted("addonChecked", {});
  const [timerStates,  setTimerStates]  = usePersisted("timers",
    SNACK_CONFIG.reduce((acc,cfg)=>({...acc,[cfg.id]:{timeLeft:cfg.duration,running:false,done:false}}),{})
  );
  const [prWeights, setPRWeights] = usePR();
  const [custom, setCustom] = useStoredJSON(CUSTOM_KEY, []);
  const [overrides, setOverrides] = useStoredJSON(OVERRIDE_KEY, {});
  const [open, setOpen] = useState({ rehab:false });
  const [sheet, setSheet] = useState(null);
  const [toastMsg, setToastMsg] = useState("");
  const toastT = useRef(null);
  const toast = msg => { setToastMsg(msg); clearTimeout(toastT.current); toastT.current = setTimeout(()=>setToastMsg(""), 2200); };
  const [demo, setDemo] = useState(null);
  const openDemo = useMemo(() => (name, color) => setDemo({ name, color }), []);
  const [guided, setGuided] = useState(false);
  const [showCinematic, setShowCinematic] = useState(false);
  const [cinematicData, setCinematicData] = useState(null);
  const [showRPE, setShowRPE] = useState(false);
  const coachPulse = useCoachPulse();
  const [pulseDismissed, setPulseDismissed] = useState(false);
  const [theme, setTheme] = useState(()=>{ try { return localStorage.getItem("cw-theme")||"black"; } catch { return "black"; } });
  useEffect(()=>{ try { localStorage.setItem("cw-theme",theme); } catch {} },[theme]);
  const handleWorkoutComplete = (data) => { setCinematicData(data); setShowCinematic(true); };
  const handleCinematicDone = () => { setShowCinematic(false); setShowRPE(true); };
  const handleRPE = (val) => {
    if (val > 0) {
      const d = new Date();
      try { localStorage.setItem(`cw-rpe-${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`, JSON.stringify(val)); } catch {}
    }
    setShowRPE(false);
  };
  const dismissPulse = () => {
    setPulseDismissed(true);
    if (coachPulse?.dismissKey) { try { localStorage.setItem(coachPulse.dismissKey,"1"); } catch {} }
  };

  // ── Library: built-in moves plus your own ──
  const customByName = useMemo(()=>Object.fromEntries(custom.map(e=>[e.name, e])), [custom]);
  const library = useMemo(()=>[...custom, ...LIBRARY], [custom]);
  const findEx = name => customByName[name] || LIB_INDEX[name] || EX_INDEX[name];

  // ── HIIT (unchanged) ──
  const [impactMode, setImpactMode] = usePersisted("impactMode", "high");
  const [hiitSwaps, setHiitSwaps] = usePersisted("hiitSwaps", {});
  const hiitExercises = useMemo(()=>dealHiit(impactMode).map((g,si)=>g.map((ex,ei)=>hiitSwaps[`${impactMode}-${si}-${ei}`]||ex)), [impactMode, hiitSwaps]);
  const hiitSpare = [...AEROBIC_POOL, ...LOW_IMPACT_POOL].filter(n=>!hiitExercises.flat().includes(n));
  const swapHiit = (si, ei, name) => setHiitSwaps(s=>({ ...s, [`${impactMode}-${si}-${ei}`]: name }));

  // ── Lift: seeded picks, each slot swappable to anything ──
  const baseLiftPicks = useMemo(()=>{
    if(day.type!=="lift") return null;
    return pickBalanced(day.split==="A"?LIFTING_A:LIFTING_B,"lift"+day.split);
  },[day]);
  const [liftSwaps, setLiftSwaps] = usePersisted("liftSwaps", {});
  const liftData = useMemo(()=>{
    if(!baseLiftPicks) return null;
    const pool = day.split==="A"?LIFTING_A:LIFTING_B;
    const exercises = baseLiftPicks.map((ex,i)=>{
      const n = liftSwaps[`${day.split}-${i}`];
      if(!n) return ex;
      if(typeof n==="string") { const f = findEx(n); return f ? { ...f, cat:ex.cat } : ex; }
      const opts = pool.exercises.filter(e=>e.cat===ex.cat);
      return opts[(opts.findIndex(e=>e.name===ex.name)+n)%opts.length];
    });
    return { ...pool, exercises, pool:pool.exercises };
  },[baseLiftPicks,liftSwaps,day,customByName]);
  const splitLiftChecked = liftChecked[day.split]||{};
  const setSplitLiftChecked = c=>setLiftChecked(f=>({...f,[day.split]:typeof c==="function"?c(f[day.split]||{}):c}));
  const chooseLift = (i,name)=>{
    setLiftSwaps(s=>({...s,[`${day.split}-${i}`]:name}));
    setLiftChecked(f=>{const pc={...(f[day.split]||{})};delete pc[i];return{...f,[day.split]:pc};});
    setAddons(a=>a.filter(n=>n!==name));
  };

  // ── Flex: seeded picks, each swappable to anything ──
  const [baseFlexPicks] = useState(()=>Object.fromEntries(Object.values(FLEX_POOLS).map(p=>[p.id, pick(p.exercises,5,p.id)])));
  const [flexSwaps, setFlexSwaps] = usePersisted("flexSwaps", {});
  const flexExercises = useMemo(()=>
    Object.fromEntries(Object.entries(baseFlexPicks).map(([pid,baseExs])=>{
      const pool = FLEX_POOLS[pid];
      return [pid, baseExs.map((ex,i)=>{
        const n = flexSwaps[`${pid}-${i}`];
        if(!n) return ex;
        if(typeof n==="string") return findEx(n) || ex;
        return pool.exercises[(pool.exercises.findIndex(e=>e.name===ex.name)+n)%pool.exercises.length];
      })];
    }))
  ,[baseFlexPicks,flexSwaps,customByName]);
  const chooseFlex = (pid,i,name)=>{
    setFlexSwaps(s=>({...s,[`${pid}-${i}`]:name}));
    setFlexChecked(f=>{const pc={...(f[pid]||{})};delete pc[i];return{...f,[pid]:pc};});
  };

  // ── Add-ons ──
  const todayNames = new Set([...(liftData ? liftData.exercises.map(e=>e.name) : []), ...addons]);
  const inToday = name => todayNames.has(name);
  const addToToday = name => {
    if (inToday(name)) { toast(`${name} is already in today's workout`); return; }
    setAddons(a=>[...a, name]); toast(`${name} added to today`);
  };
  const removeAddon = name => { setAddons(a=>a.filter(n=>n!==name)); setAddonChecked(c=>{ const n={...c}; delete n[name]; return n; }); };

  // ── Your own exercises, clips, best weights ──
  const saveCustom = async (ex, file) => {
    let media = null;
    if (file) { const id = `m${Date.now()}`; await mediaDB.put(id, file); media = { id, kind:file.type.startsWith("video")?"video":"image" }; }
    setCustom(list=>[{ ...ex, custom:true, source:"Your exercise", media }, ...list]);
    setSheet(null); toast(`Saved ${ex.name} to your library`); setDemo({ name:ex.name, color:BODY_COLOR[ex.body[0]] || C.yellow });
  };
  const setOwnClip = async (name, file) => {
    const id = `m${Date.now()}`;
    await mediaDB.put(id, file);
    const prev = overrides[name]; if (prev) mediaDB.del(prev.id).catch(()=>{});
    setOverrides(o=>({ ...o, [name]:{ id, kind:file.type.startsWith("video")?"video":"image" } }));
    toast("Your clip is now the demo");
  };
  const clearOwnClip = name => {
    const prev = overrides[name]; if (prev) mediaDB.del(prev.id).catch(()=>{});
    setOverrides(o=>{ const n={...o}; delete n[name]; return n; }); toast("Back to the original demo");
  };
  const deleteCustom = name => {
    const e = customByName[name]; if (e?.media) mediaDB.del(e.media.id).catch(()=>{});
    setCustom(list=>list.filter(x=>x.name!==name)); removeAddon(name); setDemo(null); toast(`Deleted ${name}`);
  };
  const setPR = (name, lbs) => { setPRWeights(p=>({ ...p, [name]:lbs })); toast(`Best weight saved: ${lbs} lb`); };
  const restoreBackup = d => {
    setCustom(list=>{ const have = new Set(list.map(e=>e.name)); return [...list, ...(d.custom||[]).filter(e=>!have.has(e.name))]; });
    setOverrides(o=>({ ...(d.overrides||{}), ...o }));
    setPRWeights(p=>({ ...(d.prWeights||{}), ...p }));
  };
  const appCtx = { findEx, overrides, prWeights, inToday, addToToday:n=>{ addToToday(n); setDemo(null); }, setOwnClip, clearOwnClip, deleteCustom, setPR };

  // ── Today's plan and progress ──
  const accent = day.type==="lift" ? (day.split==="A"?C.yellow:C.teal) : day.isWeekend ? C.orange : C.purple;
  const title = day.type==="lift" ? (day.split==="A"?["Arms","Chest"]:["Legs","Back"]) : day.isWeekend ? ["Flex","Day"] : ["Yoga","Core"];
  const flexPoolIds = day.type==="flex" ? (day.isWeekend ? Object.keys(FLEX_POOLS) : ["core"]) : [];
  const flexTotals = flexPoolIds.map(pid=>({ pid, done:Object.values(flexChecked[pid]||{}).filter(Boolean).length }));
  const workTotal = (liftData ? liftData.exercises.length : 0) + addons.length + REHAB.length
    + (day.type==="flex" ? (day.isWeekend ? 5*Math.max(1, flexTotals.filter(t=>t.done>0).length) : 5) : 0);
  const workDone = Object.values(splitLiftChecked).filter(Boolean).length + addons.filter(n=>addonChecked[n]).length
    + Object.values(rehabChecked).filter(Boolean).length + flexTotals.reduce((a,t)=>a+t.done,0);
  const pct = workTotal ? Math.min(100, Math.round(workDone/workTotal*100)) : 0;
  const suggestions = suggestionsFor(day.type==="lift" ? day.split : "flex");

  // Guided mode runs the five slots, then any add-ons
  const guidedData = liftData ? { ...liftData, exercises:[...liftData.exercises, ...addons.map(findEx).filter(Boolean)] } : null;
  const guidedChecked = { ...splitLiftChecked, ...Object.fromEntries(addons.map((n,j)=>[5+j, !!addonChecked[n]])) };
  const setGuidedChecked = upd => {
    const next = typeof upd==="function" ? upd(guidedChecked) : upd;
    setSplitLiftChecked(Object.fromEntries(Object.entries(next).filter(([k])=>+k<5)));
    setAddonChecked(c=>({ ...c, ...Object.fromEntries(addons.map((n,j)=>[n, !!next[5+j]])) }));
  };

  const openSwap = (i) => {
    const ex = liftData.exercises[i], cat = ex.cat, color = SLOT_COLOR[cat] || accent;
    setSheet({ kind:"pick", eyebrow:`Slot ${i+1} · ${CAT_LABEL[cat]}`, title:`Swap ${CAT_LABEL[cat]}`, sub:<>Replacing <b>{ex.name}</b></>, color,
      primary:{ label:CAT_LABEL[cat].toUpperCase(), names:(day.split==="A"?LIFTING_A:LIFTING_B).exercises.filter(e=>e.cat===cat).map(e=>e.name) },
      onPick:name=>{ chooseLift(i,name); setSheet(null); toast(name===ex.name ? `Kept ${name}` : `Swapped in ${name}`); } });
  };
  const openFlexSwap = (pid, i) => {
    const pool = FLEX_POOLS[pid], ex = flexExercises[pid][i];
    setSheet({ kind:"pick", eyebrow:pool.label, title:"Swap exercise", sub:<>Replacing <b>{ex.name}</b></>, color:pool.color,
      primary:{ label:pool.label, names:pool.exercises.map(e=>e.name) },
      onPick:name=>{ chooseFlex(pid,i,name); setSheet(null); toast(`Swapped in ${name}`); } });
  };
  const openAdd = () => setSheet({ kind:"pick", eyebrow:"Library", title:"Add to today", sub:"Anything you pick joins today's workout as an add-on.", color:accent, primary:null,
    onPick:name=>{ addToToday(name); setSheet(null); } });

  const bg = theme==="midnight" ? "#0a0e18" : C.bg;

  return (
    <AppCtx.Provider value={appCtx}>
    <DemoContext.Provider value={openDemo}>
      {demo && <DemoViewer name={demo.name} color={demo.color||C.yellow} onClose={()=>setDemo(null)}/>}
      {showCinematic && cinematicData && <SessionCinematic data={cinematicData} onDone={handleCinematicDone}/>}
      {showRPE && <RPECapture onSubmit={handleRPE}/>}
      {guided && guidedData && <LiftWorkoutMode data={{ ...guidedData, color:accent }} checked={guidedChecked} setChecked={setGuidedChecked} onClose={()=>setGuided(false)} onComplete={()=>handleWorkoutComplete(liftData)}/>}
      {sheet?.kind==="pick" && <PickerSheet {...sheet} library={library} inUse={todayNames} onClose={()=>setSheet(null)}/>}
      {sheet?.kind==="new" && <NewExerciseSheet existing={n=>!!findEx(n)} onSave={saveCustom} onClose={()=>setSheet(null)}/>}
      <Toast msg={toastMsg}/>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Barlow:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${bg};overflow-x:hidden;width:100%;}
        button,input,select,textarea{font:inherit;}
        button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,[role="button"]:focus-visible{outline:2px solid ${C.yellow};outline-offset:2px;}
        ::-webkit-scrollbar{width:3px;height:0;}
        ::-webkit-scrollbar-thumb{background:#2a2a2a;border-radius:3px;}
        @keyframes urgentPulse{from{opacity:1;transform:scale(1);}to{opacity:0.72;transform:scale(0.95);}}
        @keyframes cardIn{from{opacity:0;transform:translateY(10px) scale(0.98);}to{opacity:1;transform:translateY(0) scale(1);}}
        @keyframes burst{0%{transform:scale(0.5);opacity:0.8;}100%{transform:scale(2.5);opacity:0;}}
        @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
        @keyframes musclePulse{0%,100%{opacity:0.6;}50%{opacity:1;}}
        @keyframes sheetRise{from{transform:translateY(40px);opacity:0;}to{transform:none;opacity:1;}}
        @media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important;}}
      `}</style>
      <div style={{ minHeight:"100vh", maxWidth:"480px", margin:"0 auto", padding:"0 16px 120px", overflowX:"hidden", color:UI.ink,
        background:tab==="today" ? `radial-gradient(120% 340px at 50% -60px, ${accent}26, transparent 70%), ${bg}` : bg }}>

        {tab==="today" && <>
          <TodayHeader title={title} accent={accent} pct={pct} eyebrow={`${today}${day.type==="lift"?"":" · flex"}`} override={dayOverride} scheduledLabel={scheduledLabel}
            onSetOverride={setDayOverride} theme={theme} onTheme={()=>setTheme(t=>t==="midnight"?"black":"midnight")}/>
          {!pulseDismissed && coachPulse && <div style={{ marginTop:"16px" }}><CoachPulseBrief pulse={coachPulse} onDismiss={dismissPulse}/></div>}

          {liftData && <>
            <SectionHead title="Lift" aside={`${liftData.exercises.length} slots${addons.length?` + ${addons.length} add-on${addons.length>1?"s":""}`:""}`}/>
            <ScienceCue category={liftData.categories[getDaySeed("cue") % liftData.categories.length]} color={accent}/>
            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              {liftData.exercises.map((ex,i)=>{
                const color = SLOT_COLOR[ex.cat] || accent;
                return <ExCard key={i} ex={ex} color={color} done={!!splitLiftChecked[i]} onTap={()=>openSwap(i)}
                  tag={<Tag color={color}>{CAT_LABEL[ex.cat]}</Tag>} hint={<Tag color={UI.ink3}>· tap to swap</Tag>}
                  right={<CheckBtn on={!!splitLiftChecked[i]} color={color} label={ex.name} onToggle={()=>setSplitLiftChecked(c=>({...c,[i]:!c[i]}))}/>}/>;
              })}
            </div>
          </>}

          {day.type==="flex" && <>
            <SectionHead title={day.isWeekend ? "Choose your day" : "Core & stability"} aside="tap a move to swap"/>
            {day.isWeekend && <p style={body({ fontSize:"14px", color:UI.ink2, margin:"-2px 0 10px", lineHeight:1.5 })}>Rest, yoga, or open any set below. Full rest is a real option: sleep, eat well, let it rebuild.</p>}
            {!day.isWeekend && <p style={body({ fontSize:"14px", color:UI.ink2, margin:"-2px 0 10px", lineHeight:1.5 })}>Yoga today, plus this core set.</p>}
            {flexPoolIds.map(pid=>{
              const pool = FLEX_POOLS[pid], exs = flexExercises[pid], chk = flexChecked[pid]||{};
              const done = exs.filter((_,i)=>chk[i]).length;
              return (
                <Fold key={pid} eyebrow={pool.label} title={`${exs.length} moves`} color={pool.color} count={`${done}/${exs.length}`} open={!!open[pid] || !day.isWeekend} onToggle={()=>setOpen(o=>({ ...o, [pid]:!o[pid] }))}>
                  {exs.map((ex,i)=><ExCard key={i} ex={ex} color={pool.color} done={!!chk[i]} onTap={()=>openFlexSwap(pid,i)}
                    right={<CheckBtn on={!!chk[i]} color={pool.color} label={ex.name} onToggle={()=>setFlexChecked(f=>({ ...f, [pid]:{ ...(f[pid]||{}), [i]:!(f[pid]||{})[i] } }))}/>}/>)}
                </Fold>
              );
            })}
          </>}

          {addons.length>0 && <>
            {!liftData && <SectionHead title="Add-ons" aside={`${addons.length} added`}/>}
            <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginTop:liftData?"8px":0 }}>
              {addons.map(n=>{
                const ex = findEx(n); if (!ex) return null;
                const color = exColor(ex);
                return <ExCard key={n} ex={ex} color={color} done={!!addonChecked[n]} onTap={()=>openDemo(n, color)} tag={<Tag color={C.yellow}>Add-on</Tag>}
                  right={<><CheckBtn on={!!addonChecked[n]} color={color} label={n} onToggle={()=>setAddonChecked(c=>({ ...c, [n]:!c[n] }))}/><IconBtn onClick={()=>removeAddon(n)} label={`Remove ${n}`}><XIcon/></IconBtn></>}/>;
              })}
            </div>
          </>}

          <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginTop:"10px" }}>
            <button onClick={openAdd} style={btnStyle("ghost", accent)}>+ Add any exercise</button>
            {liftData && <button onClick={()=>setGuided(true)} style={btnStyle("solid", accent)}>▶ Start guided workout</button>}
          </div>

          <SectionHead title="Add-ons for today" aside="from your extras"/>
          <SuggestRail names={suggestions} onAdd={addToToday}/>

          <div style={{ marginTop:"18px" }}>
            <Fold eyebrow="Daily · before lifting" title="Shoulder rehab" color={C.purple} count={`${Object.values(rehabChecked).filter(Boolean).length}/${REHAB.length}`} open={open.rehab} onToggle={()=>setOpen(o=>({ ...o, rehab:!o.rehab }))}>
              {REHAB.map((ex,i)=><ExCard key={i} ex={LIB_INDEX[ex.name]||ex} color={C.purple} done={!!rehabChecked[i]} onTap={()=>openDemo(ex.name, C.purple)}
                right={<CheckBtn on={!!rehabChecked[i]} color={C.purple} label={ex.name} onToggle={()=>setRehabChecked(c=>({ ...c, [i]:!c[i] }))}/>}/>)}
            </Fold>
          </div>
        </>}

        {tab==="hiit" && <div style={{ paddingTop:"calc(env(safe-area-inset-top) + 18px)" }}>
          <div style={{ marginBottom:"20px" }}>
            <p style={mono({ fontSize:"10px", letterSpacing:"0.2em", color:C.yellow, textTransform:"uppercase", marginBottom:"4px" })}>HIIT SNACKS</p>
            <h2 style={cond({ fontSize:"32px", color:C.yellow, textShadow:`0 0 30px ${C.yellow}55` })}>3 MICRO-SESSIONS</h2>
            <p style={body({ fontSize:"14px", color:"#888", marginTop:"8px", lineHeight:1.6 })}>{impactMode==="low"?"Low-impact only":impactMode==="mixed"?"High + low mixed":"High-impact aerobic"} · unique per snack · 1 min each</p>
            <p style={mono({ fontSize:"11px", color:"#555", marginTop:"6px" })}>Tap ⛶ for fullscreen mode</p>
          </div>
          <ImpactPicker mode={impactMode} onSet={setImpactMode}/>
          {SNACK_CONFIG.map((cfg,i)=>(
            <SnackCard key={cfg.id} config={cfg} exercises={hiitExercises[i]} options={hiitSpare} onSwap={(ei,name)=>swapHiit(i,ei,name)}
              timerState={timerStates[cfg.id]}
              setTimerState={updater=>setTimerStates(s=>({...s,[cfg.id]:typeof updater==="function"?updater(s[cfg.id]):updater}))}
            />
          ))}
        </div>}

        {tab==="library" && <LibraryView library={library} onNew={()=>setSheet({ kind:"new" })}/>}

        {tab==="progress" && <>
          <header style={{ paddingTop:"calc(env(safe-area-inset-top) + 18px)", paddingBottom:"4px" }}>
            <Tag color={UI.ink3}>Streaks, records, effort</Tag>
            <h1 style={cond({ fontSize:"44px", color:C.teal, textShadow:`0 0 30px ${C.teal}66`, marginTop:"4px" })}>Progress</h1>
          </header>
          <SectionHead title="12-week momentum" aside="active days / week"/>
          <MomentumChart/>
          <SectionHead title="This week"/>
          <WeekStats/>
          <SectionHead title="Personal records" aside="log in any exercise"/>
          <PRProofBoard prWeights={prWeights}/>
          <SectionHead title="Backup"/>
          <BackupCard custom={custom} overrides={overrides} prWeights={prWeights} onRestore={restoreBackup} toast={toast}/>
        </>}

        {tab==="habits" && <>
          <header style={{ paddingTop:"calc(env(safe-area-inset-top) + 18px)", paddingBottom:"14px" }}>
            <Tag color={UI.ink3}>Every day</Tag>
            <h1 style={cond({ fontSize:"44px", color:C.blue, textShadow:`0 0 30px ${C.blue}66`, marginTop:"4px" })}>Habits</h1>
          </header>
          <DailyWisdom/>
          <DailyLog checked={dailyChecked} setChecked={setDailyChecked}/>
          <SupplementsSection checked={stackChecked} setChecked={setStackChecked}/>
        </>}
      </div>
      <TabBar tab={tab} onTab={t=>{ setTab(t); window.scrollTo(0,0); }}/>
    </DemoContext.Provider>
    </AppCtx.Provider>
  );
}
