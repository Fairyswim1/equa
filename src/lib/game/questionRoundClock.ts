import { QUESTION_TIME_LIMIT_SEC } from '@/lib/game/sessionAdvance';

/** question_started_at이 이전 문항 타임스탬프처럼 남아 있을 때 허용하는 여유(초) */
const SERVER_STALE_GRACE_SEC = 5;

function msFromIsoMaybe(raw: unknown): number | null {
  if (raw === undefined || raw === null || raw === '') return null;
  const ms = typeof raw === 'number' ? raw : new Date(String(raw)).getTime();
  return Number.isFinite(ms) ? ms : null;
}

/**
 * 라운드 제한 시간 기준 시작 시각(ms).
 * - 서버 시간이 라운드에 맞게 최근이면 신뢰
 * - 이미 제한 시간을 크게 초과한 값은 무시 → localFallback(문항 진입 시각 등)
 */
export function coerceQuestionStartedMs(raw: unknown, localFallbackMs: number): number {
  const srv = msFromIsoMaybe(raw);
  const fb = Number.isFinite(localFallbackMs) ? localFallbackMs : Date.now();

  if (srv === null) return fb;

  const elapsedSec = (Date.now() - srv) / 1000;
  if (elapsedSec > QUESTION_TIME_LIMIT_SEC + SERVER_STALE_GRACE_SEC) {
    return fb;
  }
  if (elapsedSec < -120) {
    return fb;
  }
  return srv;
}
