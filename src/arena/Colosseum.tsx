import {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {ellipseRing, makeSand, makeSky, makeStone, rng} from './util';

export const A0 = 16; // semieje X de la arena
export const B0 = 12; // semieje Z de la arena
const TIERS = 10;
const TIER_W = 0.62;
const TIER_H = 0.75;
const BASE_H = 1.5;
const FA = A0 + TIERS * TIER_W + 0.75; // fachada
const FB = B0 + TIERS * TIER_W + 0.75;
const LEVEL_H = 4.6;
const N_BAYS = 52;

const ring = (a1: number, b1: number, a2: number, b2: number, height: number) => {
  const shape = new THREE.Shape();
  shape.absellipse(0, 0, a2, b2, 0, Math.PI * 2, false, 0);
  const hole = new THREE.Path();
  hole.absellipse(0, 0, a1, b1, 0, Math.PI * 2, true, 0);
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, {depth: height, bevelEnabled: false, curveSegments: 96});
  geo.rotateX(-Math.PI / 2);
  return geo;
};

const panelGeo = (kind: 'ground' | 'arch' | 'attic', w: number) => {
  const H = kind === 'attic' ? 3.6 : LEVEL_H;
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(w / 2, 0);
  s.lineTo(w / 2, H);
  s.lineTo(-w / 2, H);
  s.lineTo(-w / 2, 0);
  const h = new THREE.Path();
  if (kind === 'attic') {
    h.moveTo(-0.28, 1.1);
    h.lineTo(0.28, 1.1);
    h.lineTo(0.28, 2.5);
    h.lineTo(-0.28, 2.5);
    h.lineTo(-0.28, 1.1);
  } else {
    const y0 = kind === 'ground' ? 0 : 0.55;
    const ah = kind === 'ground' ? 3.5 : 3.3;
    const r = 0.72;
    h.moveTo(-r, y0);
    h.lineTo(r, y0);
    h.lineTo(r, y0 + ah - r);
    h.absarc(0, y0 + ah - r, r, 0, Math.PI, false);
    h.lineTo(-r, y0);
  }
  s.holes.push(h);
  const g = new THREE.ExtrudeGeometry(s, {depth: 0.9, bevelEnabled: false, curveSegments: 14});
  g.translate(0, 0, -0.45);
  return g;
};

export const Colosseum: React.FC<{frame: number}> = ({frame}) => {
  const stone = useMemo(() => makeStone(0.25), []);
  const stoneRing = useMemo(() => makeStone(0.12), []);
  const sand = useMemo(() => makeSand(5), []);
  const sky = useMemo(() => makeSky(), []);

  const tiers = useMemo(() => {
    const list: THREE.BufferGeometry[] = [];
    for (let k = 0; k < TIERS; k++) {
      list.push(
        ring(A0 + k * TIER_W, B0 + k * TIER_W, A0 + (k + 1) * TIER_W, B0 + (k + 1) * TIER_W, BASE_H + (k + 1) * TIER_H),
      );
    }
    list.push(ring(A0 + TIERS * TIER_W, B0 + TIERS * TIER_W, FA, FB, BASE_H + TIERS * TIER_H));
    return list;
  }, []);

  const bays = useMemo(() => ellipseRing(FA, FB, N_BAYS), []);
  const w = bays.total / N_BAYS + 0.03;
  const geos = useMemo(
    () => ({ground: panelGeo('ground', w), arch: panelGeo('arch', w), attic: panelGeo('attic', w)}),
    [w],
  );
  const ledges = useMemo(
    () => [1, 2, 3].map((L) => ({y: L * LEVEL_H - 0.18, geo: ring(FA - 0.55, FB - 0.55, FA + 0.4, FB + 0.4, 0.36)})),
    [],
  );
  const topLedge = useMemo(() => ring(FA - 0.5, FB - 0.5, FA + 0.4, FB + 0.4, 0.5), []);

  const refs = [useRef<THREE.InstancedMesh>(null), useRef<THREE.InstancedMesh>(null), useRef<THREE.InstancedMesh>(null), useRef<THREE.InstancedMesh>(null)];
  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    const levels = [0, 1, 2, 3];
    levels.forEach((L, li) => {
      const m = refs[li].current;
      if (!m) return;
      bays.points.forEach((p, i) => {
        d.position.set(p.x, L * LEVEL_H, p.z);
        d.rotation.set(0, p.ry, 0);
        d.updateMatrix();
        m.setMatrixAt(i, d.matrix);
      });
      m.instanceMatrix.needsUpdate = true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bays]);


  return (
    <group>
      {/* cielo */}
      <mesh>
        <sphereGeometry args={[220, 32, 32]} />
        <meshBasicMaterial map={sky} side={THREE.BackSide} fog={false} />
      </mesh>

      {/* arena de arena */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[A0, B0, 1]} receiveShadow>
        <circleGeometry args={[1, 128]} />
        <meshStandardMaterial map={sand} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} scale={[60, 60, 1]} receiveShadow>
        <circleGeometry args={[1, 32]} />
        <meshStandardMaterial color="#6b5a45" roughness={1} />
      </mesh>

      {/* gradas */}
      {tiers.map((g, i) => (
        <mesh key={i} geometry={g} castShadow receiveShadow>
          <meshStandardMaterial map={stoneRing} roughness={0.95} bumpMap={stoneRing} bumpScale={1.2} />
        </mesh>
      ))}

      {/* fachada: 3 niveles de arcos + ático */}
      {[geos.ground, geos.arch, geos.arch, geos.attic].map((g, li) => (
        <instancedMesh key={li} ref={refs[li]} args={[g, undefined, N_BAYS]} position={[0, 0, 0]} castShadow receiveShadow>
          <meshStandardMaterial map={stone} roughness={0.95} bumpMap={stone} bumpScale={2.2} />
        </instancedMesh>
      ))}
      {ledges.map((l, i) => (
        <mesh key={i} geometry={l.geo} position={[0, l.y, 0]} castShadow receiveShadow>
          <meshStandardMaterial map={stoneRing} roughness={0.9} />
        </mesh>
      ))}
      <mesh geometry={topLedge} position={[0, 3 * LEVEL_H + 3.6, 0]} castShadow receiveShadow>
        <meshStandardMaterial map={stoneRing} roughness={0.9} />
      </mesh>
    </group>
  );
};

const SKIN = ['#f0c9a4', '#d9a77e', '#b9825a', '#8d5c3a', '#6b4429'];
const CLOTH = ['#eee3cc', '#d8c9a3', '#a63a2e', '#7a4a2a', '#3d4f6b', '#c79b4a', '#e9dcc0'];

export const Crowd: React.FC<{frame: number}> = ({frame}) => {
  const bodies = useRef<THREE.InstancedMesh>(null);
  const heads = useRef<THREE.InstancedMesh>(null);

  const people = useMemo(() => {
    const r = rng(99);
    const list: {x: number; y: number; z: number; phase: number; cloth: THREE.Color; skin: THREE.Color; fest: boolean}[] = [];
    for (let k = 0; k < TIERS; k++) {
      const a = A0 + k * TIER_W + TIER_W * 0.55;
      const b = B0 + k * TIER_W + TIER_W * 0.55;
      const count = Math.floor(ellipseRing(a, b, 1).total / 0.62);
      const {points} = ellipseRing(a, b, count);
      points.forEach((p) => {
        if (r() < 0.12) return; // asientos vacíos
        list.push({
          x: p.x,
          z: p.z,
          y: BASE_H + (k + 1) * TIER_H,
          phase: r() * 6.28,
          cloth: new THREE.Color(CLOTH[Math.floor(r() * CLOTH.length)]),
          skin: new THREE.Color(SKIN[Math.floor(r() * SKIN.length)]),
          fest: r() < 0.4,
        });
      });
    }
    return list;
  }, []);

  useLayoutEffect(() => {
    if (!bodies.current || !heads.current) return;
    people.forEach((p, i) => {
      bodies.current!.setColorAt(i, p.cloth);
      heads.current!.setColorAt(i, p.skin);
    });
    bodies.current.instanceColor!.needsUpdate = true;
    heads.current.instanceColor!.needsUpdate = true;
  }, [people]);

  useLayoutEffect(() => {
    if (!bodies.current || !heads.current) return;
    const d = new THREE.Object3D();
    people.forEach((p, i) => {
      const jump = p.fest ? Math.max(0, Math.sin(frame * 0.35 + p.phase)) * 0.18 : 0;
      d.position.set(p.x, p.y + 0.42 + jump, p.z);
      d.rotation.set(0, 0, 0);
      d.updateMatrix();
      bodies.current!.setMatrixAt(i, d.matrix);
      d.position.set(p.x, p.y + 0.98 + jump, p.z);
      d.updateMatrix();
      heads.current!.setMatrixAt(i, d.matrix);
    });
    bodies.current.instanceMatrix.needsUpdate = true;
    heads.current.instanceMatrix.needsUpdate = true;
  }, [frame, people]);

  return (
    <>
      <instancedMesh ref={bodies} args={[undefined, undefined, people.length]}>
        <capsuleGeometry args={[0.17, 0.36, 2, 6]} />
        <meshStandardMaterial roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[undefined, undefined, people.length]}>
        <sphereGeometry args={[0.12, 8, 6]} />
        <meshStandardMaterial roughness={0.7} />
      </instancedMesh>
    </>
  );
};
