import { useState, useEffect, useRef, useMemo } from "react";

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
const AEROBIC_POOL = ["Jumping Jacks","High Knees","Stair Jumps","Side Skaters","Squat Jumps","Mountain Climbers","Jump Rope","Side Jump Lunges","Butt Kicks"];

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

function MuscleMap({ activeMuscles, color }) {
  return (
    <div style={{ display:"flex", gap:"16px", justifyContent:"center", margin:"16px 0 8px" }}>
      {["front","back"].map(side => (
        <div key={side} style={{ textAlign:"center" }}>
          <svg width="60" height="130" viewBox="0 0 100 130">
            <path d={HEAD} fill="#1e1e1e" stroke="#2a2a2a" strokeWidth="1"/>
            <path d={BODY_OUTLINE} fill="#1e1e1e" stroke="#2a2a2a" strokeWidth="1"/>
            {activeMuscles.map(m => { const d = MUSCLE_REGIONS[m]?.[side]; return d ? <path key={m} d={d} fill={color} opacity="0.75" style={{ filter:`drop-shadow(0 0 4px ${color}88)` }}/> : null; })}
          </svg>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"8px", color:"#444", letterSpacing:"0.1em", textTransform:"uppercase", marginTop:"2px" }}>{side}</div>
        </div>
      ))}
    </div>
  );
}

function StreakFlame({ streak }) {
  const intensity = Math.min(streak / 7, 1);
  const flameColor = streak === 0 ? "#333" : streak < 3 ? "#FF6B35" : streak < 7 ? "#FF3D1F" : "#FFB800";
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"2px" }}>
      <div style={{ fontSize:`${18+intensity*8}px`, lineHeight:1, filter:streak>0?`drop-shadow(0 0 ${8+intensity*16}px ${flameColor})`:"none", transition:"all 0.5s", opacity:streak===0?0.25:1 }}>🔥</div>
      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:streak===0?"#333":flameColor, letterSpacing:"0.1em", fontWeight:700 }}>{streak}d</span>
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
const dealHiit = () => { const nine = pick(AEROBIC_POOL, 9, "hiit"); return [nine.slice(0,3), nine.slice(3,6), nine.slice(6,9)]; };

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
    <div style={{ position:"absolute", top:"16px", right:"16px", background:`${color}14`, border:`1px solid ${color}44`, borderRadius:"20px", padding:"4px 12px", display:"flex", alignItems:"center", gap:"6px" }}>
      <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:color, boxShadow:`0 0 6px ${color}` }}/>
      <span style={mono({ fontSize:"10px", color, letterSpacing:"0.12em" })}>COMPLETE</span>
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
        <div style={{ flex:1 }}>
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
  return (
    <div style={{ position:"fixed", inset:0, zIndex:999, background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 28px", maxWidth:"480px", margin:"0 auto" }}>
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", background:`radial-gradient(ellipse at 50% 35%,${config.color}${t.running?"1a":"0a"} 0%,transparent 60%)`, transition:"background 0.6s" }}/>
      <button onClick={onClose} style={{ position:"absolute", top:"24px", left:"20px", ...mono({ fontSize:"11px", letterSpacing:"0.1em" }), background:"transparent", border:`1px solid ${C.muted}`, color:C.soft, borderRadius:"8px", padding:"7px 16px", cursor:"pointer" }}>← BACK</button>
      <div style={{ textAlign:"center", marginBottom:"16px", zIndex:1 }}>
        <p style={mono({ fontSize:"10px", color:config.color, letterSpacing:"0.25em", marginBottom:"8px" })}>{config.label}</p>
        <h1 style={cond({ fontSize:"38px", color:config.color, textShadow:`0 0 40px ${config.color}66` })}>{config.name}</h1>
      </div>
      <div style={{ zIndex:1, textAlign:"center", marginBottom:"40px" }}>
        {exercises.map((ex,i)=>(
          <div key={i} style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <span style={mono({ fontSize:"10px", color:C.muted })}>{i+1}</span>
            <span style={{ ...body({ fontSize:"18px", fontWeight:500, transition:"color 0.3s" }), color:t.running?"#aaa":C.soft, flex:1, lineHeight:2.1 }}>{ex}</span>
            <button onClick={()=>speakEx(ex)} style={{ ...mono({ fontSize:"13px" }), width:"28px", height:"28px", borderRadius:"50%", border:`1px solid ${config.color}22`, background:"transparent", color:config.color+"55", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, padding:0, lineHeight:1 }}>🔊</button>
          </div>
        ))}
      </div>
      <div style={{ zIndex:1, textAlign:"center", marginBottom:"16px" }}>
        {t.done ? (
          <><div style={cond({ fontSize:"80px", color:config.color, textShadow:`0 0 60px ${config.color}88`, lineHeight:1 })}>DONE</div><p style={body({ fontSize:"15px", color:"#777", marginTop:"12px" })}>Great work. Rest up.</p></>
        ) : (
          <div style={{ display:"flex", alignItems:"baseline", justifyContent:"center", gap:"2px" }}>
            <span style={cond({ fontSize:urgent?"124px":"104px", color:t.running?config.color:"#ccc", textShadow:t.running?`0 0 60px ${config.color}${urgent?"bb":"44"}`:"none", lineHeight:1, transition:"font-size 0.12s,color 0.3s", animation:urgent?"urgentPulse 0.35s ease-in-out infinite alternate":"none" })}>{t.mins}</span>
            <span style={cond({ fontSize:"64px", color:C.muted, lineHeight:1, marginBottom:"8px" })}>:</span>
            {t.secs.toString().padStart(2,"0").split("").map((d,i)=>(
              <span key={`${i}-${d}`} style={cond({ fontSize:urgent?"124px":"104px", color:t.running?config.color:"#ccc", textShadow:t.running?`0 0 60px ${config.color}${urgent?"bb":"44"}`:"none", lineHeight:1, transition:"font-size 0.12s", animation:urgent?`urgentPulse 0.35s ${i*0.07}s ease-in-out infinite alternate`:"none" })}>{d}</span>
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
      <div style={{ padding:"24px 20px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", zIndex:1 }}>
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
        <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"0 28px 28px", zIndex:1 }}>
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
            <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center" }}>
              <p style={mono({ fontSize:"10px", color:data.color, letterSpacing:"0.25em", marginBottom:"12px" })}>EXERCISE {idx+1} OF {data.exercises.length}</p>
              <h1 style={cond({ fontSize:"42px", color:data.color, lineHeight:1.1, textShadow:`0 0 40px ${data.color}55`, marginBottom:"16px" })}>{ex.name}</h1>
              <span style={{ ...mono({ fontSize:"13px", color:C.text }), background:`${data.color}18`, border:`1px solid ${data.color}33`, borderRadius:"8px", padding:"6px 14px", display:"inline-block", marginBottom:"16px" }}>{ex.sets}</span>
              <p style={body({ fontSize:"15px", color:"#888", lineHeight:1.7, fontStyle:"italic" })}>{ex.note}</p>
              <button onClick={()=>speakEx(ex.name,ex.note)} style={{ ...mono({ fontSize:"11px" }), marginTop:"10px", padding:"6px 16px", borderRadius:"8px", border:`1px solid ${data.color}28`, background:"transparent", color:data.color+"66", cursor:"pointer", display:"inline-flex", alignItems:"center", gap:"6px" }}>🔊 <span>HEAR CUES</span></button>
              <MuscleMap activeMuscles={ex.muscles||[]} color={data.color}/>
            </div>
          )}
          <div style={{ display:"flex", gap:"10px" }}>
            {idx>0&&<button onClick={()=>setIdx(i=>i-1)} style={{ ...smallBtn(C.muted,false), flex:1 }}>← PREV</button>}
            <button onClick={markAndNext} style={{ ...bigBtn(data.color,false), flex:2, padding:"16px 0" }}>{supersetMode&&nextEx?"DONE BOTH ✓":checked[idx]?"NEXT →":"DONE ✓"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SnackCard({ config, exercises, timerState, setTimerState }) {
  const [activeMode,setActiveMode] = useState(false);
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
          <div key={i} style={{ display:"flex", gap:"10px", alignItems:"center", padding:"6px 0", borderBottom:i<2?`1px solid ${C.dim}`:"none" }}>
            <span style={mono({ fontSize:"10px", color:C.muted, minWidth:"14px" })}>{i+1}</span>
            <span style={{ ...body({ fontSize:"15px", color:"#c8c8c8", fontWeight:500 }), flex:1 }}>{ex}</span>
            <button onClick={()=>speakEx(ex)} style={{ ...mono({ fontSize:"13px" }), width:"26px", height:"26px", borderRadius:"50%", border:`1px solid ${config.color}22`, background:"transparent", color:config.color+"55", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, padding:0, lineHeight:1 }}>🔊</button>
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

function LiftingSection({ data, checked, setChecked, onSwap, onChoose, onComplete }) {
  const [workoutMode,setWorkoutMode] = useState(false);
  const [collapsed,setCollapsed] = useState(false);
  const [optOpen,setOptOpen] = useState(null);
  const done = data.exercises.filter((_,i)=>checked[i]).length;
  const allDone = done===data.exercises.length;
  const activeMuscles = [...new Set(data.exercises.flatMap(e=>e.muscles||[]))];
  const cueCat = data.categories[getDaySeed("cue") % data.categories.length];
  if(workoutMode) return <LiftWorkoutMode data={data} checked={checked} setChecked={setChecked} onClose={()=>setWorkoutMode(false)} onComplete={onComplete}/>;
  return (
    <div style={cardBase(data.color,allDone)}>
      {allDone&&<DoneBadge color={data.color}/>}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", cursor:"pointer" }} onClick={()=>setCollapsed(c=>!c)}>
        <div>
          <p style={mono({ fontSize:"10px", letterSpacing:"0.2em", color:data.color, textTransform:"uppercase", marginBottom:"4px" })}>TODAY'S LIFT</p>
          <h2 style={cond({ fontSize:"24px", color:allDone?data.color+"77":data.color, textShadow:`0 0 20px ${data.color}${allDone?"18":"44"}`, transition:"all 0.4s" })}>{data.label}</h2>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"10px", marginTop:"4px" }}>
          <ArcRing pct={Math.round((done/data.exercises.length)*100)} color={data.color} size={52}/>
          <span style={mono({ fontSize:"14px", color:collapsed?data.color:C.muted, transition:"color 0.2s" })}>{collapsed?"▼":"▲"}</span>
        </div>
      </div>
      {!collapsed&&<>
        <p style={mono({ fontSize:"11px", color:"#777", margin:"10px 0 14px" })}>5 of {data.pool.length} · randomized · tap ⟳ for options · {done}/{data.exercises.length} done</p>
        <MuscleMap activeMuscles={activeMuscles} color={data.color}/>
        <p style={mono({ fontSize:"9px", color:"#444", letterSpacing:"0.1em", textAlign:"center", marginBottom:"14px" })}>MUSCLES TODAY</p>
        <ScienceCue category={cueCat} color={data.color}/>
        {data.exercises.map((ex,i)=>(
          <div key={i}>
            <SwipeRow label={ex.name} sublabel={`${ex.sets} · ${ex.note}`} checked={!!checked[i]} onToggle={()=>setChecked(c=>({...c,[i]:!c[i]}))} onSwap={(onChoose||onSwap)&&(()=>setOptOpen(o=>o===i?null:i))} onAudio={()=>speakEx(ex.name,ex.note)} color={data.color} isLast={i===data.exercises.length-1&&optOpen!==i}/>
            {optOpen===i&&onChoose&&(
              <OptionScroller options={data.pool.filter(e=>e.cat===ex.cat)} current={ex.name} color={data.color}
                onPick={name=>{onChoose(i,name);setOptOpen(null);}}/>
            )}
          </div>
        ))}
        <button onClick={()=>setWorkoutMode(true)} style={{ ...smallBtn(data.color,false), width:"100%", marginTop:"16px", padding:"12px" }}>▶ GUIDED WORKOUT MODE</button>
      </>}
    </div>
  );
}

// ── Flex Pool Accordion Section ───────────────────────────────────────────────
function FlexPoolCard({ pool, checked, setChecked, exercises, open, onToggle, onSwap }) {
  const done = exercises.filter((_,i)=>checked[i]).length;
  const allDone = done===exercises.length;
  return (
    <div style={{ ...cardBase(pool.color,allDone), marginBottom:"8px", padding:"0" }}>
      {/* Accordion header */}
      <div onClick={onToggle} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 18px", cursor:"pointer" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <span style={{ fontSize:"16px", opacity:0.7 }}>{pool.icon}</span>
          <div>
            <p style={mono({ fontSize:"9px", letterSpacing:"0.15em", color:pool.color, marginBottom:"2px" })}>{pool.label}</p>
            {open && <p style={mono({ fontSize:"10px", color:"#555" })}>{done}/{exercises.length} done</p>}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          {allDone&&<div style={{ width:"6px", height:"6px", borderRadius:"50%", background:pool.color, boxShadow:`0 0 6px ${pool.color}` }}/>}
          <span style={mono({ fontSize:"12px", color:open?pool.color:C.muted, transition:"color 0.2s" })}>{open?"▲":"▼"}</span>
        </div>
      </div>
      {/* Accordion body */}
      {open&&(
        <div style={{ padding:"0 18px 18px", borderTop:`1px solid ${C.dim}` }}>
          <p style={mono({ fontSize:"10px", color:"#555", letterSpacing:"0.1em", margin:"12px 0 10px" })}>5 OF {pool.exercises.length} · RANDOMIZED TODAY</p>
          {exercises.map((ex,i)=>(
            <SwipeRow key={i} label={ex.name} sublabel={`${ex.sets} · ${ex.note}`} checked={!!checked[i]} onToggle={()=>setChecked(c=>({...c,[i]:!c[i]}))} onSwap={onSwap&&(()=>onSwap(i))} color={pool.color} isLast={i===exercises.length-1}/>
          ))}
        </div>
      )}
    </div>
  );
}

function YogaCard({ open, onToggle }) {
  return (
    <div style={{ ...cardBase(C.purple,false), marginBottom:"8px", padding:"0" }}>
      <div onClick={onToggle} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 18px", cursor:"pointer" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <span style={{ fontSize:"16px", opacity:0.7 }}>☽</span>
          <div>
            <p style={mono({ fontSize:"9px", letterSpacing:"0.15em", color:C.purple, marginBottom:"2px" })}>YOGA</p>
          </div>
        </div>
        <span style={mono({ fontSize:"12px", color:open?C.purple:C.muted })}>{open?"▲":"▼"}</span>
      </div>
      {open&&(
        <div style={{ padding:"0 18px 18px", borderTop:`1px solid ${C.dim}` }}>
          <p style={body({ fontSize:"14px", color:"#666", fontStyle:"italic", lineHeight:1.7, marginTop:"14px" })}>Yoga content coming soon — poses, flows, and guided sessions will live here.</p>
        </div>
      )}
    </div>
  );
}

function RestCard({ open, onToggle }) {
  return (
    <div style={{ ...cardBase(C.muted,false), marginBottom:"8px", padding:"0" }}>
      <div onClick={onToggle} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 18px", cursor:"pointer" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <span style={{ fontSize:"16px", opacity:0.5 }}>◌</span>
          <p style={mono({ fontSize:"9px", letterSpacing:"0.15em", color:"#555" })}>REST / RECOVERY</p>
        </div>
        <span style={mono({ fontSize:"12px", color:open?"#555":C.muted })}>{open?"▲":"▼"}</span>
      </div>
      {open&&(
        <div style={{ padding:"0 18px 18px", borderTop:`1px solid ${C.dim}` }}>
          <p style={body({ fontSize:"14px", color:"#555", fontStyle:"italic", lineHeight:1.7, marginTop:"14px" })}>Full rest. No structured movement. Prioritize sleep, nutrition, and recovery. Let the body do its work.</p>
        </div>
      )}
    </div>
  );
}

// Wed: Yoga + Core & Stability
function WedFlexDay({ flexChecked, setFlexChecked, flexExercises, onFlexSwap }) {
  const [openSection, setOpenSection] = useState(null);
  const toggle = id => setOpenSection(o => o===id ? null : id);
  return (
    <>
      <p style={mono({ fontSize:"10px", letterSpacing:"0.2em", color:"#555", textTransform:"uppercase", marginBottom:"12px" })}>WEDNESDAY · YOGA + CORE</p>
      <YogaCard open={openSection==="yoga"} onToggle={()=>toggle("yoga")}/>
      <FlexPoolCard
        pool={FLEX_POOLS.core} checked={flexChecked.core||{}} setChecked={c=>setFlexChecked(f=>({...f,core:typeof c==="function"?c(f.core||{}):c}))}
        exercises={flexExercises.core} open={openSection==="core"} onToggle={()=>toggle("core")}
        onSwap={onFlexSwap&&(i=>onFlexSwap("core",i))}
      />
    </>
  );
}

// Sat/Sun: Choose Your Day
const WEEKEND_OPTIONS = ["rest","yoga","core","mobility","functional","mindbody","cardio"];
function WeekendFlexDay({ flexChecked, setFlexChecked, flexExercises, onFlexSwap }) {
  const [openSection, setOpenSection] = useState(null);
  const toggle = id => setOpenSection(o => o===id ? null : id);
  return (
    <>
      <p style={mono({ fontSize:"10px", letterSpacing:"0.2em", color:"#555", textTransform:"uppercase", marginBottom:"12px" })}>CHOOSE YOUR DAY</p>
      <RestCard open={openSection==="rest"} onToggle={()=>toggle("rest")}/>
      <YogaCard open={openSection==="yoga"} onToggle={()=>toggle("yoga")}/>
      {Object.values(FLEX_POOLS).map(pool=>(
        <FlexPoolCard key={pool.id}
          pool={pool} checked={flexChecked[pool.id]||{}} setChecked={c=>setFlexChecked(f=>({...f,[pool.id]:typeof c==="function"?c(f[pool.id]||{}):c}))}
          exercises={flexExercises[pool.id]} open={openSection===pool.id} onToggle={()=>toggle(pool.id)}
          onSwap={onFlexSwap&&(i=>onFlexSwap(pool.id,i))}
        />
      ))}
    </>
  );
}

function RehabSection({ checked, setChecked, open, setOpen }) {
  const done = REHAB.filter((_,i)=>checked[i]).length;
  const allDone = done===REHAB.length;
  return (
    <div style={cardBase(C.purple,allDone)}>
      {allDone&&<DoneBadge color={C.purple}/>}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <p style={mono({ fontSize:"10px", letterSpacing:"0.2em", color:C.purple, textTransform:"uppercase", marginBottom:"4px" })}>DAILY PROTOCOL</p>
          <h2 style={cond({ fontSize:"22px", color:allDone?C.purple+"77":C.purple, marginBottom:"4px", textShadow:`0 0 20px ${C.purple}${allDone?"18":"44"}`, transition:"all 0.4s" })}>SHOULDER REHAB</h2>
          <p style={mono({ fontSize:"11px", color:"#777" })}>AC joint · before lifting · {done}/{REHAB.length} done</p>
        </div>
        <button onClick={()=>setOpen(o=>!o)} style={{ ...mono({ fontSize:"10px", letterSpacing:"0.1em" }), background:"transparent", border:`1px solid ${C.purple}33`, color:C.purple+"88", borderRadius:"7px", padding:"7px 14px", cursor:"pointer" }}>{open?"HIDE":"SHOW"}</button>
      </div>
      {open&&<div style={{ marginTop:"16px" }}>
        {REHAB.map((ex,i)=><SwipeRow key={i} label={ex.name} sublabel={`${ex.sets} · ${ex.note}`} checked={!!checked[i]} onToggle={()=>setChecked(c=>({...c,[i]:!c[i]}))} onAudio={()=>speakEx(ex.name,ex.note)} color={C.purple} isLast={i===REHAB.length-1}/>)}
      </div>}
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

function Pill({ label, active, onClick }) {
  return <button onClick={onClick} style={{ ...mono({ fontSize:"10px", letterSpacing:"0.12em", fontWeight:700 }), padding:"6px 14px", borderRadius:"20px", border:`1px solid ${active?C.yellow:C.muted}`, background:active?C.yellow:"transparent", color:active?"#000":C.soft, cursor:"pointer", transition:"all 0.2s", whiteSpace:"nowrap" }}>{label}</button>;
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
      <p style={body({ fontSize:"13px", color:"#555", fontStyle:"italic" })}>No PRs logged yet — coming soon when set-logging lands.</p>
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

// ── Urgency badge + ExtrasPoolCard ────────────────────────────────────────────
const URGENCY_COLORS = { CRITICAL:C.red, HIGH:C.orange, MEDIUM:C.teal };
function UrgencyBadge({ level }) {
  const c = URGENCY_COLORS[level]||C.muted;
  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:"5px", background:`${c}18`, border:`1px solid ${c}33`, borderRadius:"20px", padding:"3px 10px" }}>
      <div style={{ width:"4px", height:"4px", borderRadius:"50%", background:c, boxShadow:`0 0 5px ${c}` }}/>
      <span style={mono({ fontSize:"9px", color:c, letterSpacing:"0.1em" })}>{level}</span>
    </div>
  );
}

function ExtrasPoolCard({ pool, checked, setChecked, open, onToggle }) {
  const done = pool.exercises.filter((_,i)=>checked[i]).length;
  const allDone = done===pool.exercises.length;
  return (
    <div style={{ ...cardBase(pool.color, allDone), marginBottom:"8px", padding:0 }}>
      <div onClick={onToggle} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 18px", cursor:"pointer" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <span style={{ fontSize:"16px", opacity:0.7 }}>{pool.icon}</span>
          <div>
            <p style={mono({ fontSize:"9px", letterSpacing:"0.15em", color:pool.color, marginBottom:"4px" })}>{pool.label}</p>
            <div style={{ display:"flex", gap:"6px", alignItems:"center", flexWrap:"wrap" }}>
              <UrgencyBadge level={pool.urgency}/>
              {pool.shoulderSafe&&<span style={mono({ fontSize:"8px", color:C.teal })}>🛡 SHOULDER SAFE</span>}
            </div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          {open&&<span style={mono({ fontSize:"10px", color:C.soft })}>{done}/{pool.exercises.length}</span>}
          {allDone&&<div style={{ width:"6px", height:"6px", borderRadius:"50%", background:pool.color, boxShadow:`0 0 6px ${pool.color}` }}/>}
          <span style={mono({ fontSize:"12px", color:open?pool.color:C.muted })}>{open?"▲":"▼"}</span>
        </div>
      </div>
      {open&&(
        <div style={{ padding:"0 18px 18px", borderTop:`1px solid ${C.dim}` }}>
          <p style={body({ fontSize:"13px", color:"#666", fontStyle:"italic", lineHeight:1.6, marginTop:"12px", marginBottom:"12px" })}>{pool.note}</p>
          {pool.exercises.map((ex,i)=>(
            <SwipeRow key={i} label={ex.name} sublabel={`${ex.sets} · ${ex.note}`}
              checked={!!checked[i]} onToggle={()=>setChecked(c=>({...c,[i]:!c[i]}))}
              onAudio={()=>speakEx(ex.name,ex.note)}
              color={pool.color} isLast={i===pool.exercises.length-1}/>
          ))}
        </div>
      )}
    </div>
  );
}

// ── WorkoutPicker — override the scheduled day, train what you want ──────────
function WorkoutPicker({ override, onSet, scheduledLabel }) {
  const opts = [
    { id:null,   label:"AUTO",        c:C.soft   },
    { id:"A",    label:"ARMS/CHEST",  c:C.yellow },
    { id:"B",    label:"LEGS/BACK",   c:C.teal   },
    { id:"flex", label:"FLEX",        c:C.orange },
  ];
  return (
    <div style={{ marginBottom:"14px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"8px" }}>
        <p style={mono({ fontSize:"9px", letterSpacing:"0.2em", color:"#555" })}>TODAY'S SESSION</p>
        {override!==null&&<span style={mono({ fontSize:"8px", color:C.orange, letterSpacing:"0.1em" })}>OVERRIDE · scheduled: {scheduledLabel}</span>}
      </div>
      <div style={{ display:"flex", gap:"6px", overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
        {opts.map(o=>{
          const active = override===o.id;
          return (
            <button key={String(o.id)} onClick={()=>onSet(o.id)}
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
  { id:"today",  label:"TODAY"  },
  { id:"hiit",   label:"HIIT"   },
  { id:"lift",   label:"LIFT"   },
  { id:"rehab",  label:"REHAB"  },
  { id:"extras", label:"EXTRAS" },
  { id:"stack",  label:"STACK"  },
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

// ── HIIT usage — weekly reset, keyed by Monday's date ────────────────────────
const getMondayKey = () => {
  const d = new Date();
  const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return `cw-hiit-${mon.getFullYear()}-${mon.getMonth()+1}-${mon.getDate()}`;
};
const readHiitUsage = () => { try { return JSON.parse(localStorage.getItem(getMondayKey()) || "[]"); } catch { return []; } };
const writeHiitUsage = (val) => { try { localStorage.setItem(getMondayKey(), JSON.stringify(val)); } catch {} };
function useHiitUsage() {
  const [usage, setUsageState] = useState(readHiitUsage);
  const setUsage = (updater) => {
    setUsageState(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      writeHiitUsage(next);
      return next;
    });
  };
  return [usage, setUsage];
}

// ── Streak — consecutive days with ≥5/7 daily log items checked ──────────────
const calcStreak = () => {
  let streak = 0;
  const base = new Date();
  for (let i = 0; i <= 365; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    const key = `cw-${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}-daily`;
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) break;
      const data = JSON.parse(raw);
      const checked = Object.values(data).filter(Boolean).length;
      if (checked >= 5) streak++;
      else break;
    } catch { break; }
  }
  return streak;
};

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

  // ── Persisted state — survives app close, auto-resets at midnight ──
  const [dailyChecked, setDailyChecked] = usePersisted("daily", {});
  const [rehabChecked, setRehabChecked] = usePersisted("rehab", {});
  const [stackChecked, setStackChecked] = usePersisted("stack", {});
  const [liftChecked,  setLiftChecked]  = usePersisted("lift",  {});
  const [flexChecked,  setFlexChecked]  = usePersisted("flex",  {});
  const [timerStates,  setTimerStates]  = usePersisted("timers",
    SNACK_CONFIG.reduce((acc,cfg)=>({...acc,[cfg.id]:{timeLeft:cfg.duration,running:false,done:false}}),{})
  );
  const [rehabOpen, setRehabOpen] = useState(false);
  const [prWeights, setPRWeights] = usePR();
  const [hiitUsage, setHiitUsage] = useHiitUsage();
  const [extrasChecked, setExtrasChecked] = usePersisted("extras", {});
  const [extrasOpen, setExtrasOpen] = useState(null);
  const [showCinematic, setShowCinematic] = useState(false);
  const [cinematicData, setCinematicData] = useState(null);
  const [showRPE, setShowRPE] = useState(false);
  const coachPulse = useCoachPulse();
  const [pulseDismissed, setPulseDismissed] = useState(false);
  const handleWorkoutComplete = (data) => { setCinematicData(data); setShowCinematic(true); };
  const handleCinematicDone = () => { setShowCinematic(false); setShowRPE(true); };
  const handleRPE = (val) => {
    if (val > 0) {
      const d = new Date();
      const key = `cw-rpe-${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
      try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
    }
    setShowRPE(false);
  };
  const dismissPulse = () => {
    setPulseDismissed(true);
    if (coachPulse?.dismissKey) { try { localStorage.setItem(coachPulse.dismissKey,"1"); } catch {} }
  };

  const [hiitExercises] = useState(()=>dealHiit());

  // Lift: base seeded picks + swap overrides
  const baseLiftPicks = useMemo(()=>{
    if(day.type!=="lift") return null;
    return pickBalanced(day.split==="A"?LIFTING_A:LIFTING_B,"lift"+day.split);
  },[day]);
  const [liftSwaps, setLiftSwaps] = usePersisted("liftSwaps", {});
  const stableLiftData = useMemo(()=>{
    if(!baseLiftPicks) return null;
    const pool = day.split==="A"?LIFTING_A:LIFTING_B;
    const exercises = baseLiftPicks.map((ex,i)=>{
      const n = liftSwaps[`${day.split}-${i}`];
      if(!n) return ex;
      const opts = pool.exercises.filter(e=>e.cat===ex.cat);
      if(typeof n==="string") return opts.find(e=>e.name===n)||ex;
      const base = opts.findIndex(e=>e.name===ex.name);
      return opts[(base+n)%opts.length];
    });
    return { ...pool, exercises, pool:pool.exercises };
  },[baseLiftPicks,liftSwaps,day]);

  // Flex: base seeded picks + swap overrides
  const [baseFlexPicks] = useState(()=>
    Object.fromEntries(Object.values(FLEX_POOLS).map(p=>[p.id, pick(p.exercises,5,p.id)]))
  );
  const [flexSwaps, setFlexSwaps] = usePersisted("flexSwaps", {});
  const flexExercises = useMemo(()=>
    Object.fromEntries(Object.entries(baseFlexPicks).map(([pid,baseExs])=>{
      const pool = FLEX_POOLS[pid];
      return [pid, baseExs.map((ex,i)=>{
        const n = flexSwaps[`${pid}-${i}`]||0;
        if(!n) return ex;
        const base = pool.exercises.findIndex(e=>e.name===ex.name);
        return pool.exercises[(base+n)%pool.exercises.length];
      })];
    }))
  ,[baseFlexPicks,flexSwaps]);

  const clearLiftCheck = i=>setLiftChecked(f=>{const pc={...(f[day.split]||{})};delete pc[i];return{...f,[day.split]:pc};});
  const swapLift = i=>{const k=`${day.split}-${i}`;setLiftSwaps(s=>({...s,[k]:(typeof s[k]==="number"?s[k]:0)+1}));clearLiftCheck(i);};
  const chooseLift = (i,name)=>{const k=`${day.split}-${i}`;setLiftSwaps(s=>({...s,[k]:name}));clearLiftCheck(i);};
  const splitLiftChecked = liftChecked[day.split]||{};
  const setSplitLiftChecked = c=>setLiftChecked(f=>({...f,[day.split]:typeof c==="function"?c(f[day.split]||{}):c}));
  const swapFlex = (pid,i)=>{const k=`${pid}-${i}`;setFlexSwaps(s=>({...s,[k]:(s[k]||0)+1}));setFlexChecked(f=>{const pc={...(f[pid]||{})};delete pc[i];return{...f,[pid]:pc};});};


  const totalItems = DAILY_ITEMS.length + SUPPLEMENTS.length + (stableLiftData?stableLiftData.exercises.length:0) + REHAB.length;
  const totalDone  = Object.values(dailyChecked).filter(Boolean).length + Object.values(stackChecked).filter(Boolean).length + Object.values(splitLiftChecked).filter(Boolean).length + Object.values(rehabChecked).filter(Boolean).length;
  const overallPct = Math.round((totalDone/totalItems)*100);

  const dayLabel = day.type==="lift"
    ? (day.split==="A"?"ARMS / CHEST":"LEGS / BACK")
    : day.isWeekend ? "CHOOSE YOUR DAY" : "YOGA · CORE & STABILITY";
  const dayColor = day.type==="lift"
    ? (day.split==="A"?C.yellow:C.teal)
    : day.isWeekend?C.orange:C.purple;

  return (
    <>
      {showCinematic && cinematicData && <SessionCinematic data={cinematicData} onDone={handleCinematicDone}/>}
      {showRPE && <RPECapture onSubmit={handleRPE}/>}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Barlow:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:#080808;}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-track{background:#080808;}
        ::-webkit-scrollbar-thumb{background:#2a2a2a;border-radius:3px;}
        @keyframes urgentPulse{from{opacity:1;transform:scale(1);}to{opacity:0.72;transform:scale(0.95);}}
        @keyframes cardIn{from{opacity:0;transform:translateY(10px) scale(0.98);}to{opacity:1;transform:translateY(0) scale(1);}}
        ::-webkit-scrollbar:horizontal{height:0;}
      `}</style>
      <div style={{ background:C.bg, minHeight:"100vh", maxWidth:"480px", margin:"0 auto", paddingBottom:"80px" }}>

        <div style={{ padding:"28px 20px 16px", borderBottom:`1px solid ${C.dim}` }}>
          <p style={mono({ fontSize:"11px", color:"#666", letterSpacing:"0.2em", marginBottom:"6px" })}>{today.toUpperCase()}</p>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <p style={cond({ fontSize:"12px", color:C.soft, letterSpacing:"0.4em", marginBottom:"2px" })}>CHARLIE'S</p>
              <h1 style={cond({ fontSize:"46px", color:C.yellow, lineHeight:1, letterSpacing:"0.04em", textShadow:`0 0 40px ${C.yellow}44` })}>WELLNESS</h1>
              <div style={mono({ fontSize:"10px", color:dayColor, letterSpacing:"0.1em", marginTop:"6px" })}>{dayLabel}</div>
            </div>
            <ArcRing pct={overallPct} color={overallPct===100?C.yellow:C.teal} size={80}/>
          </div>
        </div>

        <div style={{ display:"flex", gap:"6px", padding:"12px 20px", borderBottom:`1px solid ${C.dim}`, overflowX:"auto" }}>
          {TABS.map(t=><Pill key={t.id} label={t.label} active={tab===t.id} onClick={()=>setTab(t.id)}/>)}
        </div>

        <div style={{ padding:"16px 20px" }}>
          {tab==="today" && <>
            {!pulseDismissed && coachPulse && <CoachPulseBrief pulse={coachPulse} onDismiss={dismissPulse}/>}
            <WorkoutPicker override={dayOverride} onSet={setDayOverride} scheduledLabel={scheduledLabel}/>
            <DailyWisdom/>
            <DailyLog checked={dailyChecked} setChecked={setDailyChecked}/>
            <RehabSection checked={rehabChecked} setChecked={setRehabChecked} open={rehabOpen} setOpen={setRehabOpen}/>
            {day.type==="lift" && stableLiftData && <LiftingSection data={stableLiftData} checked={splitLiftChecked} setChecked={setSplitLiftChecked} onSwap={swapLift} onChoose={chooseLift} onComplete={()=>handleWorkoutComplete(stableLiftData)}/>}
            {day.type==="flex" && !day.isWeekend && <WedFlexDay flexChecked={flexChecked} setFlexChecked={setFlexChecked} flexExercises={flexExercises} onFlexSwap={swapFlex}/>}
            {day.type==="flex" && day.isWeekend  && <WeekendFlexDay flexChecked={flexChecked} setFlexChecked={setFlexChecked} flexExercises={flexExercises} onFlexSwap={swapFlex}/>}
          </>}

          {tab==="hiit" && <>
            <div style={{ marginBottom:"20px" }}>
              <p style={mono({ fontSize:"10px", letterSpacing:"0.2em", color:C.yellow, textTransform:"uppercase", marginBottom:"4px" })}>HIIT SNACKS</p>
              <h2 style={cond({ fontSize:"32px", color:C.yellow, textShadow:`0 0 30px ${C.yellow}55` })}>3 MICRO-SESSIONS</h2>
              <p style={body({ fontSize:"14px", color:"#888", marginTop:"8px", lineHeight:1.6 })}>Aerobic only · unique per snack · 1 min each</p>
              <p style={mono({ fontSize:"11px", color:"#555", marginTop:"6px" })}>Tap ⛶ for fullscreen mode</p>
            </div>
            {SNACK_CONFIG.map((cfg,i)=>(
              <SnackCard key={cfg.id} config={cfg} exercises={hiitExercises[i]}
                timerState={timerStates[cfg.id]}
                setTimerState={updater=>setTimerStates(s=>({...s,[cfg.id]:typeof updater==="function"?updater(s[cfg.id]):updater}))}
              />
            ))}
          </>}

          {tab==="lift" && <>
            <WorkoutPicker override={dayOverride} onSet={setDayOverride} scheduledLabel={scheduledLabel}/>
            {day.type==="lift"&&stableLiftData
              ? <LiftingSection data={stableLiftData} checked={splitLiftChecked} setChecked={setSplitLiftChecked} onSwap={swapLift} onChoose={chooseLift} onComplete={()=>handleWorkoutComplete(stableLiftData)}/>
              : <div style={cardBase(C.border)}>
                  <p style={mono({ fontSize:"10px", letterSpacing:"0.2em", color:C.muted, textTransform:"uppercase", marginBottom:"4px" })}>LIFTING</p>
                  <h2 style={cond({ fontSize:"22px", color:C.muted })}>{day.isWeekend?"FLEX DAY":"YOGA / CORE DAY"}</h2>
                  <p style={body({ fontSize:"14px", color:"#777", marginTop:"8px" })}>No lifting today. Check the TODAY tab for your options.</p>
                </div>
            }
            <RehabSection checked={rehabChecked} setChecked={setRehabChecked} open={rehabOpen} setOpen={setRehabOpen}/>
          </>}

          {tab==="rehab" && <RehabSection checked={rehabChecked} setChecked={setRehabChecked} open={rehabOpen} setOpen={setRehabOpen}/>}

          {tab==="extras" && <>
            <div style={{ marginBottom:"20px" }}>
              <p style={mono({ fontSize:"10px", letterSpacing:"0.2em", color:C.orange, textTransform:"uppercase", marginBottom:"4px" })}>SUPPLEMENTAL WORK</p>
              <h2 style={cond({ fontSize:"32px", color:C.orange, textShadow:`0 0 30px ${C.orange}55` })}>BODY EXTRAS</h2>
              <p style={body({ fontSize:"14px", color:"#888", marginTop:"8px", lineHeight:1.6 })}>The 15 minutes that compound over years. Add any to any day — all shoulder safe.</p>
            </div>
            {Object.values(EXTRAS_POOLS).map(pool=>(
              <ExtrasPoolCard key={pool.id}
                pool={pool}
                checked={extrasChecked[pool.id]||{}}
                setChecked={c=>setExtrasChecked(f=>({...f,[pool.id]:typeof c==="function"?c(f[pool.id]||{}):c}))}
                open={extrasOpen===pool.id}
                onToggle={()=>setExtrasOpen(o=>o===pool.id?null:pool.id)}
              />
            ))}
          </>}

          {tab==="stack" && <>
            <PRProofBoard prWeights={prWeights}/>
            <SupplementsSection checked={stackChecked} setChecked={setStackChecked}/>
          </>}
        </div>

        <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:"480px", background:"rgba(8,8,8,0.96)", backdropFilter:"blur(16px)", borderTop:`1px solid ${C.dim}`, display:"flex", justifyContent:"space-around", padding:"10px 0 16px" }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{ background:"transparent", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:"4px" }}>
              <div style={{ width:"4px", height:"4px", borderRadius:"50%", background:tab===t.id?C.yellow:"transparent", boxShadow:tab===t.id?`0 0 6px ${C.yellow}`:"none", transition:"all 0.2s" }}/>
              <span style={mono({ fontSize:"10px", letterSpacing:"0.1em", color:tab===t.id?C.yellow:C.muted })}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
