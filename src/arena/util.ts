import * as THREE from 'three';

export const rng = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** Puntos equidistantes (por longitud de arco) sobre una elipse. */
export const ellipseRing = (a: number, b: number, count: number) => {
  const M = 4096;
  const pts: {x: number; z: number}[] = [];
  const cum: number[] = [0];
  for (let j = 0; j <= M; j++) {
    const t = (j / M) * Math.PI * 2;
    pts.push({x: a * Math.cos(t), z: b * Math.sin(t)});
    if (j > 0) cum.push(cum[j - 1] + Math.hypot(pts[j].x - pts[j - 1].x, pts[j].z - pts[j - 1].z));
  }
  const total = cum[M];
  const out: {x: number; z: number; ry: number}[] = [];
  let j = 0;
  for (let i = 0; i < count; i++) {
    const s = (i / count) * total;
    while (cum[j + 1] < s) j++;
    const p = pts[j];
    const q = pts[j + 1];
    const f = (s - cum[j]) / (cum[j + 1] - cum[j]);
    const x = p.x + (q.x - p.x) * f;
    const z = p.z + (q.z - p.z) * f;
    out.push({x, z, ry: Math.atan2(-(q.z - p.z), q.x - p.x)});
  }
  return {points: out, total};
};

export const perimeter = (a: number, b: number) => ellipseRing(a, b, 1).total;

const canvasTex = (c: HTMLCanvasElement, repeatX = 1, repeatY = 1) => {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};

export const makeStone = (repeat: number) => {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d')!;
  const r = rng(7);
  g.fillStyle = '#c7b08a';
  g.fillRect(0, 0, S, S);
  // bloques con variación de tono
  const rows = 8;
  const rowH = S / rows;
  for (let y = 0; y < rows; y++) {
    let x = -(r() * 100);
    while (x < S) {
      const w = 110 + r() * 110;
      const v = (r() - 0.5) * 36;
      g.fillStyle = `rgb(${199 + v},${176 + v},${138 + v})`;
      g.fillRect(x, y * rowH, w, rowH);
      g.strokeStyle = 'rgba(70,50,30,0.55)';
      g.lineWidth = 3;
      g.strokeRect(x, y * rowH, w, rowH);
      x += w;
    }
  }
  // porosidad y manchas
  for (let i = 0; i < 9000; i++) {
    const v = r() > 0.5 ? 255 : 0;
    g.fillStyle = `rgba(${v},${v * 0.9},${v * 0.7},${0.04 + r() * 0.08})`;
    const s = 1 + r() * 5;
    g.fillRect(r() * S, r() * S, s, s);
  }
  for (let i = 0; i < 70; i++) {
    const grd = g.createRadialGradient(0, 0, 0, 0, 0, 90);
    grd.addColorStop(0, 'rgba(60,45,30,0.18)');
    grd.addColorStop(1, 'rgba(60,45,30,0)');
    g.save();
    g.translate(r() * S, r() * S);
    g.fillStyle = grd;
    g.fillRect(-90, -90, 180, 180);
    g.restore();
  }
  return canvasTex(c, repeat, repeat);
};

export const makeSand = (repeat: number) => {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d')!;
  const r = rng(21);
  g.fillStyle = '#c9a36a';
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 60000; i++) {
    const v = r();
    g.fillStyle = v > 0.5 ? `rgba(255,235,190,${0.05 + r() * 0.12})` : `rgba(90,60,30,${0.05 + r() * 0.14})`;
    const s = 1 + r() * 2.5;
    g.fillRect(r() * S, r() * S, s, s);
  }
  g.lineWidth = 2;
  for (let i = 0; i < 36; i++) {
    g.strokeStyle = `rgba(110,80,45,${0.08 + r() * 0.12})`;
    g.beginPath();
    g.arc(r() * S, r() * S, 80 + r() * 300, r() * 6, r() * 6 + 1 + r());
    g.stroke();
  }
  return canvasTex(c, repeat, repeat);
};

export const makeSky = () => {
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 512;
  const g = c.getContext('2d')!;
  const grd = g.createLinearGradient(0, 0, 0, 512);
  grd.addColorStop(0, '#16284a');
  grd.addColorStop(0.35, '#4d6791');
  grd.addColorStop(0.55, '#d9a37a');
  grd.addColorStop(0.62, '#f5b873');
  grd.addColorStop(0.7, '#8f6a50');
  grd.addColorStop(1, '#3a2a20');
  g.fillStyle = grd;
  g.fillRect(0, 0, 16, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

export const makeGlow = () => {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, 'rgba(255,240,200,1)');
  grd.addColorStop(0.15, 'rgba(255,200,120,0.7)');
  grd.addColorStop(1, 'rgba(255,150,60,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
};

export const makePlate = (text: string, accent: string) => {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const g = c.getContext('2d')!;
  const grd = g.createLinearGradient(0, 0, 0, 128);
  grd.addColorStop(0, 'rgba(32,22,14,0.92)');
  grd.addColorStop(1, 'rgba(14,9,6,0.92)');
  g.fillStyle = grd;
  g.beginPath();
  g.roundRect(8, 8, 496, 112, 14);
  g.fill();
  g.strokeStyle = '#c9a227';
  g.lineWidth = 5;
  g.stroke();
  g.fillStyle = accent;
  g.fillRect(24, 100, 464, 6);
  g.fillStyle = '#f3e6c4';
  g.font = 'bold 66px Georgia, serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text.toUpperCase(), 256, 54);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};
