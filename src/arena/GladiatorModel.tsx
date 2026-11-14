import {useEffect, useMemo, useState} from 'react';
import {cancelRender, continueRender, delayRender, staticFile} from 'remotion';
import * as THREE from 'three';
import {GLTFLoader, type GLTF} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {clone as cloneSkinned} from 'three/examples/jsm/utils/SkeletonUtils.js';
import {Gladiator} from './Gladiator';
import {makePlate} from './util';

export const MODEL_URL = staticFile('models/gladiator.glb');

/** Carga el modelo una sola vez. Devuelve null si no existe (se usa el fallback). */
let cache: Promise<GLTF | null> | null = null;
const loadModel = () => {
  if (!cache) {
    cache = fetch(MODEL_URL, {method: 'HEAD'})
      .then((r) => (r.ok && !(r.headers.get('content-type') ?? '').includes('html') ? new GLTFLoader().loadAsync(MODEL_URL) : null))
      .catch(() => null);
  }
  return cache;
};

type Props = {
  index: number;
  total: number;
  name: string;
  color: string;
  eliminated: boolean;
  frame: number;
  fps: number;
  radius: number;
  rise: number;
};

/** Carga el modelo antes de montar la escena 3D. ready=false mientras carga. */
export const useGladiatorModel = () => {
  const [gltf, setGltf] = useState<GLTF | null>(null);
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender('Cargando modelo de gladiador'));
  useEffect(() => {
    loadModel()
      .then((g) => {
        setGltf(g);
        setReady(true);
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
  }, [handle]);
  return {gltf, ready};
};

export const GladiatorAuto: React.FC<Props & {gltf: GLTF | null}> = ({gltf, ...props}) => {
  if (!gltf) return <Gladiator {...props} />;
  return <ModelGladiator {...props} gltf={gltf} />;
};

const ModelGladiator: React.FC<Props & {gltf: GLTF}> = ({
  gltf, index, total, name, color, eliminated, frame, fps, radius, rise,
}) => {
  const th = (index / total) * Math.PI * 2;
  const face = Math.atan2(-Math.cos(th), -Math.sin(th));
  const plate = useMemo(() => makePlate(name, color), [name, color]);

  const {root, mixer, scale} = useMemo(() => {
    const root = cloneSkinned(gltf.scene) as THREE.Object3D;
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root, true);
    const size = box.max.y - box.min.y;
    const scale = size > 0 && Number.isFinite(size) ? 1.85 / size : 1;
    // apoyar los pies en el suelo
    root.position.y = -box.min.y;
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    const mixer = gltf.animations.length ? new THREE.AnimationMixer(root) : null;
    if (mixer) mixer.clipAction(gltf.animations[0]).play();
    return {root, mixer, scale};
  }, [gltf]);

  // la animación sigue el fotograma, no el reloj, para que el render sea determinista
  mixer?.setTime((frame + index * 5) / fps);

  const fall = eliminated ? Math.min(1, Math.max(0, (frame - 205) / 22)) : 0;
  const ease = 1 - Math.pow(1 - fall, 3);

  return (
    <group position={[Math.cos(th) * radius, -2.4 * (1 - rise), Math.sin(th) * radius]} rotation={[0, face, 0]}>
      <group rotation={[-ease * (Math.PI / 2 - 0.1), 0, 0]} position={[0, 0, ease * 0.25]}>
        <group scale={scale} rotation={[0, Math.PI / 2, 0]}><primitive object={root} /></group>
      </group>
      <sprite position={[0, 2.42, 0]} scale={[1.15, 0.29, 1]}>
        <spriteMaterial map={plate} transparent opacity={1 - ease * 0.7} depthTest={false} />
      </sprite>
    </group>
  );
};
