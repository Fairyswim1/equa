/** 선형 마루 라인 포인트 (viewBox 0 0 100 100, y 아래로 증가). Catmull–Rom 로 부드러운 산등성이 트레일 생성. */

type Pt = { x: number; y: number };

export const CLIMB_TRACK_CONTROL_POINTS: readonly Pt[] = [
  { x: 7, y: 95 },
  { x: 20, y: 84 },
  { x: 11, y: 72 },
  { x: 26, y: 60 },
  { x: 13, y: 50 },
  { x: 32, y: 40 },
  { x: 21, y: 32 },
  { x: 44, y: 24 },
  { x: 34, y: 16 },
  { x: 58, y: 10 },
  { x: 76, y: 6 },
  { x: 92, y: 3 },
];

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/** Catmull–Rom 세그먼트 (t ∈ [0,1]) */
function catmullRom2D(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const tt = clamp01(t);
  const tt2 = tt * tt;
  const tt3 = tt2 * tt;
  const x =
    0.5 *
    (2 * p1.x +
      (-p0.x + p2.x) * tt +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * tt2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * tt3);
  const y =
    0.5 *
    (2 * p1.y +
      (-p0.y + p2.y) * tt +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * tt2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * tt3);
  return { x, y };
}

/** 컨트롤 다각형을 따라 부드러운 등산로 샘플(폴리라인) */
export function buildSmoothPolyline(control: readonly Pt[], samplesPerChord: number): Pt[] {
  const n = control.length;
  if (n < 2) return control.map((p) => ({ x: p.x, y: p.y }));
  const S = Math.max(2, samplesPerChord);
  const phantom = (idx: number): Pt =>
    idx < 0 ? control[0] : idx >= n ? control[n - 1] : control[idx];

  const out: Pt[] = [];
  for (let i = 0; i < n - 1; i++) {
    const isLast = i === n - 2;
    const p0 = phantom(i - 1);
    const p1 = phantom(i);
    const p2 = phantom(i + 1);
    const p3 = phantom(i + 2);
    const maxK = isLast ? S : S - 1;
    for (let k = 0; k <= maxK; k++) {
      const u = k / S;
      out.push(catmullRom2D(p0, p1, p2, p3, u));
    }
  }
  return out;
}

export const CLIMB_TRACK_POINTS: readonly Pt[] = buildSmoothPolyline(CLIMB_TRACK_CONTROL_POINTS, 7);

export function getPointOnPolyline(
  points: readonly Pt[],
  t: number
): { x: number; y: number } {
  if (points.length < 2) return { x: points[0]?.x ?? 0, y: points[0]?.y ?? 0 };
  const tt = Math.max(0, Math.min(1, t));
  const lens: number[] = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    const len = Math.hypot(dx, dy);
    lens.push(len);
    total += len;
  }
  if (total <= 0) return { x: points[0].x, y: points[0].y };
  let dist = tt * total;
  for (let i = 0; i < lens.length; i++) {
    const seg = lens[i];
    if (dist <= seg || i === lens.length - 1) {
      const ratio = seg > 0 ? Math.min(1, dist / seg) : 0;
      const p0 = points[i];
      const p1 = points[i + 1];
      return {
        x: p0.x + (p1.x - p0.x) * ratio,
        y: p0.y + (p1.y - p0.y) * ratio,
      };
    }
    dist -= seg;
  }
  const last = points[points.length - 1];
  return { x: last.x, y: last.y };
}

export function trackPathD(points: readonly Pt[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
}
