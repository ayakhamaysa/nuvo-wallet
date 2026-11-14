import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// Three bank cards in 3D (metal black, mint, sand). They float behind the phone
// at the top of the page, and fan out in front of it in the "Cards" section.
// ---------------------------------------------------------------------------

// The printed face of a card, drawn on a canvas
function cardFace({ from, to, ink, label }) {
  const c = document.createElement("canvas");
  c.width = 856;
  c.height = 540;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 856, 540);
  g.addColorStop(0, from);
  g.addColorStop(1, to);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 856, 540);
  // fine brushed lines, like metal
  for (let y = 0; y < 540; y += 3) {
    ctx.fillStyle = `rgba(255,255,255,${0.012 + (y % 9 === 0 ? 0.02 : 0)})`;
    ctx.fillRect(0, y, 856, 1);
  }
  ctx.fillStyle = ink;
  ctx.font = "800 64px 'Manrope', sans-serif";
  ctx.fillText("NUVO", 60, 110);
  ctx.font = "600 26px 'Manrope', sans-serif";
  ctx.globalAlpha = 0.7;
  ctx.fillText(label, 60, 152);
  ctx.globalAlpha = 1;
  // chip
  const chip = ctx.createLinearGradient(60, 210, 170, 290);
  chip.addColorStop(0, "#e9d49b");
  chip.addColorStop(1, "#a88a4b");
  ctx.fillStyle = chip;
  ctx.beginPath();
  ctx.roundRect(60, 210, 110, 82, 14);
  ctx.fill();
  // contactless waves
  ctx.strokeStyle = ink;
  ctx.lineWidth = 5;
  [18, 32, 46].forEach((r) => {
    ctx.beginPath();
    ctx.arc(200, 251, r, -0.7, 0.7);
    ctx.stroke();
  });
  ctx.font = "600 40px 'Manrope', sans-serif";
  ctx.fillText("••••  ••••  ••••  4821", 60, 420);
  ctx.font = "600 26px 'Manrope', sans-serif";
  ctx.fillText("SARA K.", 60, 480);
  ctx.fillText("09/29", 690, 480);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

const CARDS = [
  { from: "#2a2e2d", to: "#0c0e0d", ink: "#e9ece9", label: "METAL", metal: 0.85 },
  { from: "#8ff3cc", to: "#3cc796", ink: "#0d2b20", label: "EVERYDAY", metal: 0.2 },
  { from: "#efe3cf", to: "#cdb796", ink: "#3b2e1d", label: "VIRTUAL", metal: 0.3 },
];

// Where each card sits: behind the phone (spread 0) and fanned out in front (spread 1)
const BEHIND = [
  { p: [0.95, 0.55, -0.6], r: [0.2, -0.5, 0.35] },
  { p: [-0.95, -0.2, -0.5], r: [-0.15, 0.55, -0.3] },
  { p: [0.7, -0.75, -0.8], r: [0.3, -0.3, -0.2] },
];
const FANNED = [
  { p: [-0.75, 0.05, 0.45], r: [0.05, 0.3, 0.32] },
  { p: [0, -0.1, 0.6], r: [0.05, 0, 0] },
  { p: [0.75, 0.05, 0.45], r: [0.05, -0.3, -0.32] },
];

// A card shape: a thin slab with rounded corners. Group 0 = front and back, group 1 = the edge
function cardGeometry() {
  const w = 1, h = 0.63, r = 0.05;
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: false, curveSegments: 12 });
  g.translate(0, 0, -0.006);
  // stretch the printed picture over the whole face
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5);
  return g;
}

export default function Cards({ spread, visible }) {
  const geometry = useMemo(() => cardGeometry(), []);
  const mats = useMemo(
    () =>
      CARDS.map((c) => {
        const face = new THREE.MeshPhysicalMaterial({ map: cardFace(c), metalness: c.metal, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1 });
        const edge = new THREE.MeshPhysicalMaterial({ color: c.to, metalness: c.metal, roughness: 0.3 });
        return [face, edge];
      }),
    []
  );
  const refs = useRef([]);
  const a = useMemo(() => new THREE.Vector3(), []);
  const b = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const s = spread.current;
    const v = visible.current;
    const t = state.clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      a.fromArray(BEHIND[i].p);
      b.fromArray(FANNED[i].p);
      m.position.lerpVectors(a, b, s);
      m.position.y += Math.sin(t * 0.8 + i * 2) * 0.04 * (1 - s); // gentle floating
      m.rotation.set(
        THREE.MathUtils.lerp(BEHIND[i].r[0], FANNED[i].r[0], s),
        THREE.MathUtils.lerp(BEHIND[i].r[1], FANNED[i].r[1], s),
        THREE.MathUtils.lerp(BEHIND[i].r[2], FANNED[i].r[2], s)
      );
      m.scale.setScalar(Math.max(0.0001, v));
    });
  });

  return (
    <group>
      {mats.map((m, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} geometry={geometry} material={m} />
      ))}
    </group>
  );
}
