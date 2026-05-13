import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseForApi } from '@/lib/supabase/api';
import {
  answersEqual,
  maybeAutoAdvanceAfterAnswer,
  QUESTION_TIME_LIMIT_SEC,
} from '@/lib/game/sessionAdvance';
import type { Question } from '@/types/game';

// POST /api/game/[pin]/answer - 답 제출 (세션 문항 인덱스와 일치할 때만 허용)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pin: string }> }
) {
  const { pin } = await params;
  const supabase = createSupabaseForApi();
  const body = await request.json() as {
    player_id: string;
    question_index: number;
    answer: string;
    time_taken: number;
    correct_answer: string;
    total_questions: number;
  };

  const { data: session } = await supabase
    .from('game_sessions')
    .select('id, question_count, current_question_index, status')
    .eq('pin', pin)
    .single();

  if (!session) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  if (session.status !== 'playing') {
    return NextResponse.json({ error: 'Game is not active' }, { status: 400 });
  }

  if (body.question_index !== session.current_question_index) {
    return NextResponse.json(
      {
        error: 'stale_question',
        message: '이 문항은 이미 끝났습니다. 화면이 곧 갱신됩니다.',
        current_question_index: session.current_question_index,
      },
      { status: 409 }
    );
  }

  const { data: existingAns } = await supabase
    .from('player_answers')
    .select('id, is_correct')
    .eq('player_id', body.player_id)
    .eq('question_index', body.question_index)
    .maybeSingle();

  if (existingAns) {
    const { data: player } = await supabase.from('players').select('*').eq('id', body.player_id).single();
    return NextResponse.json({
      is_correct: existingAns.is_correct,
      player,
      score_gained: 0,
      duplicate: true,
    });
  }

  const { data: qRow } = await supabase
    .from('session_questions')
    .select('question_data')
    .eq('session_id', session.id)
    .eq('question_index', body.question_index)
    .single();

  let qType: Question['type'] = 'multiple';
  if (qRow?.question_data) {
    try {
      const q = JSON.parse(qRow.question_data as string) as Question;
      qType = q.type;
    } catch {
      /* ignore */
    }
  }

  const is_correct = answersEqual(body.answer, body.correct_answer, qType);

  await supabase.from('player_answers').insert({
    player_id: body.player_id,
    session_id: session.id,
    question_index: body.question_index,
    is_correct,
    time_taken: body.time_taken,
    answer_given: body.answer,
  });

  const { data: player } = await supabase
    .from('players')
    .select('correct_count, current_question_index, score')
    .eq('id', body.player_id)
    .single();

  if (!player) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 });
  }

  const totalQ = body.total_questions;
  const currentScore = (player as { score: number }).score ?? 0;
  const newCorrectCount = is_correct ? player.correct_count + 1 : player.correct_count;
  const newQuestionIndex = player.current_question_index + 1;
  const speedBonus = is_correct
    ? Math.max(0, (QUESTION_TIME_LIMIT_SEC - body.time_taken) / QUESTION_TIME_LIMIT_SEC) * 3
    : 0;
  const position = Math.min(100, (newCorrectCount / totalQ) * 100 + speedBonus);
  const isFinished = newQuestionIndex >= totalQ;
  const scoreAdd = scoreFromAnswer(is_correct, body.time_taken);

  const { data: updatedPlayer } = await supabase
    .from('players')
    .update({
      correct_count: newCorrectCount,
      current_question_index: newQuestionIndex,
      position,
      score: currentScore + scoreAdd,
      is_finished: isFinished,
      finish_time: isFinished ? new Date().toISOString() : null,
    })
    .eq('id', body.player_id)
    .select()
    .single();

  const { advanced } = await maybeAutoAdvanceAfterAnswer(supabase, session.id);

  return NextResponse.json({
    is_correct,
    player: updatedPlayer,
    score_gained: scoreAdd,
    session_advanced: advanced,
  });
}

function scoreFromAnswer(isCorrect: boolean, timeTaken: number): number {
  if (!isCorrect) return 0;
  return Math.max(10, Math.round(100 - timeTaken * 5));
}
