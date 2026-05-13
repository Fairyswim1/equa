import type { SupabaseClient } from '@supabase/supabase-js';

const QUESTION_TIME_LIMIT_SEC = 40;

export { QUESTION_TIME_LIMIT_SEC };

function isMissingSyncColumnsError(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes('column') && m.includes('does not exist');
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
): Promise<{ advanced: boolean; session: SessionRow | null; finished: boolean }> {
  if (session.status !== 'playing') {
    return { advanced: false, session: null, finished: false };
  }

  const qIdxSafe = sessionQuestionIndex(session);

  if (options.finalizeCurrent) {
    await finalizeUnansweredForQuestion(supabase, session, qIdxSafe);
  }

  const nextIdx = qIdxSafe + 1;
  const finished = nextIdx >= session.question_count;
  const finishedAt = new Date().toISOString();

  if (finished) {
    let { data: updated, error } = await supabase
      .from('game_sessions')
      .update({
        current_question_index: session.question_count,
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
      return { advanced: false, session: null, finished: false };
    }

    await supabase
      .from('players')
      .update({ is_finished: true, finish_time: finishedAt })
      .eq('session_id', session.id)
      .eq('is_finished', false);

    return { advanced: true, session: updated as SessionRow, finished: true };
  }

  const { data: updated, error } = await supabase
    .from('game_sessions')
    .update({
      current_question_index: nextIdx,
      question_started_at: new Date().toISOString(),
    })
    .eq('id', session.id)
    .select()
    .single();

  if (error) {
    if (isMissingSyncColumnsError(error.message)) {
      return { advanced: false, session: null, finished: false };
    }
    return { advanced: false, session: null, finished: false };
  }

  return { advanced: true, session: updated as SessionRow, finished: false };
}

/** 방금 제출 후, 현재 문항에 모든 참가자가 응답했으면 자동으로 다음 문항으로 */
export async function maybeAutoAdvanceAfterAnswer(
  supabase: SupabaseClient,
  sessionId: string
): Promise<{ advanced: boolean }> {
  const { data: session } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (!session || session.status !== 'playing') return { advanced: false };

  const s = session as SessionRow;
  const qIdxSafe = sessionQuestionIndex(s);

  const { count: playerCount } = await supabase
    .from('players')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', s.id);

  const { data: answers } = await supabase
    .from('player_answers')
    .select('player_id')
    .eq('session_id', s.id)
    .eq('question_index', qIdxSafe);

  const distinct = new Set((answers ?? []).map((r: { player_id: string }) => r.player_id));
  const n = playerCount ?? 0;
  if (n === 0 || distinct.size < n) return { advanced: false };

  const r = await advanceToNextQuestion(supabase, s, { finalizeCurrent: false });
  return { advanced: r.advanced };
}
