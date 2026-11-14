import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import Phone from "./Phone";
import Cards from "./Cards";

// Where the phone stands in each section of the page (in order).
// x: left/right, y: up/down, rx/ry/rz: tilt and turn, size: how big,
// screen: which app screen it shows, cards: how much the bank cards show,
// spread: 0 = cards float behind, 1 = cards fan out in front
const POSES = [
  { x: 0, y: -0.25, rx: 0.12, ry: -0.28, rz: 0.04, size: 0.8, screen: 0, cards: 1, spread: 0, phoneY: -0.3, phoneSize: 0.58 }, // hero (below the title)
  { x: 0.42, y: 0, rx: 0.04, ry: -0.42, rz: 0.03, size: 1, screen: 1, cards: 0, spread: 0 , phoneY: 0.2, phoneSize: 0.68 }, // send
  { x: -0.42, y: 0, rx: 0.04, ry: 0.42, rz: -0.03, size: 1, screen: 2, cards: 0, spread: 0 , phoneY: 0.2, phoneSize: 0.68 }, // insights
  { x: 0.4, y: 0.02, rx: 0.1, ry: -0.18, rz: 0, size: 0.9, screen: 3, cards: 1, spread: 1 , phoneY: 0.2, phoneSize: 0.68 }, // cards
  { x: -0.42, y: 0, rx: 0.02, ry: 0.32, rz: -0.02, size: 1, screen: 4, cards: 0, spread: 0 , phoneY: 0.2, phoneSize: 0.68 }, // security
  { x: 0.4, y: 0, rx: 0.08, ry: -0.32, rz: 0.04, size: 0.9, screen: 5, cards: 1, spread: 0 , phoneY: 0.2, phoneSize: 0.68 }, // get the app: front, app icon, cards around
];

const mix = (a, b, t) => {
  const out = {};
  for (const k of Object.keys(a)) out[k] = a[k] + (b[k] - a[k]) * t;
  return out;
};

function Rig({ stage, spin, rtl, lang, heroEnd }) {
  const group = useRef();
  const screenIndex = useRef(0);
  const spread = useRef(0);
  const cardsShown = useRef(1);
  const intro = useRef(0);
  const fix = useRef(0); // small correction so the phone sits right under the buttons
  const topPoint = useMemo(() => new THREE.Vector3(), []);
  const { viewport } = useThree();
  const phone = viewport.aspect < 0.9;

  useFrame((state, frameDelta) => {
    const delta = Math.min(frameDelta, 0.1);
    intro.current = Math.min(1, intro.current + delta * 0.7);
    const ease = 1 - Math.pow(1 - intro.current, 3);
    const i = Math.min(POSES.length - 1, Math.floor(stage.current));
    const p = mix(POSES[i], POSES[Math.min(POSES.length - 1, i + 1)], stage.current - i);
    screenIndex.current = POSES[Math.min(POSES.length - 1, Math.round(stage.current))].screen;

    const base = (viewport.height * (phone ? 0.5 : 0.72)) / 2.06; // phone is 2.06 units tall
    // On phones, at the top of the page: put a big phone right under the hero text
    // (heroEnd = where the store buttons end, as a part of the screen height, 0..1)
    let phoneY = p.phoneY, phoneSize = p.phoneSize, deskY = p.y;
    const el = stage.current < 1 && document.getElementById("hero-end");
    if (el) heroEnd.current = (el.getBoundingClientRect().bottom + window.scrollY) / window.innerHeight;
    const w = Math.max(0, 1 - stage.current); // 1 at the very top, 0 from the next section on
    if (!phone) {
      // Big screens: the hero phone also starts just under the store buttons (it may run past the bottom)
      const height = 0.72 * POSES[0].size; // phone height as a part of the screen height
      const heroY = 0.5 - (heroEnd.current + 0.03 + height / 2); // first guess; corrected below
      deskY = deskY + (heroY - POSES[0].y) * w;
    }
    if (phone) {
      // big phone whose top starts just under the buttons; its bottom may go past the screen (like on desktop)
      // phone height = 0.5 * size of the screen height; never wider than half the screen width
      const heroSize = Math.min(1.0, (viewport.width / viewport.height) * 2.06);
      const top = heroEnd.current + 0.04; // a clear gap under the buttons
      const heroY = 0.5 - (top + (0.5 * heroSize) / 2);
      phoneY = phoneY + (heroY - POSES[0].phoneY) * w;
      phoneSize = phoneSize + (heroSize - POSES[0].phoneSize) * w;
    }
    const g = group.current;
    const want = {
      x: phone ? 0 : p.x * viewport.width * 0.45 * (rtl ? -1 : 1),
      y: phone ? viewport.height * phoneY + (1 - ease) * -1.2 : deskY * viewport.height + (1 - ease) * -1.2,
      s: base * (phone ? phoneSize : p.size),
      rx: p.rx + Math.sin(state.clock.elapsedTime * 0.6) * 0.015, // a tiny breathing tilt
      ry: p.ry * (rtl ? -1 : 1) + spin.current + (1 - ease) * -0.8,
      rz: p.rz * (rtl ? -1 : 1),
    };

    // Top of the page: check where the phone's top edge REALLY shows on screen
    // (after tilt and perspective), and nudge it so it sits a little under the store buttons.
    if (w > 0 && intro.current > 0.99) {
      topPoint.set(0, 1.03, 0); // top edge of the phone (it is 2.06 tall, centred)
      g.localToWorld(topPoint).project(state.camera); // -1 = bottom of screen, 1 = top
      const shownTop = (1 - topPoint.y) / 2; // 0 = top of screen, 1 = bottom
      const wantTop = heroEnd.current + 0.03;
      fix.current += (shownTop - wantTop) * viewport.height * 0.15; // move up/down a bit each frame
    } else {
      fix.current *= 0.9;
    }
    want.y += fix.current * w;
    const k = Math.min(1, delta * 3.4);
    g.position.x += (want.x - g.position.x) * k;
    g.position.y += (want.y - g.position.y) * k;
    g.scale.setScalar(g.scale.x + (want.s - g.scale.x) * k);
    g.rotation.x += (want.rx - g.rotation.x) * k;
    g.rotation.y += (want.ry - g.rotation.y) * k;
    g.rotation.z += (want.rz - g.rotation.z) * k;
    spread.current += (p.spread - spread.current) * k;
    cardsShown.current += (p.cards - cardsShown.current) * k;
  });

  return (
    <group ref={group} scale={0.01}>
      <Phone screenIndex={screenIndex} lang={lang} />
      <Cards spread={spread} visible={cardsShown} />
    </group>
  );
}

// A bright, soft studio: big white panels for clean reflections on the frame and cards
function Studio() {
  return (
    <Environment resolution={256}>
      <color attach="background" args={["#d9ddd8"]} />
      <Lightformer form="rect" intensity={2.5} position={[0, 5, 2]} rotation-x={Math.PI / 2} scale={[10, 3, 1]} />
      <Lightformer form="rect" intensity={1.6} position={[-5, 1, 2]} rotation-y={Math.PI / 2} scale={[2, 6, 1]} />
      <Lightformer form="rect" intensity={1.6} position={[5, 1, 2]} rotation-y={-Math.PI / 2} scale={[2, 6, 1]} />
      <Lightformer form="rect" intensity={1} position={[0, 0, 6]} scale={[6, 3, 1]} />
      <Lightformer form="rect" intensity={0} color="#000000" position={[0, -3, -4]} scale={[10, 4, 1]} />
    </Environment>
  );
}

// The fixed 3D layer behind the page. Drag sideways to turn the phone.
export default function Stage({ stage, rtl, lang }) {
  // Where the hero text ends on screen (measured from the page), so the phone sits right under it
  const heroEnd = useRef(0.6);
  useEffect(() => {
    const measure = () => {
      const el = document.getElementById("hero-end");
      if (el) heroEnd.current = (el.getBoundingClientRect().bottom + window.scrollY) / window.innerHeight;
    };
    measure();
    const t = setTimeout(measure, 1200); // again after fonts and animations settle
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
    };
  }, []);
  const spin = useRef(0);
  const lastX = useRef(null);
  const [ready, setReady] = useState(false);

  // Start the 3D after the page text has appeared (faster first screen)
  useEffect(() => {
    const start = () => ("requestIdleCallback" in window ? requestIdleCallback(() => setReady(true), { timeout: 1200 }) : setReady(true));
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => window.removeEventListener("load", start);
  }, []);

  return (
    <div
      className="fixed inset-0 z-10 cursor-grab active:cursor-grabbing touch-pan-y"
      onPointerDown={(e) => (lastX.current = e.clientX)}
      onPointerMove={(e) => {
        if (lastX.current === null) return;
        spin.current += (e.clientX - lastX.current) * 0.01;
        lastX.current = e.clientX;
      }}
      onPointerUp={() => (lastX.current = null)}
      onPointerLeave={() => (lastX.current = null)}
      onPointerCancel={() => (lastX.current = null)}
    >
      {/* soft mint glow behind the phone */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vmin] h-[70vmin] rounded-full blur-[120px] opacity-40 bg-mint pointer-events-none" />
      {ready && (
        <Canvas camera={{ position: [0, 0, 10], fov: 30 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }}>
          <Suspense fallback={null}>
            <Studio />
            <ambientLight intensity={0.4} />
            <directionalLight position={[3, 4, 6]} intensity={1.2} />
            <Rig stage={stage} spin={spin} rtl={rtl} lang={lang} heroEnd={heroEnd} />
            <ContactShadows position={[0, -2.6, 0]} opacity={0.25} scale={10} blur={3} far={4} />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}
