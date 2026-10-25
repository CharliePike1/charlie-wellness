// Animated neon demo figures for exercises without a library photo.
// Each figure is two poses (start "a" -> end "b") built from joint angles, rendered as SVG with SMIL animation.
// Angles: 0 = right, 90 = down, 180 = left, -90 = up. Side view faces right; floor poses put the head on the left.

const SEG = { torso: 64, head: 16, ua: 30, fa: 28, th: 34, sn: 32, ft: 12 };
const GROUND = 186;
const RAD = { head: 11.5, neck: 8.5, hip: 8.5, sh: 5, sh2: 5, el: 5, wr: 4.5, fel: 5, fwr: 4.5, kn: 7, an: 5, to: 3, fkn: 7, fan: 5, fto: 3, hipR: 6, hipL: 6 };

const dir = a => [Math.cos(a * Math.PI / 180), Math.sin(a * Math.PI / 180)];
const step = (p, len, ang) => { const [c, s] = dir(ang); return [p[0] + len * c, p[1] + len * s]; };

function fk(s) {
  const front = !!s.front;
  const m = a => (a === undefined ? undefined : 180 - a);
  const far = (k, nearKey, fallback) => s[k] ?? (front ? m(s[nearKey] ?? fallback) : (s[nearKey] ?? fallback));
  const t = s.t ?? -90, P = {};
  P.hip = [0, 0];
  P.neck = step(P.hip, SEG.torso * (s.tl ?? 1), t);
  P.head = step(P.neck, SEG.head, s.h ?? t);
  if (front) {
    const tilt = s.tilt || 0;
    P.sh = [P.neck[0] + 14, P.neck[1] + 8];
    P.sh2 = [P.neck[0] - 14, P.neck[1] + 8];
    P.hipR = step(P.hip, 10, tilt);
    P.hipL = step(P.hip, 10, 180 + tilt);
  } else {
    P.sh = step(P.neck, 8, t + 180);
    P.sh2 = P.sh; P.hipR = P.hip; P.hipL = P.hip;
  }
  const ua = s.ua ?? (front ? 84 : 90), fa = s.fa ?? ua;
  P.el = step(P.sh, SEG.ua * (s.ual ?? 1), ua);
  P.wr = step(P.el, SEG.fa * (s.fal ?? 1), fa);
  const fua = far("fua", "ua", front ? 84 : 90), ffa = s.ffa ?? (front ? m(fa) : (s.fua !== undefined ? fua : fa));
  const armOwn = s.fua !== undefined || s.ffa !== undefined;
  P.fel = step(P.sh2, SEG.ua * (s.fual ?? (armOwn ? 1 : s.ual ?? 1)), fua);
  P.fwr = step(P.fel, SEG.fa * (s.ffal ?? (armOwn ? 1 : s.fal ?? 1)), ffa);
  const th = s.th ?? (front ? 88 : 90), sn = s.sn ?? th, ft = s.ft ?? (front ? 15 : 0);
  P.kn = step(P.hipR, SEG.th * (s.thl ?? 1), th);
  P.an = step(P.kn, SEG.sn * (s.snl ?? 1), sn);
  P.to = step(P.an, front ? 8 : SEG.ft, ft);
  const fth = far("fth", "th", front ? 88 : 90), fsn = s.fsn ?? (front ? m(sn) : (s.fth !== undefined ? fth : sn));
  const fft = s.fft ?? (front ? m(ft) : ft);
  const legOwn = s.fth !== undefined || s.fsn !== undefined;
  P.fkn = step(P.hipL, SEG.th * (s.fthl ?? (legOwn ? 1 : s.thl ?? 1)), fth);
  P.fan = step(P.fkn, SEG.sn * (s.fsnl ?? (legOwn ? 1 : s.snl ?? 1)), fsn);
  P.fto = step(P.fan, front ? 8 : SEG.ft, fft);
  return P;
}

const shift = (P, dx, dy) => Object.fromEntries(Object.entries(P).map(([k, [x, y]]) => [k, [x + dx, y + dy]]));
const bottom = P => Math.max(...Object.entries(P).map(([k, [, y]]) => y + (RAD[k] || 4)));
const bbox = P => {
  const e = Object.entries(P);
  return {
    x1: Math.min(...e.map(([k, [x]]) => x - (RAD[k] || 4))), x2: Math.max(...e.map(([k, [x]]) => x + (RAD[k] || 4))),
    y1: Math.min(...e.map(([k, [, y]]) => y - (RAD[k] || 4))), y2: Math.max(...e.map(([k, [, y]]) => y + (RAD[k] || 4))),
  };
};

function build(spec) {
  const base = spec.base || {};
  let A = fk({ ...base, ...spec.a }), B = fk({ ...base, ...(spec.b || spec.a) });
  const front = !!(base.front || spec.a?.front);
  const ground = (P, g, lift = 0) => (g ? g.y - P[g.joint][1] : GROUND - lift - bottom(P));
  if (spec.hang !== undefined) {
    A = shift(A, 0, spec.hang - A.wr[1]);
    B = shift(B, 0, spec.hang - B.wr[1]);
  } else {
    A = shift(A, 0, ground(A, spec.groundA || spec.ground, spec.a?.lift));
    B = shift(B, 0, ground(B, spec.groundB || spec.ground, spec.b?.lift));
  }
  const anc = spec.anchor || (front ? "hip" : "an");
  if (anc === "center") {
    const ba = bbox(A), bb = bbox(B);
    B = shift(B, (ba.x1 + ba.x2) / 2 - (bb.x1 + bb.x2) / 2 + (spec.b?.dx || 0), 0);
  } else {
    B = shift(B, A[anc][0] - B[anc][0] + (spec.b?.dx || 0), spec.anchorY ? A[anc][1] - B[anc][1] : 0);
  }
  const ua = bbox(A), ub = bbox(B);
  const cx = (Math.min(ua.x1, ub.x1) + Math.max(ua.x2, ub.x2)) / 2;
  A = shift(A, 150 + (spec.x || 0) - cx, 0);
  B = shift(B, 150 + (spec.x || 0) - cx, 0);
  return { A, B, front };
}

// Base poses
const QUAD = { t: 0, h: -8, ua: 90, fa: 90, th: 90, sn: 180, ft: 180 };
const PLANK = { t: -12, h: -12, ua: 90, fa: 90, th: 168, sn: 168, ft: 100 };
const SUPINE = { t: 180, h: 180, ua: 0, fa: 0, th: 0, sn: 0, ft: -90 };
const SUPINE_KNEES = { t: 180, h: 180, ua: 0, fa: 0, th: -50, sn: 50, ft: 0 };
const PRONE = { t: 180, h: 180, ua: 0, fa: 0, th: 0, sn: 0, ft: 0 };
const FSTAND = { front: 1 };
const PRAYER = { ua: 115, ual: 0.55, fa: -130, fal: 0.55 };
const WALK_A = { th: 68, sn: 84, ft: -12, fth: 110, fsn: 118, fft: 22, ua: 112, fa: 96, fua: 70, ffa: 78 };
const WALK_B = { th: 110, sn: 118, ft: 22, fth: 68, fsn: 84, fft: -12, ua: 70, fa: 78, fua: 112, ffa: 96 };
const fixed = (j, dx = 0, dy = 0, from = "a") => ({ j, dx, dy, fixed: true, from });

const FIGS = {
  bandFrontRaise: {
    a: { ua: 92, fua: 90 }, b: { ua: -2, fa: -4, fua: 90 },
    props: [{ k: "band", a: fixed("an", 4, 0), b: "wr" }, { k: "label", text: "PALM UP", at: "wr", dx: 8, dy: -8 }],
  },
  bandChestFly: {
    base: FSTAND, a: { ua: -4, fa: -2 }, b: { ua: 120, ual: 0.45, fa: 160, fal: 0.4 },
    props: [{ k: "band", a: "wr", b: fixed("sh", 74, 4) }, { k: "band", a: "fwr", b: fixed("sh2", -74, 4) }, { k: "label", text: "SWEEP TOGETHER", at: fixed("head", 0, -22), mid: 1 }],
  },
  bandChestSqueeze: {
    base: FSTAND, a: { ua: 25, fa: 70, fal: 0.7 }, b: { ua: 120, ual: 0.45, fa: 160, fal: 0.4 },
    props: [{ k: "band", a: "wr", b: fixed("sh", 74, 10) }, { k: "band", a: "fwr", b: fixed("sh2", -74, 10) }, { k: "label", text: "PALMS TOGETHER · HOLD 2s", at: fixed("head", 0, -22), mid: 1 }],
  },
  bandYRaise: {
    base: FSTAND, a: { ua: 76, fa: 78 }, b: { ua: -58, fa: -60 },
    props: [{ k: "band", a: "an", b: "wr" }, { k: "band", a: "fan", b: "fwr" }, { k: "label", text: "MAKE A Y", at: fixed("head", 0, -40), mid: 1 }],
  },
  bandWRaise: {
    base: FSTAND, a: { ua: 82, ual: 0.85, fa: -78 }, b: { ua: 32, fa: -58 },
    props: [{ k: "label", text: "SQUEEZE BLADES", at: fixed("head", 0, -28), mid: 1 }],
  },
  bandLowHighFly: {
    base: FSTAND, a: { ua: 52, fa: 54, fua: 96, ffa: 94 }, b: { ua: -122, ual: 0.55, fa: -128, fal: 0.55, fua: 96, ffa: 94 },
    props: [{ k: "band", a: fixed("an", 58, 2), b: "wr" }, { k: "label", text: "LOW TO HIGH, ACROSS", at: fixed("head", 0, -30), mid: 1 }],
  },
  proneYTW: {
    base: { t: -30, h: -25, th: 150, sn: 112, ft: 170 }, a: { ua: 90, fa: 90 }, b: { ua: -30, fa: -30 },
    props: [{ k: "seg", a: fixed("hip", 6, 11), b: fixed("neck", 6, 11), w: 10 }, { k: "seg", a: fixed("hip", 12, 16), b: { j: "hip", dx: 12, fixed: true, ground: 1 }, w: 5 },
      { k: "db", at: "wr" }, { k: "label", text: "Y · T · W", at: fixed("head", 0, -24), mid: 1 }],
  },
  serratusWallSlide: {
    a: { ua: 20, fa: -90 }, b: { ua: -25, fa: -92 },
    props: [{ k: "wall", at: fixed("wr", 7, 0) }, { k: "label", text: "PUSH WALL AWAY", at: fixed("head", -30, -22), mid: 1 }],
  },
  dbSqueezePress: {
    base: SUPINE_KNEES, a: { ua: 90, ual: 0.35, fa: -90, fal: 0.95 }, b: { ua: -90, fa: -90 },
    props: [{ k: "db", at: "wr" }, { k: "label", text: "PRESS DBs TOGETHER", at: fixed("head", 20, -70), mid: 1 }],
  },
  copenhagen: {
    base: { ua: 90, ual: 0.62, fa: 180, fal: 0.85, fua: 8, ffa: 8, ft: -70 },
    a: { t: 194, h: 194, th: -17 }, b: { t: 178, h: 178, th: -3 },
    anchor: "an", anchorY: true,
    props: [{ k: "box", at: fixed("an", 4, 6), w: 34 }, { k: "label", text: "HIPS UP · BODY STRAIGHT", at: fixed("hip", 0, -48), mid: 1 }],
  },
  bandLegCurl: {
    base: { ua: 22, fa: 2 }, a: {}, b: { th: 94, sn: 200, ft: 110, fth: 90, fsn: 90, fft: 0 }, anchor: "fan",
    props: [{ k: "band", a: "an", b: fixed("an", 62, 0) }, { k: "box", at: fixed("wr", 4, 4), w: 12, back: 1 }],
  },
  razorCurl: {
    base: { th: 90, sn: 180, ft: 180, ua: 80, ual: 0.5, fa: -60, fal: 0.5 }, a: { t: -90 }, b: { t: -56, h: -50, th: 124 },
    anchor: "kn", anchorY: true,
    props: [{ k: "seg", a: fixed("an", -8, -7), b: fixed("an", 12, -7), w: 6, c: "#4a4a4a" }, { k: "label", text: "HINGE AT KNEES ONLY", at: fixed("head", 10, -22), mid: 1 }],
  },
  suitcaseCarry: {
    base: { ...FSTAND, fua: 112, ffa: 104 }, a: {}, b: { th: 80, thl: 0.86, sn: 98 },
    props: [{ k: "db", at: "wr", rot: [90, 90] }, { k: "label", text: "STAY TALL · NO LEAN", at: fixed("head", 0, -22), mid: 1 }],
  },
  pendulum: {
    base: { t: -12, h: -4, th: 98, sn: 90, fth: 80, fsn: 96, fua: 72, ffa: 80 }, a: { ua: 74, fa: 74 }, b: { ua: 106, fa: 106 },
    props: [{ k: "box", at: fixed("fwr", 6, 5), w: 46 }, { k: "label", text: "RELAX · LET IT SWING", at: fixed("head", 0, -30), mid: 1 }],
  },
  scapRetraction: {
    a: { ua: 80, fa: 0 }, b: { ua: 114, fa: 6 },
    props: [{ k: "label", text: "SQUEEZE SHOULDER BLADES", at: fixed("head", 0, -22), mid: 1 }],
  },
  sleeperStretch: {
    base: { t: 180, h: 180, th: 12, sn: -12, ft: 0, fua: 2, ffa: 2, ua: 90, ual: 0.25 }, a: { fa: -90 }, b: { fa: -22 },
    props: [{ k: "label", text: "GENTLE PRESSURE", at: fixed("head", 30, -40), mid: 1 }],
  },
  serratusPunch: {
    base: { ...SUPINE_KNEES, fua: 0, ffa: 0 }, a: { ua: -90, fa: -90, ual: 0.78, fal: 0.8 }, b: { ua: -90, fa: -90, ual: 1, fal: 1.08 },
    props: [{ k: "db", at: "wr" }, { k: "label", text: "REACH · BLADE MOVES", at: fixed("head", 30, -78), mid: 1 }],
  },
  bearHold: {
    base: { ...QUAD, h: -4 }, a: { ual: 0.86 }, b: { ft: 96, ual: 1.02, fal: 1.03 }, anchor: "wr", hold: true,
    props: [{ k: "label", text: "KNEES HOVER 1-2 IN", at: fixed("head", -30, -34), mid: 1 }],
  },
  quadShoulderTap: {
    base: QUAD, a: {}, b: { ua: 128, ual: 0.55, fa: -36, fal: 0.62, fua: 90, ffa: 90 }, anchor: "kn", anchorY: true,
    props: [{ k: "label", text: "NO HIP SWAY", at: fixed("head", -30, -34), mid: 1 }],
  },
  plankShoulderTap: {
    base: { ...PLANK, fua: 90, ffa: 90 }, a: {}, b: { ua: 122, ual: 0.5, fa: -32, fal: 0.62 }, anchor: "fwr", anchorY: true,
    props: [{ k: "label", text: "HIPS SQUARE", at: fixed("hip", 0, -30), mid: 1 }],
  },
  wallPushupPlus: {
    base: { th: 112, sn: 112, ft: 0 }, a: { t: -62, h: -62, ua: 40, fa: -30 }, b: { t: -70, h: -70, ua: -8, fa: -8 },
    props: [{ k: "wall", at: fixed("wr", 6, 0, "b") }, { k: "label", text: "EXTRA PUSH AT TOP", at: fixed("head", -40, -24), mid: 1 }],
  },
  neckRotation: {
    base: FSTAND, a: { fua: 96, ffa: 96 }, b: { ua: -60, fa: 173, fal: 0.6, fua: 96, ffa: 96 },
    props: [{ k: "label", text: "PUSH · HEAD STAYS STILL", at: fixed("head", 0, -24), mid: 1 }],
  },
  chinTuck: {
    a: { h: -66 }, b: { h: -104 },
    props: [{ k: "label", text: "CHIN STRAIGHT BACK", at: fixed("head", 0, -24), mid: 1 }],
  },
  tibialisRaise: {
    a: { ft: 42 }, b: { ft: -34 }, ground: { joint: "an", y: 164 },
    props: [{ k: "box", at: fixed("an", -12, 6), w: 26 }, { k: "label", text: "TOES TO SHINS", at: fixed("head", 0, -22), mid: 1 }],
  },
  dorsiflexion: {
    base: { t: -74, h: -80, th: 0, sn: 0, ua: 116, fa: 116, ual: 0.92 }, a: { ft: -30 }, b: { ft: -112 },
    props: [{ k: "band", a: "to", b: fixed("to", 46, 8) }, { k: "label", text: "PULL TOES BACK", at: fixed("head", 30, -22), mid: 1 }],
  },
  heelWalk: {
    a: { ...WALK_A, ft: -48, fft: -30 }, b: { ...WALK_B, ft: -30, fft: -48 }, anchor: "center",
    props: [{ k: "label", text: "WALK ON HEELS · TOES UP", at: fixed("head", 0, -22), mid: 1 }],
  },
  farmerHeels: {
    a: { ...WALK_A, ft: -48, fft: -30, ua: 98, fa: 96, fua: 84, ffa: 86 }, b: { ...WALK_B, ft: -30, fft: -48, ua: 84, fa: 86, fua: 98, ffa: 96 }, anchor: "center",
    props: [{ k: "db", at: "wr" }, { k: "db", at: "fwr", o: 0.4 }, { k: "label", text: "ON HEELS · TOES UP", at: fixed("head", 0, -22), mid: 1 }],
  },
  heelBalance: {
    a: {}, b: { ft: -36, fth: 0, fsn: 90, fft: 0, ua: 4, fa: 4, fua: 4, ffa: 4 }, hold: true,
    props: [{ k: "label", text: "BALANCE ON ONE HEEL", at: fixed("head", 0, -22), mid: 1 }],
  },
  adductorSqueeze: {
    base: { ...SUPINE_KNEES, ua: 10 }, a: {}, b: {},
    props: [{ k: "seg", a: { j: "kn", dx: -5, dy: 3 }, b: { j: "kn", dx: 5, dy: 3 }, w: 9, c: "#e8e8e8", o: 0.7, front: 1 }, { k: "label", text: "SQUEEZE · HOLD 2s", at: fixed("head", 30, -50), mid: 1 }],
  },
  sideAbduction: {
    base: { t: 180, h: 186, ua: 180, ual: 0.7, fa: 180, fua: 4, ffa: 4, fth: 0, fsn: 0, fft: 15 }, a: { th: 0, sn: 0, ft: 15 }, b: { th: -34, sn: -34, ft: -18 },
    props: [{ k: "band", a: "kn", b: "fkn" }, { k: "label", text: "TOES POINT SLIGHTLY DOWN", at: fixed("hip", 10, -60), mid: 1 }],
  },
  clamshell: {
    base: { t: 180, h: 186, ua: 180, ual: 0.7, fa: 180, fua: 4, ffa: 4, fth: 25, fsn: 160, fft: 180, ft: 180 }, a: { th: 25, sn: 160 }, b: { th: -18, sn: 138, snl: 1.3 },
    props: [{ k: "band", a: "kn", b: "fkn" }, { k: "label", text: "FEET TOGETHER · KNEE OPENS", at: fixed("hip", 10, -56), mid: 1 }],
  },
  hipHike: {
    base: { ...FSTAND, fth: 92, fsn: 92 }, a: { tilt: -24, t: -95 }, b: { tilt: 24, t: -85 }, ground: { joint: "an", y: 160 },
    props: [{ k: "box", at: fixed("an", 0, 6), w: 26 }, { k: "label", text: "DROP · HIKE THE HIP", at: fixed("head", 0, -22), mid: 1 }],
  },
  deadHang: {
    a: { ua: -90, fa: -90, th: 92, sn: 96, ft: 30 }, b: { ua: -90, fa: -90, ual: 1.04, th: 92, sn: 96, ft: 30 }, hang: 26, anchor: "wr", hold: true,
    props: [{ k: "bar", at: fixed("wr") }, { k: "label", text: "RELAX & DECOMPRESS", at: fixed("wr", 0, -12), mid: 1 }],
  },
  towelWring: {
    base: FSTAND, a: { ua: 96, ual: 0.55, fa: 178, fal: 0.16 }, b: { ua: 86, ual: 0.5, fa: 196, fal: 0.24, fua: 100, fual: 0.62, ffa: -16, ffal: 0.24 },
    props: [{ k: "seg", a: "wr", b: "fwr", w: 7, c: "#e8e8e8", o: 0.75, front: 1 }, { k: "label", text: "WRING HARD", at: fixed("head", 0, -22), mid: 1 }],
  },
  fingerExtension: {
    base: { ...FSTAND, ua: 96, ual: 0.5, fa: -96 }, a: {}, b: {},
    props: [{ k: "fingers", at: "wr", r: [4, 11] }, { k: "label", text: "SPREAD AGAINST BAND", at: fixed("head", 0, -24), mid: 1 }],
  },
  forearmRotation: {
    base: { ...FSTAND, ua: 90, ual: 0.95, fa: 90, fal: 0.25 }, a: {}, b: {},
    props: [{ k: "db", at: "wr", rot: [90, 0] }, { k: "label", text: "SLOW ROTATION", at: fixed("head", 0, -24), mid: 1 }],
  },
  hollowBody: {
    a: SUPINE_KNEES, b: { t: 192, h: 196, ua: 192, fa: 192, th: -14, sn: -14, ft: -75 }, hold: true, anchor: "hip",
    props: [{ k: "label", text: "LOW BACK PRESSED DOWN", at: fixed("hip", 0, -56), mid: 1 }],
  },
  horseStance: {
    base: { ...FSTAND, ...PRAYER }, a: { th: 64, sn: 64 }, b: { th: 20, sn: 95 }, anchor: "an", hold: true,
    props: [{ k: "label", text: "SINK · SPINE TALL", at: fixed("head", 0, -22), mid: 1 }],
  },
  wallSit: {
    a: {}, b: { th: 0, sn: 90, ua: 70, fa: 12 }, anchor: "hip", hold: true,
    props: [{ k: "wall", at: fixed("hip", -14, 0), left: 1 }, { k: "label", text: "THIGHS PARALLEL", at: fixed("head", 50, -22), mid: 1 }],
  },
  bottomPushup: {
    a: PLANK, b: { t: -4, h: -4, th: 176, sn: 176, ft: 100, ua: -150, fa: 75 }, anchor: "wr", hold: true,
    props: [{ k: "label", text: "CHEST JUST OFF FLOOR", at: fixed("hip", 0, -40), mid: 1 }],
  },
  ironBridge: {
    a: SUPINE, b: { t: 160, h: 166, ua: 18, fa: 0, th: 20, sn: 20, ft: -80 }, hold: true,
    props: [{ k: "label", text: "SQUEEZE GLUTES · STRAIGHT LINE", at: fixed("hip", 0, -44), mid: 1 }],
  },
  walk: { a: WALK_A, b: WALK_B, anchor: "center", dur: 1.6, props: [] },
  intervalWalk: {
    a: WALK_A, b: WALK_B, anchor: "center", dur: 1.6,
    props: [{ k: "label", text: "3 MIN FAST · 3 MIN EASY", at: fixed("head", 0, -22), mid: 1 }],
  },
  zone2: {
    a: { ...WALK_A, t: -84, h: -84, ua: 112, fa: 20, fua: 66, ffa: -40 }, b: { ...WALK_B, t: -84, h: -84, ua: 66, fa: -40, fua: 112, ffa: 20 }, anchor: "center", dur: 1.3,
    props: [{ k: "label", text: "EASY · CONVERSATION PACE", at: fixed("head", 0, -22), mid: 1 }],
  },
  asianSquat: {
    a: {}, b: { t: -62, h: -80, th: -12, sn: 108, ft: 0, ua: 15, fa: -10 }, hold: true,
    props: [{ k: "label", text: "HEELS FLAT · CHEST UP", at: fixed("head", 0, -22), mid: 1 }],
  },
  birdDog: {
    base: QUAD, a: {}, b: { ua: 0, fa: -2, fth: 178, fsn: 178, fft: 180 }, anchor: "kn", anchorY: true,
    props: [{ k: "label", text: "OPPOSITE ARM + LEG · HIPS SQUARE", at: fixed("head", -40, -36), mid: 1 }],
  },
  lateralStepUp: {
    base: FSTAND, a: { th: 25, sn: 105, fth: 92, fsn: 92 }, b: { th: 88, sn: 90, fth: 100, fsn: 82 },
    groundB: null, anchor: "an", anchorY: true,
    props: [{ k: "box", at: fixed("an", 4, 6), w: 34 }, { k: "label", text: "DRIVE THROUGH TOP FOOT", at: fixed("head", 0, -22, "b"), mid: 1 }],
  },
  bridgeFeetUp: {
    a: { t: 180, h: 180, ua: 0, fa: 0, th: -50, sn: 20, ft: -10 }, b: { t: 162, h: 166, ua: 16, fa: 0, th: -22, sn: 55, ft: -10 },
    anchor: "an", anchorY: true,
    props: [{ k: "box", at: fixed("an", 8, 6), w: 34 }, { k: "label", text: "HIPS TO FULL EXTENSION", at: fixed("hip", 10, -52), mid: 1 }],
  },
  deficitCalf: {
    a: { ft: -28 }, b: { ft: 55 }, ground: { joint: "to", y: 172 }, anchor: "to",
    props: [{ k: "box", at: fixed("to", 10, 3), w: 30 }, { k: "label", text: "FULL STRETCH · FULL SQUEEZE", at: fixed("head", 0, -22), mid: 1 }],
  },
  singleLegBalance: {
    a: {}, b: { fth: 6, fsn: 90, fft: 0 }, anchor: "an", hold: true,
    props: [{ k: "db", at: "wr" }, { k: "db", at: "fwr", o: 0.4 }, { k: "label", text: "EYES CLOSED TO PROGRESS", at: fixed("head", 0, -22), mid: 1 }],
  },
  pigeon: {
    base: { th: 8, sn: 150, snl: 0.45, ft: 150, fth: 176, fsn: 178, fft: 180 },
    a: { t: -85, h: -85, ua: 76, fa: 90, fua: 76, ffa: 90 }, b: { t: -14, h: -8, ua: 4, fa: 0, fua: 4, ffa: 0 }, anchor: "hip", hold: true,
    props: [{ k: "label", text: "FRONT SHIN ACROSS · FOLD", at: fixed("head", 10, -22), mid: 1 }],
  },
  supineTwist: {
    base: { t: 180, h: 180, ua: -90, ual: 0.4, fa: -90, fal: 0.4 }, a: { th: -60, sn: 50, ft: 0 }, b: { th: -12, thl: 0.85, sn: 38, snl: 0.9, ft: 0 }, hold: true,
    props: [{ k: "label", text: "KNEES DROP · SHOULDERS DOWN", at: fixed("hip", 0, -60), mid: 1 }],
  },
  threadNeedle: {
    base: { ...QUAD, fua: 90, ffa: 90 }, a: { ua: -80, fa: -86 }, b: { t: 8, ua: 122, ual: 0.55, fa: 170, fal: 0.9 }, anchor: "kn", anchorY: true,
    props: [{ k: "label", text: "OPEN UP · THREAD UNDER", at: fixed("hip", -24, -46), mid: 1 }],
  },
  hip9090: {
    base: { t: -88, h: -88, ua: 116, fa: 110, fua: 116, ffa: 110 }, a: { th: 16, sn: 130, fth: 26, fsn: 140 }, b: { th: 164, sn: 50, fth: 154, fsn: 40 }, anchor: "hip",
    props: [{ k: "label", text: "SWITCH SIDES · STAY TALL", at: fixed("head", 0, -22), mid: 1 }],
  },
  lateralLungeBalance: {
    base: FSTAND, a: { th: 38, sn: 100, fth: 122, fsn: 122 }, b: { th: 88, sn: 90, fth: 92, fthl: 0.42, fsn: 94 },
    props: [{ k: "db", at: "wr", rot: [90, 90] }, { k: "db", at: "fwr", rot: [90, 90] }, { k: "label", text: "LUNGE · STAND · BALANCE", at: fixed("head", 0, -22), mid: 1 }],
  },
  reverseLungeKnee: {
    a: { th: 115, sn: 178, ft: 100, fth: 10, fsn: 92, fft: 0, ua: 60, fa: -20, fua: 118, ffa: 100 },
    b: { th: -6, sn: 84, ft: 20, fth: 90, fsn: 90, fft: 0, ua: 114, fa: 100, fua: 52, ffa: -20 }, anchor: "fan",
    props: [{ k: "label", text: "STEP BACK · DRIVE KNEE", at: fixed("head", 0, -22, "b"), mid: 1 }],
  },
  proneCobra: {
    a: PRONE, b: { ...PRONE, t: 197, h: 200, ua: -6, fa: -4 }, hold: true, anchor: "an",
    props: [{ k: "label", text: "THUMBS OUT · SQUEEZE BLADES", at: fixed("hip", -10, -50), mid: 1 }],
  },
  legLowering: {
    base: { t: 180, h: 180, ua: 0, fa: 0 }, a: { th: -90, sn: -90, ft: 0 }, b: { th: -12, sn: -12, ft: -80 }, dur: 3.6, anchor: "hip",
    props: [{ k: "label", text: "SLOW · LOW BACK STAYS DOWN", at: fixed("hip", 10, -84), mid: 1 }],
  },
  meditation: {
    base: { ...FSTAND, th: 12, thl: 0.95, sn: 168, snl: 0.85, ft: 180, ua: 60, fa: 60 }, a: { tl: 1 }, b: { tl: 1.05 }, dur: 5,
    props: [{ k: "label", text: "4 SEC IN · 6 SEC OUT", at: fixed("head", 0, -22), mid: 1 }],
  },
  marchWeighted: {
    a: { th: 0, sn: 90, ft: 0, fth: 90, fsn: 90, ua: 118, fa: 108, fua: 66, ffa: 72 }, b: { th: 90, sn: 90, fth: 0, fsn: 90, fft: 0, ua: 66, fa: 72, fua: 118, ffa: 108 }, anchor: "center", dur: 1.4,
    props: [{ k: "db", at: "wr" }, { k: "db", at: "fwr", o: 0.4 }, { k: "label", text: "KNEES TO HIP HEIGHT", at: fixed("head", 0, -22), mid: 1 }],
  },
  stepTouch: {
    base: FSTAND, a: { th: 70, sn: 72, fth: 96, fsn: 96, ua: 40, fa: 30, fua: 96, ffa: 96 },
    b: { th: 84, sn: 84, fth: 110, fsn: 108, ua: 84, fa: 84, fua: 140, ffa: 150, dx: -22 }, anchor: "center", dur: 1.4,
    props: [{ k: "label", text: "STEP · TAP · SWITCH", at: fixed("head", 0, -22), mid: 1 }],
  },
  stairJump: {
    a: { t: -55, h: -62, th: 25, sn: 110, ft: 0, ua: 126, fa: 120 }, b: { t: -86, ua: -8, fa: -12, th: 90, sn: 90, dx: 46 },
    groundB: { joint: "an", y: 166 }, anchor: "an",
    props: [{ k: "box", at: fixed("an", 0, 6, "b"), w: 46 }, { k: "label", text: "JUMP UP · LAND SOFT", at: fixed("an", -10, -118), mid: 1 }],
  },
  shadowBox: {
    base: { t: -86, h: -86, th: 76, sn: 96, ft: 0, fth: 110, fsn: 100, fft: 0, fua: 58, ffa: -116 }, a: { ua: 54, fa: -118 }, b: { ua: -4, fa: -2 }, dur: 1.4,
    props: [{ k: "label", text: "JAB · GUARD UP", at: fixed("head", 0, -22), mid: 1 }],
  },
  jumpingJack: { base: FSTAND, a: { ua: 84, th: 89 }, b: { ua: -60, fa: -70, th: 66 }, anchor: "hip", dur: 1.4, props: [] },
  highKnees: {
    a: { th: -12, sn: 80, ft: 12, fth: 92, fsn: 92, fft: 32, ua: 120, fa: 60, fua: 50, ffa: -40 },
    b: { th: 92, sn: 92, ft: 32, fth: -12, fsn: 80, fft: 12, ua: 50, fa: -40, fua: 120, ffa: 60 }, anchor: "center", dur: 0.9, props: [],
  },
  skater: {
    base: FSTAND,
    a: { t: -78, h: -82, th: 64, sn: 96, fth: 62, fsn: 34, fft: 30, ua: 128, fa: 140, fua: 158, ffa: 150 },
    b: { t: -102, h: -98, fth: 116, fsn: 84, fft: 165, th: 118, sn: 146, ft: 150, fua: 52, ffa: 40, ua: 22, fa: 30, dx: 64 },
    anchor: "center", dur: 1.5,
    props: [{ k: "label", text: "BOUND SIDE TO SIDE", at: fixed("head", 30, -26), mid: 1 }],
  },
  skaterStep: {
    base: FSTAND,
    a: { t: -80, h: -84, th: 66, sn: 94, fth: 62, fsn: 36, fft: 30, ua: 128, fa: 140, fua: 158, ffa: 150 },
    b: { t: -100, h: -96, fth: 114, fsn: 86, fft: 165, th: 118, sn: 144, ft: 150, fua: 52, ffa: 40, ua: 22, fa: 30, dx: 40 },
    anchor: "center", dur: 1.6,
    props: [{ k: "label", text: "STEP WIDE · NO JUMP", at: fixed("head", 20, -26), mid: 1 }],
  },
  fastFeet: {
    base: { t: -70, h: -82, ua: 70, fa: -12 },
    a: { th: 18, sn: 96, ft: 10, fth: 42, fsn: 108, fft: 0 }, b: { th: 42, sn: 108, ft: 0, fth: 18, fsn: 96, fft: 10 }, anchor: "center", dur: 0.5,
    props: [{ k: "label", text: "STAY LOW · QUICK FEET", at: fixed("head", 0, -22), mid: 1 }],
  },
  buttKicks: {
    a: { th: 96, sn: -116, ft: -70, fth: 90, fsn: 90, fft: 20, ua: 110, fa: 40, fua: 60, ffa: -30 },
    b: { th: 90, sn: 90, ft: 20, fth: 96, fsn: -116, fft: -70, ua: 60, fa: -30, fua: 110, ffa: 40 }, anchor: "center", dur: 0.9,
    props: [{ k: "label", text: "HEELS TO GLUTES", at: fixed("head", 0, -22), mid: 1 }],
  },
  squatCalfRaise: {
    a: { t: -58, h: -75, th: 18, sn: 105, ft: 0, ua: 12, fa: 4 }, b: { th: 90, sn: 90, ft: 58, ua: -32, fa: -36 }, anchor: "to",
    props: [{ k: "label", text: "SQUAT · EXPLODE TO TOES", at: fixed("head", 0, -22), mid: 1 }],
  },
  speedLateralLunge: {
    base: { ...FSTAND, ...PRAYER }, a: { th: 76, sn: 76 }, b: { th: 38, sn: 100, fth: 122, fsn: 122 }, anchor: "fan", dur: 1.6,
    props: [{ k: "label", text: "SINK · SNAP BACK TO CENTER", at: fixed("head", 0, -22), mid: 1 }],
  },
  bridgeMarch: {
    base: { t: 165, h: 168, ua: 12, fa: 0, fth: -25, fsn: 62, fft: 0 }, a: { th: -25, sn: 62, ft: 0 }, b: { th: -82, sn: 2, ft: -40 }, anchor: "fan", dur: 1.8,
    props: [{ k: "label", text: "HIPS STAY UP · ALTERNATE", at: fixed("hip", 0, -46), mid: 1 }],
  },
};

const ALIAS = {
  "Band Front Raise": "bandFrontRaise", "Band Chest Fly": "bandChestFly", "Band Chest Squeeze": "bandChestSqueeze",
  "Band Y-Raise": "bandYRaise", "Band W-Raise": "bandWRaise", "Band Low-to-High Fly": "bandLowHighFly", "DB Prone Y-T-W": "proneYTW",
  "Serratus Wall Slide": "serratusWallSlide", "Serratus Wall Slide (A)": "serratusWallSlide", "Wall Slide": "serratusWallSlide",
  "DB Squeeze Press": "dbSqueezePress", "Copenhagen Plank": "copenhagen", "Copenhagen Plank (knee)": "copenhagen",
  "Standing Band Leg Curl": "bandLegCurl", "Banded Razor Curl": "razorCurl",
  "Suitcase Carry": "suitcaseCarry", "Suitcase Carry (one DB)": "suitcaseCarry", "DB Suitcase Carry": "suitcaseCarry",
  "Pendulum Circles": "pendulum", "Scapular Retraction": "scapRetraction", "Sleeper Stretch": "sleeperStretch",
  "Serratus Punch (lying)": "serratusPunch", "Bear Crawl (slow)": "bearHold", "Bear Crawl Hold": "bearHold",
  "Quadruped Shoulder Tap": "quadShoulderTap", "Plank Shoulder Tap": "plankShoulderTap", "Wall Push-Up Plus": "wallPushupPlus",
  "Isometric Rotation Hold": "neckRotation", "Chin Tuck": "chinTuck",
  "Tibialis Raise (heels on step)": "tibialisRaise", "Tibialis Raises": "tibialisRaise", "Banded Dorsiflexion (seated)": "dorsiflexion",
  "Heel Walk": "heelWalk", "Farmer Carry on Heels": "farmerHeels", "Single-Leg Heel Balance": "heelBalance",
  "Adductor Squeeze Hold": "adductorSqueeze", "Side-Lying Abduction (band)": "sideAbduction", "Clamshell (band)": "clamshell",
  "Single-Leg Hip Hike": "hipHike", "Dead Hang": "deadHang", "Bar Hangs": "deadHang", "Towel Wring": "towelWring",
  "Finger Extension (band)": "fingerExtension", "DB Forearm Rotation": "forearmRotation",
  "Hollow Body Hold": "hollowBody", "Horse Stance": "horseStance", "Wall Sit": "wallSit", "Bottom Push-Up Hold": "bottomPushup",
  "Iron Bridge": "ironBridge", "Japanese Interval Walking": "intervalWalk", "Brisk Walk": "walk", "Zone 2 Cardio": "zone2",
  "Asian Squat": "asianSquat", "Bird Dog": "birdDog", "Bird Dog (slow hold)": "birdDog", "Lateral Step Up": "lateralStepUp",
  "Glute Bridge with Feet Elevated": "bridgeFeetUp", "Deficit Calf Raises": "deficitCalf", "Single-Leg Balance Hold": "singleLegBalance",
  "Pigeon Pose": "pigeon", "Supine Twist": "supineTwist", "Thread the Needle": "threadNeedle", "90/90 Hip Switch": "hip9090",
  "DB Lateral Lunge to Balance": "lateralLungeBalance", "Reverse Lunge to Knee Drive": "reverseLungeKnee",
  "Prone Cobra Hold": "proneCobra", "Supine Leg Lowering (slow)": "legLowering", "Seated Meditation Breathing": "meditation",
  "March in Place (weighted)": "marchWeighted", "Step Touch Cardio": "stepTouch", "Stair Jumps": "stairJump", "Stair Jumps (intervals)": "stairJump",
  "Shadow Boxing": "shadowBox", "Jumping Jacks": "jumpingJack", "High Knees": "highKnees", "Side Skaters": "skater",
  "Low-Impact Skater Steps": "skaterStep", "Butt Kicks": "buttKicks", "Squat to Calf Raise": "squatCalfRaise",
  "Speed Lateral Lunges": "speedLateralLunge", "Fast Feet": "fastFeet", "Glute Bridge Marches": "bridgeMarch",
};

const built = {};
const getFig = key => (built[key] ||= { ...build(FIGS[key]), spec: FIGS[key] });

export const FIGURE_KEYS = Object.keys(FIGS);
export const FIGURE_ALIASES = ALIAS;
export const hasFigure = name => !!ALIAS[name];
export const figureCue = name => (FIGS[ALIAS[name]]?.props || []).find(p => p.k === "label")?.text || null;

const r1 = n => Math.round(n * 10) / 10;
const KT_REP = 'keyTimes="0;0.15;0.5;0.65;1" calcMode="spline" keySplines="0 0 1 1;.45 0 .55 1;0 0 1 1;.45 0 .55 1"';
const KT_HOLD = 'keyTimes="0;0.25;0.8;1" calcMode="spline" keySplines=".45 0 .55 1;0 0 1 1;.45 0 .55 1"';

function resolve(pt, P, PA, PB) {
  if (typeof pt === "string") return P[pt];
  const src = pt.fixed ? (pt.from === "b" ? PB : PA) : P;
  const base = src[pt.j];
  return [base[0] + (pt.dx || 0), pt.ground ? GROUND : base[1] + (pt.dy || 0)];
}

// frame: "anim" (default), "a", or "b" for a static pose. crop: tight square viewBox around the figure (thumbnails).
export function figureSVG(name, { color = "#D4F53C", frame = "anim", crop = false, uid = "f" } = {}) {
  const key = ALIAS[name] || (FIGS[name] ? name : null);
  if (!key) return null;
  const { A, B, front, spec } = getFig(key);
  const animate = frame === "anim";
  const hold = !!spec.hold, dur = spec.dur || (hold ? 4 : 2.6);
  const S = frame === "b" ? B : A;
  const anim = (attr, a, b) => {
    if (!animate || Math.abs(a - b) < 0.05) return "";
    const v = hold ? `${r1(a)};${r1(b)};${r1(b)};${r1(a)}` : `${r1(a)};${r1(a)};${r1(b)};${r1(b)};${r1(a)}`;
    return `<animate attributeName="${attr}" values="${v}" ${hold ? KT_HOLD : KT_REP} dur="${dur}s" repeatCount="indefinite"/>`;
  };
  const pick = pair => (frame === "b" ? pair[1] : pair[0]);
  const line = (pa, pb, w, o, c = color) =>
    `<line x1="${r1(pick([pa[0], pb[0]]))}" y1="${r1(pick([pa[1], pb[1]]))}" x2="${r1(pick([pa[2], pb[2]]))}" y2="${r1(pick([pa[3], pb[3]]))}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" opacity="${o}">` +
    anim("x1", pa[0], pb[0]) + anim("y1", pa[1], pb[1]) + anim("x2", pa[2], pb[2]) + anim("y2", pa[3], pb[3]) + "</line>";
  const bone = (p, q, w, o) => line([...A[p], ...A[q]], [...B[p], ...B[q]], w + 3, 1, "#080808") + line([...A[p], ...A[q]], [...B[p], ...B[q]], w, o);
  const dot = (k, rr) => `<circle cx="${r1(S[k][0])}" cy="${r1(S[k][1])}" r="${rr}" fill="${color}">${anim("cx", A[k][0], B[k][0])}${anim("cy", A[k][1], B[k][1])}</circle>`;

  const farO = front ? 1 : 0.38;
  const far = front
    ? [["sh", "sh2", 11], ["hipR", "hipL", 12], ["sh2", "fel", 10], ["fel", "fwr", 8], ["hipL", "fkn", 14], ["fkn", "fan", 10], ["fan", "fto", 6]]
    : [["sh", "fel", 9], ["fel", "fwr", 7], ["hip", "fkn", 13], ["fkn", "fan", 9], ["fan", "fto", 6]];
  const near = [["neck", "hip", front ? 20 : 17], ["sh", "el", 10], ["el", "wr", 8], [front ? "hipR" : "hip", "kn", 14], ["kn", "an", 10], ["an", "to", 6]];
  let figure = far.map(([p, q, w]) => bone(p, q, w, farO)).join("") + near.map(([p, q, w]) => bone(p, q, w, 1)).join("") + dot("wr", 4.5) + dot("head", 11.5);
  if (front) figure += dot("fwr", 4.5);
  if (animate && Object.keys(A).every(k => Math.abs(A[k][0] - B[k][0]) < 0.05 && Math.abs(A[k][1] - B[k][1]) < 0.05)) {
    figure += `<animate attributeName="opacity" values="1;0.55;1" dur="2.4s" repeatCount="indefinite"/>`;
  }

  let back = "", fore = "";
  const PA = A, PB = B;
  for (const p of spec.props || []) {
    let out = "";
    if (p.k === "band" || p.k === "seg") {
      const a1 = resolve(p.a, A, PA, PB), a2 = resolve(p.b, A, PA, PB), b1 = resolve(p.a, B, PA, PB), b2 = resolve(p.b, B, PA, PB);
      const c = p.c || (p.k === "band" ? "#00E5CC" : "#2c2c2c");
      out = line([...a1, ...a2], [...b1, ...b2], p.w || (p.k === "band" ? 2.5 : 8), p.o ?? (p.k === "band" ? 0.85 : 1), c);
      if (p.k === "band" || p.front) { fore += out; continue; }
    } else if (p.k === "box") {
      const [x, y] = resolve(p.at, A, PA, PB);
      out = `<rect x="${r1(x - p.w / 2)}" y="${r1(y)}" width="${p.w}" height="${r1(Math.max(2, GROUND - y))}" rx="2" fill="#1f1f1f" stroke="#333" stroke-width="1"/>`;
    } else if (p.k === "wall") {
      const [x] = resolve(p.at, A, PA, PB);
      out = `<rect x="${r1(p.left ? x - 10 : x)}" y="14" width="10" height="${GROUND - 14}" fill="#1d1d1d"/>`;
    } else if (p.k === "bar") {
      const [x, y] = resolve(p.at, A, PA, PB);
      out = `<line x1="${r1(x - 46)}" y1="${r1(y)}" x2="${r1(x + 46)}" y2="${r1(y)}" stroke="#555" stroke-width="5" stroke-linecap="round"/>`;
    } else if (p.k === "db") {
      const pa = resolve(p.at, A, PA, PB), pb = resolve(p.at, B, PA, PB), rot = p.rot || [0, 0];
      const tr = `<animateTransform attributeName="transform" type="translate" values="${hold ? `${r1(pa[0])} ${r1(pa[1])};${r1(pb[0])} ${r1(pb[1])};${r1(pb[0])} ${r1(pb[1])};${r1(pa[0])} ${r1(pa[1])}` : `${r1(pa[0])} ${r1(pa[1])};${r1(pa[0])} ${r1(pa[1])};${r1(pb[0])} ${r1(pb[1])};${r1(pb[0])} ${r1(pb[1])};${r1(pa[0])} ${r1(pa[1])}`}" ${hold ? KT_HOLD : KT_REP} dur="${dur}s" repeatCount="indefinite"/>`;
      const rt = rot[0] !== rot[1] ? `<animateTransform attributeName="transform" type="rotate" values="${hold ? `${rot[0]};${rot[1]};${rot[1]};${rot[0]}` : `${rot[0]};${rot[0]};${rot[1]};${rot[1]};${rot[0]}`}" ${hold ? KT_HOLD : KT_REP} dur="${dur}s" repeatCount="indefinite"/>` : "";
      const sp = frame === "b" ? pb : pa, sr = frame === "b" ? rot[1] : rot[0];
      fore += `<g transform="translate(${r1(sp[0])} ${r1(sp[1])})" opacity="${p.o ?? 1}">${animate ? tr : ""}<g transform="rotate(${sr})">${animate ? rt : ""}` +
        `<line x1="-8" y1="0" x2="8" y2="0" stroke="#bbb" stroke-width="3"/><rect x="-11" y="-5" width="4" height="10" rx="1" fill="#e8e8e8"/><rect x="7" y="-5" width="4" height="10" rx="1" fill="#e8e8e8"/></g></g>`;
      continue;
    } else if (p.k === "fingers") {
      const [x, y] = resolve(p.at, S === A ? A : B, PA, PB);
      for (const ang of [-150, -120, -90, -60, -30]) {
        const [c, s] = dir(ang);
        const a = [x + c * 3, y + s * 3, x + c * p.r[0], y + s * p.r[0]], b = [x + c * 3, y + s * 3, x + c * p.r[1], y + s * p.r[1]];
        fore += line(a, b, 2.5, 1);
      }
      continue;
    } else if (p.k === "label") {
      continue;
    }
    if (p.front) fore += out; else back += out;
  }

  let vb = "0 0 300 200";
  if (crop) {
    const b = bbox(frame === "a" ? A : B), cx = (b.x1 + b.x2) / 2, cy = (b.y1 + b.y2) / 2;
    const side = Math.max(b.x2 - b.x1, b.y2 - b.y1) + 16;
    vb = `${r1(cx - side / 2)} ${r1(cy - side / 2)} ${r1(side)} ${r1(side)}`;
  }
  const fid = `glow-${uid}`;
  const floor = crop ? "" : `<line x1="16" y1="${GROUND}" x2="284" y2="${GROUND}" stroke="#2a2a2a" stroke-width="2"/>`;
  return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block" role="img" aria-label="${name} demo">` +
    `<defs><filter id="${fid}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>` +
    `${floor}${back}<g filter="url(#${fid})">${figure}</g>${fore}</svg>`;
}
