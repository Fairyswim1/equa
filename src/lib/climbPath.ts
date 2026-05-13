/** 코스 좌표 (viewBox 0 0 100 100, y 아래로 증가) — 산비탈 지그재그 등반 */
export const CLIMB_TRACK_POINTS = [
  { x: 10, y: 90 },
  { x: 26, y: 74 },
  { x: 14, y: 60 },
  { x: 32, y: 48 },
  { x: 20, y: 36 },
  { x: 40, y: 24 },
  { x: 30, y: 14 },
  { x: 55, y: 9 },
  { x: 72, y: 5 },
] as const;

export function getPointOnPolyline(
  points: readonly { readonly x: number; readonly y: number }[],
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

export function trackPathD(
  points: readonly { readonly x: number; readonly y: number }[]
): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}
