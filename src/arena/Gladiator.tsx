import {useMemo} from 'react';
import * as THREE from 'three';
import {makePlate} from './util';

const BRONZE = {color: '#b0793a', metalness: 0.9, roughness: 0.35} as const;
const SKIN = '#c58c63';

export const Gladiator: React.FC<{
  index: number;
  total: number;
  name: string;
  color: string;
  eliminated: boolean;
  frame: number;
  fps: number;
  radius: number;
  rise: number; // 0..1
}> = ({index, total, name, color, eliminated, frame, radius, rise}) => {
  const th = (index / total) * Math.PI * 2;
  const x = Math.cos(th) * radius;
  const z = Math.sin(th) * radius;
  const face = Math.atan2(-Math.cos(th), -Math.sin(th));
  const plate = useMemo(() => makePlate(name, color), [name, color]);
  const fall = eliminated ? Math.min(1, Math.max(0, (frame - 205) / 22)) : 0;
  const ease = 1 - Math.pow(1 - fall, 3);
  const breathe = Math.sin(frame / 14 + index) * 0.012 * (1 - fall);
  const armRaise = 0.15 + Math.max(0, Math.sin(frame / 40 + index * 1.3)) * 0.12;

  return (
    <group position={[x, -2.4 * (1 - rise), z]} rotation={[0, face, 0]}>
      {/* trampilla */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <cylinderGeometry args={[0.7, 0.7, 0.04, 20]} />
        <meshStandardMaterial color="#2a2018" roughness={0.9} />
      </mesh>
      <group rotation={[-ease * (Math.PI / 2 - 0.1), 0, 0]} position={[0, breathe, ease * 0.25]}>
        {/* piernas */}
        {[-0.12, 0.12].map((px) => (
          <mesh key={px} position={[px, 0.45, 0]} castShadow>
            <capsuleGeometry args={[0.085, 0.72, 4, 8]} />
            <meshStandardMaterial color={SKIN} roughness={0.7} />
          </mesh>
        ))}
        {/* grebas */}
        {[-0.12, 0.12].map((px) => (
          <mesh key={`g${px}`} position={[px, 0.32, 0.03]} castShadow>
            <cylinderGeometry args={[0.1, 0.095, 0.38, 10]} />
            <meshStandardMaterial {...BRONZE} />
          </mesh>
        ))}
        {/* túnica */}
        <mesh position={[0, 1.0, 0]} castShadow>
          <cylinderGeometry args={[0.24, 0.34, 0.45, 14]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
        {/* torso con coraza */}
        <mesh position={[0, 1.38, 0]} castShadow>
          <cylinderGeometry args={[0.27, 0.23, 0.62, 14]} />
          <meshStandardMaterial {...BRONZE} />
        </mesh>
        <mesh position={[0, 1.12, 0]} castShadow>
          <cylinderGeometry args={[0.235, 0.235, 0.09, 14]} />
          <meshStandardMaterial color="#3a2616" roughness={0.8} />
        </mesh>
        {/* hombreras */}
        {[-1, 1].map((s) => (
          <mesh key={`h${s}`} position={[s * 0.33, 1.6, 0]} castShadow>
            <sphereGeometry args={[0.14, 12, 10]} />
            <meshStandardMaterial {...BRONZE} />
          </mesh>
        ))}
        {/* brazo izquierdo con escudo */}
        <group position={[-0.34, 1.55, 0]} rotation={[-0.5, 0, 0.25]}>
          <mesh position={[0, -0.26, 0]} castShadow>
            <capsuleGeometry args={[0.065, 0.4, 4, 8]} />
            <meshStandardMaterial color={SKIN} roughness={0.7} />
          </mesh>
        </group>
        <mesh position={[-0.42, 1.28, 0.3]} rotation={[0, 0.3, 0]} castShadow>
          <boxGeometry args={[0.46, 0.8, 0.06]} />
          <meshStandardMaterial color={color} roughness={0.6} metalness={0.2} />
        </mesh>
        <mesh position={[-0.41, 1.28, 0.34]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.05, 12]} />
          <meshStandardMaterial color="#d4a63a" metalness={1} roughness={0.25} />
        </mesh>
        {/* brazo derecho con lanza */}
        <group position={[0.34, 1.55, 0]} rotation={[-armRaise - 0.6, 0, -0.2]}>
          <mesh position={[0, -0.26, 0]} castShadow>
            <capsuleGeometry args={[0.065, 0.4, 4, 8]} />
            <meshStandardMaterial color={SKIN} roughness={0.7} />
          </mesh>
        </group>
        <group position={[0.5, 1.0, 0.25]}>
          <mesh position={[0, 0.55, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.022, 2.3, 8]} />
            <meshStandardMaterial color="#6b4a2a" roughness={0.8} />
          </mesh>
          <mesh position={[0, 1.78, 0]} castShadow>
            <coneGeometry args={[0.045, 0.28, 8]} />
            <meshStandardMaterial color="#cfd3d8" metalness={1} roughness={0.2} />
          </mesh>
        </group>
        {/* rostro */}
        {[-0.05, 0.05].map((ex) => (
          <mesh key={`e${ex}`} position={[ex, 1.885, 0.122]}>
            <sphereGeometry args={[0.014, 8, 8]} />
            <meshStandardMaterial color="#1a1008" roughness={0.3} />
          </mesh>
        ))}
        <mesh position={[0, 1.855, 0.135]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.02, 0.05, 6]} />
          <meshStandardMaterial color={SKIN} roughness={0.65} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={`c${s}`} position={[s * 0.15, 1.84, 0.02]} rotation={[0, 0, s * 0.1]} castShadow>
            <boxGeometry args={[0.03, 0.14, 0.17]} />
            <meshStandardMaterial {...BRONZE} />
          </mesh>
        ))}
        {/* capa */}
        <mesh position={[0, 1.3, -0.24]} rotation={[0.08, 0, 0]} castShadow>
          <boxGeometry args={[0.5, 1.0, 0.025]} />
          <meshStandardMaterial color="#8c1f1a" roughness={0.95} />
        </mesh>
        {/* cabeza y casco */}
        <mesh position={[0, 1.86, 0]} castShadow>
          <sphereGeometry args={[0.135, 16, 14]} />
          <meshStandardMaterial color={SKIN} roughness={0.65} />
        </mesh>
        <mesh position={[0, 1.9, 0]} castShadow>
          <sphereGeometry args={[0.16, 16, 12, 0, Math.PI * 2, 0, Math.PI / 1.9]} />
          <meshStandardMaterial {...BRONZE} />
        </mesh>
        <mesh position={[0, 2.06, -0.02]} castShadow>
          <boxGeometry args={[0.04, 0.17, 0.3]} />
          <meshStandardMaterial color="#a8281f" roughness={0.9} />
        </mesh>
      </group>
      <sprite position={[0, 2.42, 0]} scale={[1.15, 0.29, 1]}>
        <spriteMaterial map={plate} transparent opacity={1 - ease * 0.7} depthTest={false} color={eliminated && fall > 0.5 ? '#ff7766' : '#ffffff'} />
      </sprite>
    </group>
  );
};

export const Brazier: React.FC<{frame: number}> = ({frame}) => {
  const f = (k: number) => 1 + Math.sin(frame * 0.7 + k) * 0.18 + Math.sin(frame * 1.9 + k * 2) * 0.1;
  return (
    <group>
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.3, 1.8, 10]} />
        <meshStandardMaterial {...BRONZE} />
      </mesh>
      <mesh position={[0, 1.95, 0]} castShadow>
        <cylinderGeometry args={[0.75, 0.3, 0.45, 18]} />
        <meshStandardMaterial {...BRONZE} />
      </mesh>
      <mesh position={[0, 2.5, 0]} scale={[1, f(0), 1]}>
        <coneGeometry args={[0.55, 1.3, 12]} />
        <meshBasicMaterial color="#ff6a1a" transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh position={[0, 2.6, 0]} scale={[1, f(1.7), 1]}>
        <coneGeometry args={[0.32, 1.1, 10]} />
        <meshBasicMaterial color="#ffc15a" transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <pointLight position={[0, 2.8, 0]} intensity={60 * f(3)} distance={26} color="#ff8a3d" />
    </group>
  );
};
