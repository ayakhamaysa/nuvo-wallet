import { screen } from "../data/ui";

// ---------------------------------------------------------------------------
// The app screens shown INSIDE the 3D phone. They are drawn on a canvas many
// times a second, so they move like a real app (numbers counting, typing,
// charts growing, Face ID scanning). The canvas is then used as the phone's screen.
// ---------------------------------------------------------------------------

export const W = 600;
export const H = 1292;

const C = {
  bg: "#0d0f0e",
  card: "#181b1a",
  line: "#262a28",
  text: "#f4f4f0",
  muted: "#8b918d",
  mint: "#7ef0c2",
  mintDark: "#0f7b5f",
  red: "#ff8f7a",
};

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const easeOut = (x) => 1 - Math.pow(1 - clamp01(x), 3);

// Small drawing helpers. In Arabic the screen is mirrored: x is measured from the right.
function kit(ctx, lang) {
  const rtl = lang === "ar";
  const X = (x) => (rtl ? W - x : x);
  const font = (size, weight = 500) => `${weight} ${size}px ${rtl ? "'IBM Plex Sans Arabic'," : ""} 'Manrope', sans-serif`;
  return {
    rtl,
    X,
    // write text; align "start" / "end" / "center" follows the language direction
    text(str, x, y, { size = 26, weight = 500, color = C.text, align = "start" } = {}) {
      ctx.font = font(size, weight);
      ctx.fillStyle = color;
      ctx.direction = rtl ? "rtl" : "ltr";
      ctx.textAlign = align === "center" ? "center" : align;
      ctx.fillText(str, X(x), y);
    },
    // numbers and amounts are always written left-to-right
    num(str, x, y, { size = 26, weight = 600, color = C.text, align = "start" } = {}) {
      ctx.font = `${weight} ${size}px 'Manrope', sans-serif`;
      ctx.fillStyle = color;
      ctx.direction = "ltr";
      const a = align === "center" ? "center" : (align === "start") !== rtl ? "left" : "right";
      ctx.textAlign = a;
      ctx.fillText(str, X(x), y);
    },
    rect(x, y, w, h, r, fill) {
      ctx.beginPath();
      ctx.roundRect(rtl ? W - x - w : x, y, w, h, r);
      ctx.fillStyle = fill;
      ctx.fill();
    },
    circle(x, y, r, fill) {
      ctx.beginPath();
      ctx.arc(X(x), y, r, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
    },
  };
}

// Top of every screen: the clock and the battery
function statusBar(ctx) {
  const now = new Date();
  const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
  ctx.font = "700 24px 'Manrope', sans-serif";
  ctx.fillStyle = C.text;
  ctx.textAlign = "left";
  ctx.direction = "ltr";
  ctx.fillText(time, 52, 58);
  // signal bars + battery (always on the right, like a real phone)
  [10, 14, 18, 22].forEach((h, i) => {
    ctx.fillStyle = C.text;
    ctx.fillRect(452 + i * 9, 58 - h, 6, h);
  });
  ctx.strokeStyle = C.text;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(500, 38, 44, 22, 6);
  ctx.stroke();
  ctx.fillRect(504, 42, 30, 14);
}

// Bottom tab bar
function tabBar(ctx, k, active) {
  k.rect(40, 1180, 520, 76, 38, C.card);
  [0, 1, 2, 3].forEach((i) => {
    const x = 110 + i * 127;
    k.circle(x, 1218, i === active ? 22 : 9, i === active ? C.mint : C.muted);
  });
}

const money = (v) => "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ---------- 1. Home ----------
function home(ctx, t, lang) {
  const k = kit(ctx, lang);
  const s = screen[lang];
  k.text(s.hi, 44, 150, { size: 26, color: C.muted });
  k.circle(530, 140, 30, "#2b3d36");
  k.text("S", 530, 150, { size: 26, weight: 700, color: C.mint, align: "center" });

  k.text(s.balance, 44, 230, { size: 24, color: C.muted });
  k.num(money(12480.5 * easeOut(t / 1.4)), 44, 310, { size: 68, weight: 800 });
  k.rect(44, 336, 190, 44, 22, "#173a2e");
  k.num("+4.2%  ↗", 64, 367, { size: 22, weight: 700, color: C.mint });

  // three round actions
  s.actions.forEach((label, i) => {
    const x = 110 + i * 190;
    const pop = easeOut((t - 0.3 - i * 0.1) / 0.5);
    k.circle(x, 470, 46 * pop, i === 0 ? C.mint : C.card);
    ctx.strokeStyle = i === 0 ? C.bg : C.text;
    ctx.lineWidth = 4;
    ctx.beginPath();
    const cx = k.X(x);
    if (i === 0) {
      ctx.moveTo(cx, 488); ctx.lineTo(cx, 452); ctx.moveTo(cx - 13, 465); ctx.lineTo(cx, 452); ctx.lineTo(cx + 13, 465);
    } else if (i === 1) {
      ctx.moveTo(cx, 452); ctx.lineTo(cx, 488); ctx.moveTo(cx - 13, 475); ctx.lineTo(cx, 488); ctx.lineTo(cx + 13, 475);
    } else {
      ctx.moveTo(cx, 452); ctx.lineTo(cx, 488); ctx.moveTo(cx - 18, 470); ctx.lineTo(cx + 18, 470);
    }
    if (pop > 0.9) ctx.stroke();
    k.text(label, x, 556, { size: 22, color: C.muted, align: "center" });
  });

  // recent payments, sliding in one after another
  k.text(s.recent, 44, 650, { size: 28, weight: 700 });
  s.tx.forEach(([name, when, amount], i) => {
    const a = easeOut((t - 0.6 - i * 0.15) / 0.6);
    ctx.globalAlpha = a;
    const y = 690 + i * 112 + (1 - a) * 30;
    k.rect(44, y, 512, 96, 24, C.card);
    k.circle(100, y + 48, 26, ["#24453a", "#3b2f24", "#2b2f45", "#3a2635"][i]);
    k.text(name, 146, y + 42, { size: 24, weight: 700 });
    k.text(when, 146, y + 74, { size: 20, color: C.muted });
    k.num(amount, 530, y + 58, { size: 24, weight: 700, color: amount.startsWith("+") ? C.mint : C.text, align: "end" });
    ctx.globalAlpha = 1;
  });
  tabBar(ctx, k, 0);
}

// ---------- 2. Send money ----------
function send(ctx, t0, lang) {
  const k = kit(ctx, lang);
  const s = screen[lang];
  const t = t0 % 5.5; // the little story repeats every 5.5 seconds
  k.text(s.sendTo, 44, 150, { size: 30, weight: 700 });
  const colors = ["#7ef0c2", "#ffc58f", "#a9c4ff", "#ffb3c7"];
  s.people.forEach((p, i) => {
    const x = 100 + i * 130;
    if (i === 0) k.circle(x, 240, 56, C.mint);
    k.circle(x, 240, 50, i === 0 ? C.bg : C.card);
    k.circle(x, 240, 46, colors[i] + "33");
    k.text(p[0], x, 252, { size: 34, weight: 800, color: colors[i], align: "center" });
    k.text(p, x, 330, { size: 21, color: i === 0 ? C.text : C.muted, align: "center" });
  });

  // the amount is typed digit by digit
  const typed = "250".slice(0, Math.min(3, Math.floor(t / 0.45)));
  k.text(s.amount, 300, 430, { size: 22, color: C.muted, align: "center" });
  k.num("$" + (typed || "0"), 300, 530, { size: 96, weight: 800, align: "center", color: typed ? C.text : C.muted });
  if (Math.floor(t * 2) % 2 === 0 && t < 1.6) {
    ctx.fillStyle = C.mint;
    ctx.fillRect(300 + (typed.length + 1) * 28, 455, 4, 86);
  }

  // keypad; the key being pressed lights up
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];
  const pressed = t < 1.4 ? "250"[Math.floor(t / 0.45)] : null;
  keys.forEach((key, i) => {
    const x = 120 + (i % 3) * 180, y = 640 + Math.floor(i / 3) * 112;
    if (key === pressed && (t % 0.45) < 0.25) k.circle(x, y, 46, C.card);
    k.num(key, x, y + 14, { size: 40, weight: 600, align: "center" });
  });
  const ready = t > 1.4;
  k.rect(44, 1100, 512, 96, 48, ready ? C.mint : C.card);
  k.text(s.sendBtn, 300, 1160, { size: 30, weight: 800, color: ready ? C.bg : C.muted, align: "center" });

  // success: a green tick grows, then the message
  if (t > 2.3) {
    const a = easeOut((t - 2.3) / 0.5);
    ctx.globalAlpha = a * 0.92;
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    k.circle(300, 560, 110 * easeOut((t - 2.4) / 0.5), C.mint);
    const tick = easeOut((t - 2.7) / 0.4);
    ctx.strokeStyle = C.bg;
    ctx.lineWidth = 16;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(250, 562);
    ctx.lineTo(250 + 35 * Math.min(1, tick * 2), 562 + 35 * Math.min(1, tick * 2));
    if (tick > 0.5) ctx.lineTo(285 + 70 * (tick - 0.5) * 2, 597 - 80 * (tick - 0.5) * 2);
    ctx.stroke();
    ctx.globalAlpha = easeOut((t - 2.9) / 0.4);
    k.num("$250.00", 300, 760, { size: 56, weight: 800, align: "center" });
    k.text(s.sent, 300, 820, { size: 28, weight: 700, align: "center" });
    k.text(s.arrived, 300, 864, { size: 22, color: C.muted, align: "center" });
    ctx.globalAlpha = 1;
  }
}

// ---------- 3. AI insights ----------
function insights(ctx, t, lang) {
  const k = kit(ctx, lang);
  const s = screen[lang];
  k.text(s.month, 44, 150, { size: 30, weight: 700 });
  k.text(s.spent, 44, 220, { size: 22, color: C.muted });
  k.num(money(1842 * easeOut(t / 1.2)).replace(".00", ""), 44, 296, { size: 64, weight: 800 });

  // weekly bars growing from the bottom
  const bars = [0.45, 0.7, 0.38, 0.9, 0.55, 0.3, 0.62];
  bars.forEach((v, i) => {
    const h = 230 * v * easeOut((t - 0.2 - i * 0.07) / 0.7);
    const x = 64 + i * 72;
    k.rect(x, 590 - h, 44, h, 14, i === 3 ? C.mint : "#2a302d");
  });
  // categories with progress lines
  s.cats.forEach(([name, v], i) => {
    const y = 660 + i * 76;
    k.text(name, 44, y, { size: 23, weight: 600 });
    k.num(Math.round(v * 100) + "%", 556, y, { size: 22, color: C.muted, align: "end" });
    k.rect(44, y + 18, 512, 10, 5, C.line);
    k.rect(44, y + 18, 512 * v * easeOut((t - 0.5 - i * 0.12) / 0.8), 10, 5, [C.mint, "#ffc58f", "#a9c4ff"][i]);
  });
  // the AI tip card slides up
  const a = easeOut((t - 1.3) / 0.6);
  ctx.globalAlpha = a;
  const y = 920 + (1 - a) * 40;
  k.rect(44, y, 512, 220, 32, "#13352a");
  k.text("✦ " + s.tipTitle, 76, y + 56, { size: 22, weight: 800, color: C.mint });
  k.text(s.tip[0], 76, y + 104, { size: 25, weight: 700 });
  k.text(s.tip[1], 76, y + 142, { size: 23, color: "#cfe9dd" });
  k.rect(76, y + 160, 150, 44, 22, C.mint);
  k.text(s.tipBtn, 151, y + 190, { size: 20, weight: 800, color: C.bg, align: "center" });
  ctx.globalAlpha = 1;
}

// ---------- 4. Cards ----------
function cards(ctx, t0, lang) {
  const k = kit(ctx, lang);
  const s = screen[lang];
  const t = t0 % 6;
  k.text(s.myCards, 44, 150, { size: 30, weight: 700 });
  // the metal card
  const g = ctx.createLinearGradient(44, 200, 556, 520);
  g.addColorStop(0, "#2c3130");
  g.addColorStop(0.5, "#141716");
  g.addColorStop(1, "#262b29");
  ctx.beginPath();
  ctx.roundRect(44, 200, 512, 320, 30);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.font = "800 34px 'Manrope', sans-serif";
  ctx.fillStyle = C.text;
  ctx.textAlign = "left";
  ctx.direction = "ltr";
  ctx.fillText("NUVO", 80, 262);
  ctx.fillStyle = "#c9b27a";
  ctx.beginPath();
  ctx.roundRect(80, 320, 66, 50, 10);
  ctx.fill();
  ctx.font = "600 28px 'Manrope', sans-serif";
  ctx.fillStyle = "#cfd3d1";
  ctx.fillText("•••• •••• •••• 4821", 80, 440);
  ctx.font = "600 20px 'Manrope', sans-serif";
  ctx.fillText("SARA K.        09/29", 80, 488);

  // freezing: the toggle turns on, the card turns icy
  const frozen = t > 1.2 && t < 4.4;
  const f = frozen ? easeOut((t - 1.2) / 0.5) : 1 - easeOut((t - 4.4) / 0.5);
  if (f > 0) {
    ctx.globalAlpha = f * 0.75;
    ctx.beginPath();
    ctx.roundRect(44, 200, 512, 320, 30);
    ctx.fillStyle = "#bfe7ff";
    ctx.fill();
    ctx.globalAlpha = f;
    ctx.font = "800 34px 'Manrope', sans-serif";
    ctx.fillStyle = "#0d2b3a";
    ctx.textAlign = "center";
    ctx.fillText("❄  FROZEN", 300, 375);
    ctx.globalAlpha = 1;
  }
  // pager dots
  [0, 1, 2].forEach((i) => k.circle(270 + i * 30, 560, i === 0 ? 8 : 6, i === 0 ? C.text : C.line));

  // settings rows with switches
  const rows = [
    [s.freeze, f],
    [s.online, 1],
  ];
  rows.forEach(([label, on], i) => {
    const y = 620 + i * 112;
    k.rect(44, y, 512, 92, 24, C.card);
    k.text(label, 80, y + 56, { size: 25, weight: 600 });
    k.rect(436, y + 26, 84, 42, 21, on > 0.5 ? C.mint : C.line);
    k.circle(457 + 42 * on, y + 47, 17, C.text); // the knob slides when the switch turns on
  });
  // monthly limit slider
  const y = 844;
  k.rect(44, y, 512, 140, 24, C.card);
  k.text(s.limit, 80, y + 52, { size: 25, weight: 600 });
  k.num("$2,000", 520, y + 52, { size: 24, weight: 700, color: C.mint, align: "end" });
  k.rect(80, y + 92, 440, 10, 5, C.line);
  k.rect(80, y + 92, 440 * 0.55, 10, 5, C.mint);
  k.circle(80 + 440 * 0.55, y + 97, 16, C.text);
  tabBar(ctx, k, 2);
}

// ---------- 5. Face ID ----------
function security(ctx, t0, lang) {
  const k = kit(ctx, lang);
  const s = screen[lang];
  const t = t0 % 4.5;
  k.text(s.faceTitle, 300, 200, { size: 32, weight: 800, align: "center" });
  k.text(s.faceShop, 300, 250, { size: 23, color: C.muted, align: "center" });
  const done = t > 1.9;
  const cx = 300, cy = 600, r = 150;
  // the four corners of the Face ID frame
  ctx.strokeStyle = done ? C.mint : C.text;
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].forEach(([sx, sy]) => {
    ctx.beginPath();
    ctx.moveTo(cx + sx * r, cy + sy * (r - 50));
    ctx.quadraticCurveTo(cx + sx * r, cy + sy * r, cx + sx * (r - 50), cy + sy * r);
    ctx.stroke();
  });
  if (!done) {
    // a simple face + a scanning line moving down
    ctx.strokeStyle = C.muted;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(cx - 45, cy - 40);
    ctx.lineTo(cx - 45, cy - 15);
    ctx.moveTo(cx + 45, cy - 40);
    ctx.lineTo(cx + 45, cy - 15);
    ctx.moveTo(cx, cy - 30);
    ctx.lineTo(cx, cy + 20);
    ctx.lineTo(cx - 14, cy + 20);
    ctx.moveTo(cx - 45, cy + 55);
    ctx.quadraticCurveTo(cx, cy + 85, cx + 45, cy + 55);
    ctx.stroke();
    const sy = cy - r + ((t * 1.3) % 1) * r * 2;
    const g = ctx.createLinearGradient(0, sy - 40, 0, sy);
    g.addColorStop(0, "rgba(126,240,194,0)");
    g.addColorStop(1, "rgba(126,240,194,0.55)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - r + 10, sy - 40, r * 2 - 20, 40);
  } else {
    const a = easeOut((t - 1.9) / 0.4);
    k.circle(cx, cy, 90 * a, C.mint);
    ctx.strokeStyle = C.bg;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(cx - 38, cy + 2);
    ctx.lineTo(cx - 10, cy + 30);
    ctx.lineTo(cx + 42, cy - 26);
    if (a > 0.7) ctx.stroke();
    ctx.globalAlpha = a;
    k.text(s.faceDone, 300, 860, { size: 34, weight: 800, align: "center", color: C.mint });
    ctx.globalAlpha = 1;
  }
}

// ---------- 6. App icon (last section) ----------
function icon(ctx, t) {
  const g = ctx.createRadialGradient(W / 2, H * 0.42, 0, W / 2, H * 0.42, 500);
  g.addColorStop(0, "#14382c");
  g.addColorStop(1, C.bg);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const s = 0.9 + 0.1 * easeOut(t / 0.6);
  ctx.save();
  ctx.translate(W / 2, H * 0.42);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.roundRect(-110, -110, 220, 220, 56);
  ctx.fillStyle = C.mint;
  ctx.fill();
  ctx.font = "800 120px 'Manrope', sans-serif";
  ctx.fillStyle = C.bg;
  ctx.textAlign = "center";
  ctx.direction = "ltr";
  ctx.fillText("N", 0, 44);
  ctx.restore();
  ctx.font = "800 44px 'Manrope', sans-serif";
  ctx.fillStyle = C.text;
  ctx.textAlign = "center";
  ctx.fillText("NUVO", W / 2, H * 0.42 + 200);
}

const SCREENS = [home, send, insights, cards, security, icon];

// Draws screen number `index` (t = seconds since it appeared).
// While changing screens, the new one slides in over the old one.
export function drawScreen(ctx, index, t, previous, lang) {
  ctx.save();
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  const slide = easeOut(t / 0.45);
  if (slide < 1 && previous !== null && previous !== index) {
    ctx.save();
    ctx.globalAlpha = 1 - slide;
    SCREENS[previous](ctx, 10, lang);
    ctx.restore();
    ctx.translate(0, (1 - slide) * 80);
    ctx.globalAlpha = slide;
  }
  ctx.fillStyle = C.bg;
  if (slide < 1) ctx.fillRect(0, 0, W, H);
  SCREENS[index](ctx, t, lang);
  ctx.restore();
  if (index !== 5) statusBar(ctx);
}
