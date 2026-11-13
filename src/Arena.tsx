import {useLayoutEffect, useMemo} from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {Bloom, EffectComposer, ToneMapping, Vignette} from '@react-three/postprocessing';
import {ToneMappingMode} from 'postprocessing';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import tributes from './tributes.json';
import {Colosseum, Crowd} from './arena/Colosseum';
import {Brazier, Gladiator} from './arena/Gladiator';
import {rng} from './arena/util';

export type ArenaProps = {
  title: string;
  episode: string;
  eliminated: string;
};

const RING = 5.2;

const Env: React.FC = () => {
  const {gl, scene} = useThree();
  useLayoutEffect(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const tex = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = tex;
    scene.environmentIntensity = 0.45;
    return () => {
      scene.environment = null;
      tex.dispose();
      pm.dispose();
    };
  }, [gl, scene]);
  return null;
};

const Dust: React.FC<{frame: number}> = ({frame}) => {
  const geo = useMemo(() => {
    const r = rng(5);
    const p = new Float32Array(500 * 3);
    for (let i = 0; i < 500; i++) {
      p[i * 3] = (r() - 0.5) * 34;
      p[i * 3 + 1] = r() * 9;
      p[i * 3 + 2] = (r() - 0.5) * 26;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    return g;
  }, []);
  return (
    <points geometry={geo} position={[frame * 0.01, Math.sin(frame / 50) * 0.15, 0]} rotation={[0, frame * 0.0015, 0]}>
      <pointsMaterial size={0.07} color="#ffe2b0" transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
};

const CameraRig: React.FC<{frame: number; target: number}> = ({frame, target}) => {
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => {
    const ringPos = (th: number, y: number) => new THREE.Vector3(Math.cos(th) * RING, y, Math.sin(th) * RING);
    const n = tributes.length;
    if (frame < 150) {
      // plano A: desde el centro, mirando a las caras con la grada detrás
      const u = frame / 150;
      const ang = 0.4 + u * 1.5;
      camera.position.set(Math.cos(ang) * 0.4, 1.6 + u * 0.4, Math.sin(ang) * 0.4);
      camera.lookAt(ringPos(ang + 0.15, 1.9 + u * 0.3));
    } else {
      // plano B: acercamiento al tributo que cae
      const u = (frame - 150) / 150;
      const th = (target / n) * Math.PI * 2;
      const ang = th + 0.5 - u * 0.25;
      const r = 1.6 + u * 0.8;
      camera.position.set(Math.cos(ang) * r, 1.6 + u * 0.4, Math.sin(ang) * r);
      camera.lookAt(ringPos(th, 1.35));
    }
    camera.updateMatrixWorld();
  }, [camera, frame, target]);
  return null;
};

export const Arena: React.FC<ArenaProps> = ({title, episode, eliminated}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames, width, height} = useVideoConfig();

  const titleIn = spring({frame: frame - 8, fps, config: {damping: 18}});
  const fadeIn = interpolate(frame, [0, 18], [1, 0], {extrapolateRight: 'clamp'});
  const fadeOut = interpolate(frame, [durationInFrames - 15, durationInFrames], [0, 1], {extrapolateLeft: 'clamp'});
  const flash = interpolate(frame, [200, 204, 222], [0, 0.85, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cannon = frame >= 200 && frame < 215;

  return (
    <AbsoluteFill style={{background: '#000'}}>
      <ThreeCanvas
        width={width}
        height={height}
        shadows
        gl={{antialias: true, toneMapping: THREE.NoToneMapping}}
        camera={{position: [0, 2, 11], fov: 66, near: 0.1, far: 400}}
      >
        <color attach="background" args={['#caa27a']} />
        <fog attach="fog" args={['#c9a37c', 22, 95]} />
        <Env />
        <CameraRig frame={frame} target={Math.max(0, tributes.findIndex((t) => t.name === eliminated))} />
        <hemisphereLight args={['#9db8e0', '#7a5a3a', 0.7]} />
        <directionalLight
          position={[-30, 22, 15]}
          intensity={3.4}
          color="#ffcf94"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-34}
          shadow-camera-right={34}
          shadow-camera-top={30}
          shadow-camera-bottom={-30}
          shadow-camera-near={1}
          shadow-camera-far={120}
          shadow-bias={-0.0004}
        />
        {cannon && <pointLight position={[0, 5, 0]} intensity={400} distance={40} color="#ffd2a0" />}

        <Colosseum frame={frame} />
        <Crowd frame={frame} />
        <Brazier frame={frame} />
        {tributes.map((t, i) => (
          <Gladiator
            key={t.name}
            index={i}
            total={tributes.length}
            name={t.name}
            color={t.color}
            eliminated={t.name === eliminated}
            frame={frame}
            fps={fps}
            radius={RING}
            rise={spring({frame: frame - 6 - i * 2, fps, config: {damping: 22, stiffness: 60}})}
          />
        ))}
        <Dust frame={frame} />

        <EffectComposer>
          <Bloom intensity={0.7} luminanceThreshold={0.9} luminanceSmoothing={0.2} mipmapBlur />
          <Vignette eskil={false} offset={0.2} darkness={0.7} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      </ThreeCanvas>

      <AbsoluteFill
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.8) 100%)',
        }}
      />
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 80}}>
        <div style={{transform: `scale(${0.9 + titleIn * 0.1})`, opacity: titleIn, textAlign: 'center', fontFamily: 'Georgia, serif'}}>
          <div style={{color: '#e2b84a', fontSize: 34, letterSpacing: 14, textShadow: '0 2px 12px #000'}}>{episode}</div>
          <div style={{color: '#f6ecd2', fontSize: 120, fontWeight: 700, letterSpacing: 6, textShadow: '0 4px 30px #000'}}>{title}</div>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 170, fontFamily: 'Georgia, serif', textAlign: 'center'}}>
        {frame < 200 ? (
          <div style={{color: '#f6ecd2', fontSize: 62, textShadow: '0 3px 20px #000'}}>24 entran. Solo 1 sale.</div>
        ) : (
          <div style={{textShadow: '0 3px 20px #000'}}>
            <div style={{color: '#ff6a55', fontSize: 58}}>Suena el cañón… {eliminated} ha caído.</div>
            <div style={{color: '#f6ecd2', fontSize: 38, marginTop: 22}}>¿Quién será el siguiente? Resultado en YouTube ▶</div>
          </div>
        )}
      </AbsoluteFill>
      <AbsoluteFill style={{background: '#fff', opacity: flash, pointerEvents: 'none'}} />
      <AbsoluteFill style={{background: '#000', opacity: Math.max(fadeIn, fadeOut), pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};
