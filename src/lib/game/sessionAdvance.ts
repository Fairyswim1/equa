import type { SupabaseClient } from '@supabase/supabase-js';

const QUESTION_TIME_LIMIT_SEC = 40;

export { QUESTION_TIME_LIMIT_SEC };

function isMissingSyncColumnsError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    (m.includes('column') && (m.includes('does not exist') || m.includes('unknown'))) ||
    m.includes('42703') ||
    m.includes('undefined_column') ||
    m.includes('schema cache') ||
    m.includes('pgrst204') ||
    (m.includes('current_question_index') && m.includes('does not exist')) ||
    (m.includes('question_started_at') && m.includes('does not exist'))
  );
}

type PlayerRow = {
  id: string;
  correct_count: number;
  current_question_index: number;
  score: number;
};

type SessionRow = {
  id: string;
  pin: string;
  question_count: number;
  current_question_index?: number | null;
  status: string;
};

function sessionQuestionIndex(session: SessionRow): number {
  const v = session.current_question_index;
  if (v === undefined || v === null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function normalizeAnswer(a: string): string {
  return a.trim().replace(/\s+/g, '');
}

export function answersEqual(given: string, expected: string, type?: string): boolean {
  const g = normalizeAnswer(given);
  const e = normalizeAnswer(expected);
  if (type === 'short') {
    if (g === e) return true;
    const gn = Number(g);
    const en = Number(e);
    if (!Number.isNaN(gn) && !Number.isNaN(en) && e !== '' && /^-?\d+$/.test(e)) {
      return gn === en;
    }
  }
  return g === e;
}

function speedBonus(isCorrect: boolean, timeTaken: number): number {
  if (!isCorrect) return 0;
  return Math.max(0, (QUESTION_TIME_LIMIT_SEC - timeTaken) / QUESTION_TIME_LIMIT_SEC) * 3;
}

function positionFromStats(correctCount: number, totalQ: number, timeTaken: number, isCorrect: boolean): number {
  const bonus = speedBonus(isCorrect, timeTaken);
  return Math.min(100, (correctCount / totalQ) * 100 + bonus);
}

function scoreAdd(isCorrect: boolean, timeTaken: number): number {
  if (!isCorrect) return 0;
  return Math.max(10, Math.round(100 - timeTaken * 5));
}

/** 현재 문항에 아직 제출하지 않은 학생에게 오답 처리 + 플레이어 갱신 */
export async function finalizeUnansweredForQuestion(
  supabase: SupabaseClient,
  session: SessionRow,
  questionIndex: number
): Promise<void> {
  const { data: players } = await supabase
    .from('players')
    .select('id, correct_count, current_question_index, score')
    .eq('session_id', session.id);

  if (!players?.length) return;

  const { data: existing } = await supabase
    .from('player_answers')
    .select('player_id')
    .eq('session_id', session.id)
    .eq('question_index', questionIndex);

  const answered = new Set((existing ?? []).map((r: { player_id: string }) => r.player_id));
  for (const p of players as PlayerRow[]) {
    if (answered.has(p.id)) continue;

    await supabase.from('player_answers').insert({
      player_id: p.id,
      session_id: session.id,
      question_index: questionIndex,
      is_correct: false,
      time_taken: QUESTION_TIME_LIMIT_SEC,
      answer_given: '',
    });

    const newQuestionIndex = p.current_question_index + 1;
    const pos = positionFromStats(p.correct_count, session.question_count, QUESTION_TIME_LIMIT_SEC, false);

    await supabase
      .from('players')
      .update({
        current_question_index: newQuestionIndex,
        position: pos,
        is_finished: newQuestionIndex >= session.question_count,
        finish_time:
          newQuestionIndex >= session.question_count ? new Date().toISOString() : null,
      })
      .eq('id', p.id);
  }
}

/** 다음 문항으로 진행 (또는 종료). finalize: 현재 문항 미제출자 자동 오답 처리 여부 */
export async function advanceToNextQuestion(
  supabase: SupabaseClient,
  session: SessionRow,
  options: { finalizeCurrent: boolean }
): Promise<{
  advanced: boolean;
  session: SessionRow | null;
  finished: boolean;
  lastError?: string;
  hint?: string;
}> {
  if (session.status !== 'playing') {
    return { advanced: false, session: null, finished: false, lastError: 'not_playing' };
  }

  const qIdxSafe = sessionQuestionIndex(session);

  if (options.finalizeCurrent) {
    await finalizeUnansweredForQuestion(supabase, session, qIdxSafe);
  }

  const nextIdx = qIdxSafe + 1;
  const qc = Number(session.question_count);
  const questionCount = Number.isFinite(qc) && qc > 0 ? qc : 10;
  const finished = nextIdx >= questionCount;
  const finishedAt = new Date().toISOString();

  if (finished) {
    let { data: updated, error } = await supabase
      .from('game_sessions')
      .update({
        current_question_index: questionCount,
        status: 'finished',
        finished_at: finishedAt,
      })
      .eq('id', session.id)
      .select()
      .single();

    if (error && isMissingSyncColumnsError(error.message)) {
      const leg = await supabase
        .from('game_sessions')
        .update({
          status: 'finished',
          finished_at: finishedAt,
        })
        .eq('id', session.id)
        .select()
        .single();
      updated = leg.data;
      error = leg.error;
    }

    if (error || !updated) {
      const { data: row } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', session.id)
        .maybeSingle();
      if (row && (row as { status: string }).status === 'finished') {
        return { advanced: true, session: row as SessionRow, finished: true };
      }
      return {
        advanced: false,
        session: null,
        finished: false,
        lastError: error?.message,
        hint: error?.message && isMissingSyncColumnsError(error.message)
          ? 'Supabase에 supabase/migrations/002_session_question_sync.sql 적용 여부를 확인하세요.'
          : undefined,
      };
    }

    await supabase
      .from('players')
      .update({ is_finished: true, finish_time: finishedAt })
      .eq('session_id', session.id)
      .eq('is_finished', false);

    return { advanced: true, session: updated as SessionRow, finished: true };
  }

  const now = new Date().toISOString();
  let updated: SessionRow | null = null;
  let lastErr: string | null = null;

  const combined = await supabase
    .from('game_sessions')
    .update({
      current_question_index: nextIdx,
      question_started_at: now,
    })
    .eq('id', session.id)
    .select()
    .single();

  if (!combined.error && combined.data) {
    updated = combined.data as SessionRow;
  } else {
    lastErr = combined.error?.message ?? null;

    const idxOnly = await supabase
      .from('game_sessions')
      .update({ current_question_index: nextIdx })
      .eq('id', session.id)
      .select()
      .single();

    if (!idxOnly.error && idxOnly.data) {
      const timeOnly = await supabase
        .from('game_sessions')
        .update({ question_started_at: now })
        .eq('id', session.id)
        .select()
        .single();

      if (!timeOnly.error && timeOnly.data) {
        updated = timeOnly.data as SessionRow;
      } else {
        const { data: refetched } = await supabase
          .from('game_sessions')
          .select('*')
          .eq('id', session.id)
          .single();
        updated = {
          ...(refetched ?? idxOnly.data),
          current_question_index: nextIdx,
          question_started_at: now,
        } as SessionRow;
      }
      lastErr = null;
    } else {
      lastErr = idxOnly.error?.message ?? lastErr;
    }
  }

  if (!updated) {
    const { data: row } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', session.id)
      .maybeSingle();

    if (row) {
      const r = row as SessionRow & { status: string };
      if (r.status === 'finished') {
        return { advanced: true, session: r as SessionRow, finished: true };
      }
      if (r.status === 'playing' && sessionQuestionIndex(r) >= nextIdx) {
        return { advanced: true, session: r as SessionRow, finished: false };
      }
    }

    const migrationHint =
      lastErr && isMissingSyncColumnsError(lastErr)
        ? 'Supabase에 supabase/migrations/002_session_question_sync.sql 을 적용했는지 확인하세요.'
        : undefined;
    return {
      advanced: false,
      session: null,
      finished: false,
      lastError: lastErr ?? undefined,
      hint: migrationHint,
    };
  }

  return { advanced: true, session: updated, finished: false };
}

/** 방금 제출 후, 현재 문항에 모든 참가자가 응답했으면 자동으로 다음 문항으로 */
export async function maybeAutoAdvanceAfterAnswer(
  supabase: SupabaseClient,
  sessionId: string
): Promise<{ advanced: boolean; session: SessionRow | null }> {
  const { data: session } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (!session || session.status !== 'playing') return { advanced: false, session: null };

  const s = session as SessionRow;
  const qIdxSafe = sessionQuestionIndex(s);

  // count + head 조합에서 count가 안 오면 n=0 으로 잘못 막히는 경우가 있어 id 행으로 인원 확인
  const { data: playerRows } = await supabase
    .from('players')
    .select('id')
    .eq('session_id', s.id);

  const { data: answers } = await supabase
    .from('player_answers')
    .select('player_id')
    .eq('session_id', s.id)
    .eq('question_index', qIdxSafe);

  const distinct = new Set((answers ?? []).map((r: { player_id: string }) => r.player_id));
  const n = playerRows?.length ?? 0;
  if (n === 0 || distinct.size < n) return { advanced: false, session: null };

  const r = await advanceToNextQuestion(supabase, s, { finalizeCurrent: false });
  return { advanced: r.advanced, session: r.session ?? null };
}
