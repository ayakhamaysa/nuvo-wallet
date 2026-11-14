import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { drawScreen, H as SH, W as SW } from "./screens";

// ---------------------------------------------------------------------------
// The phone, built in code: titanium frame, glass front with a live screen,
// the "island" at the top, side buttons, and a camera bump on the back.
// ---------------------------------------------------------------------------

const PW = 1, PH = 2.06, PD = 0.095, R = 0.16; // width, height, depth, corner radius

// A flat rounded rectangle, with picture coordinates (0..1) so a texture fits it exactly
function roundedPlane(w, h, r) {
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
  const g = new THREE.ShapeGeometry(s, 24);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5);
  return g;
}

export default function Phone({ screenIndex, lang }) {
  // The live screen: a canvas we draw the app on, used as a picture on the glass
  const { canvas, ctx, texture } = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = SW;
    canvas.height = SH;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return { canvas, ctx: canvas.getContext("2d"), texture };
  }, []);

  const shown = useRef({ index: 0, since: 0, previous: null });

  useFrame((state) => {
    const now = state.clock.elapsedTime;
    const want = screenIndex.current;
    if (want !== shown.current.index) {
      shown.current = { index: want, since: now, previous: shown.current.index };
    }
    drawScreen(ctx, shown.current.index, now - shown.current.since, shown.current.previous, lang);
    texture.needsUpdate = true;
  });
  void canvas;

  const geo = useMemo(
    () => ({
      glass: roundedPlane(PW - 0.016, PH - 0.016, R - 0.008),
      screen: roundedPlane(PW - 0.07, PH - 0.07, R - 0.035),
      island: roundedPlane(0.27, 0.075, 0.0375),
      back: roundedPlane(PW - 0.016, PH - 0.016, R - 0.008),
    }),
    []
  );

  const mats = useMemo(
    () => ({
      // brushed titanium frame
      frame: new THREE.MeshPhysicalMaterial({ color: "#8e918f", metalness: 1, roughness: 0.28, clearcoat: 0.3 }),
      // black glass around the screen
      glass: new THREE.MeshPhysicalMaterial({ color: "#050505", roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02 }),
      // the screen glows by itself (not lit by the room), like a real display
      screen: new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }),
      // matte frosted glass on the back, in the brand green
      back: new THREE.MeshPhysicalMaterial({ color: "#1d3a31", roughness: 0.55, clearcoat: 0.6, clearcoatRoughness: 0.4 }),
      lens: new THREE.MeshPhysicalMaterial({ color: "#07090a", roughness: 0.05, clearcoat: 1, metalness: 0.3 }),
      lensRing: new THREE.MeshPhysicalMaterial({ color: "#a7aaa8", metalness: 1, roughness: 0.18 }),
    }),
    [texture]
  );

  return (
    <group>
      {/* frame: a rounded slab of titanium */}
      <RoundedBox args={[PW, PH, PD]} radius={0.06} smoothness={6} material={mats.frame} />
      {/* front glass + screen + island */}
      <mesh geometry={geo.glass} material={mats.glass} position-z={PD / 2 + 0.001} />
      <mesh geometry={geo.screen} material={mats.screen} position-z={PD / 2 + 0.002} />
      <mesh geometry={geo.island} position={[0, PH / 2 - 0.085, PD / 2 + 0.003]}>
        <meshBasicMaterial color="#000000" />
      </mesh>
      {/* side buttons */}
      {[
        [PW / 2 + 0.006, 0.42, 0.24],
        [-PW / 2 - 0.006, 0.55, 0.1],
        [-PW / 2 - 0.006, 0.36, 0.17],
        [-PW / 2 - 0.006, 0.14, 0.17],
      ].map(([x, y, h], i) => (
        <RoundedBox key={i} args={[0.02, h, 0.035]} radius={0.008} position={[x, y, 0]} material={mats.frame} />
      ))}
      {/* back glass */}
      <mesh geometry={geo.back} material={mats.back} position-z={-PD / 2 - 0.001} rotation-y={Math.PI} />
      {/* camera bump with three lenses and a flash */}
      <group position={[-0.2, PH / 2 - 0.3, -PD / 2]}>
        <RoundedBox args={[0.46, 0.46, 0.04]} radius={0.015} smoothness={4} position-z={-0.015} material={mats.back} />
        {[
          [-0.1, 0.1],
          [-0.1, -0.1],
          [0.1, 0],
        ].map(([x, y], i) => (
          <group key={i} position={[x, y, -0.04]} rotation-x={Math.PI / 2}>
            <mesh material={mats.lensRing}>
              <cylinderGeometry args={[0.078, 0.082, 0.03, 48]} />
            </mesh>
            <mesh position-y={-0.016} material={mats.lens}>
              <cylinderGeometry args={[0.058, 0.058, 0.004, 48]} />
            </mesh>
          </group>
        ))}
        <mesh position={[0.1, 0.15, -0.037]}>
          <circleGeometry args={[0.025, 24]} />
          <meshBasicMaterial color="#f4e6c8" side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}
