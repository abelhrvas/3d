import {useLayoutEffect, useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import tributes from './tributes.json';

export type ArenaProps = {
  title: string;
  episode: string;
  eliminated: string; // nombre del tributo eliminado en este episodio
};

const RADIUS = 6;

const makeLabel = (text: string, color: string) => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(10,10,20,0.75)';
  ctx.beginPath();
  ctx.roundRect(8, 8, 496, 112, 28);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.fillStyle = 'white';
  ctx.font = 'bold 72px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 68);
  return new THREE.CanvasTexture(canvas);
};

const Tribute: React.FC<{
  index: number;
  name: string;
  color: string;
  eliminated: boolean;
  frame: number;
  fps: number;
}> = ({index, name, color, eliminated, frame, fps}) => {
  const angle = (index / tributes.length) * Math.PI * 2;
  const entrance = spring({frame: frame - index * 3, fps, config: {damping: 14}});
  const fall = eliminated ? spring({frame: frame - 210, fps, config: {damping: 20}}) : 0;
  const label = useMemo(() => makeLabel(name, color), [name, color]);
  const x = Math.cos(angle) * RADIUS;
  const z = Math.sin(angle) * RADIUS;
  const bob = Math.sin(frame / 12 + index) * 0.04 * (1 - fall);

  return (
    <group position={[x, -3 * (1 - entrance), z]} rotation={[0, -angle - Math.PI / 2, 0]}>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.55, 0.65, 0.5, 8]} />
        <meshStandardMaterial color="#2b2b3a" flatShading />
      </mesh>
      <group rotation={[fall * 1.5, 0, 0]} position={[0, 0.5 + bob - fall * 0.35, 0]}>
        <mesh position={[0, 0.55, 0]}>
          <capsuleGeometry args={[0.28, 0.5, 4, 8]} />
          <meshStandardMaterial color={eliminated && fall > 0.3 ? '#555' : color} flatShading />
        </mesh>
        <mesh position={[0, 1.25, 0]}>
          <icosahedronGeometry args={[0.28, 1]} />
          <meshStandardMaterial color="#f1d5b8" flatShading />
        </mesh>
      </group>
      <sprite position={[0, 2.2, 0]} scale={[1.8, 0.45, 1]} material-opacity={1 - fall}>
        <spriteMaterial map={label} transparent opacity={1 - fall} depthTest={false} />
      </sprite>
    </group>
  );
};

export const Arena: React.FC<ArenaProps> = ({title, episode, eliminated}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames, width, height} = useVideoConfig();

  const orbit = interpolate(frame, [0, durationInFrames], [0, Math.PI * 1.2]);
  const camRadius = interpolate(frame, [0, 120, durationInFrames], [22, 18, 14]);
  const camHeight = interpolate(frame, [0, 120, durationInFrames], [13, 11, 8]);

  const titleIn = spring({frame, fps, config: {damping: 15}});
  const fadeOut = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0]);
  const cannon = frame > 200 && frame < 215;

  return (
    <AbsoluteFill style={{background: '#06060f', opacity: fadeOut}}>
      <ThreeCanvas width={width} height={height} camera={{position: [0, 10, 17], fov: 62}}>
        <CameraRig angle={orbit} radius={camRadius} height={camHeight} />
        <color attach="background" args={['#06060f']} />
        <fog attach="fog" args={['#06060f', 15, 40]} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[6, 12, 4]} intensity={1.6} />
        <pointLight position={[0, 6, 0]} intensity={cannon ? 120 : 25} color={cannon ? '#ff5533' : '#ffd9a0'} />
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[9.5, 48]} />
          <meshStandardMaterial color="#1c2a1f" flatShading />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[1.2, 1.6, 0.6, 8]} />
          <meshStandardMaterial color="#c9a227" flatShading emissive="#c9a227" emissiveIntensity={0.3} />
        </mesh>
        {tributes.map((t, i) => (
          <Tribute
            key={t.name}
            index={i}
            name={t.name}
            color={t.color}
            eliminated={t.name === eliminated}
            frame={frame}
            fps={fps}
          />
        ))}
      </ThreeCanvas>

      <AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 140}}>
        <div style={{transform: `scale(${titleIn})`, textAlign: 'center', fontFamily: 'sans-serif'}}>
          <div style={{color: '#c9a227', fontSize: 44, letterSpacing: 10}}>{episode}</div>
          <div style={{color: 'white', fontSize: 130, fontWeight: 900}}>{title}</div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 200}}>
        <div style={{fontFamily: 'sans-serif', textAlign: 'center', color: 'white'}}>
          {frame < 200 ? (
            <div style={{fontSize: 64, fontWeight: 700}}>24 entran. Solo 1 sale.</div>
          ) : (
            <div style={{fontSize: 56, fontWeight: 700, color: '#ff5a4a'}}>
              Un cañón suena… {eliminated} ha caído.
              <div style={{fontSize: 38, color: 'white', marginTop: 24}}>
                ¿Quién será el siguiente? Resultado en YouTube ▶
              </div>
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const CameraRig: React.FC<{angle: number; radius: number; height: number}> = ({angle, radius, height}) => {
  const camera = useThree((state) => state.camera);
  useLayoutEffect(() => {
    camera.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
    camera.lookAt(0, 1, 0);
    camera.updateMatrixWorld();
  }, [camera, angle, radius, height]);
  return null;
};
