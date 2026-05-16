import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseForApi } from '@/lib/supabase/api';
import { answersEqual, maybeAutoAdvanceAfterAnswer, rewardPointsPreview } from '@/lib/game/sessionAdvance';
import type { Question } from '@/types/game';

export const runtime = 'nodejs';

// POST /api/game/[pin]/answer - 답 제출 (세션 문항 인덱스와 일치할 때만 허용). 플레이어 행은 라운드 종료 시 동기화.
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

  const { data: session, error: sessionFetchError } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('pin', pin)
    .single();

  if (sessionFetchError || !session) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  if (session.status !== 'playing') {
    return NextResponse.json({ error: 'Game is not active' }, { status: 400 });
  }

  const serverQ =
    session.current_question_index === undefined || session.current_question_index === null
      ? 0
      : Number(session.current_question_index);
  const serverIdx = Number.isFinite(serverQ) ? serverQ : 0;

  if (body.question_index !== serverIdx) {
    return NextResponse.json(
      {
        error: 'stale_question',
        message: '이 문항은 이미 끝났습니다. 화면이 곧 갱신됩니다.',
        current_question_index: serverIdx,
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

  let expectedAnswer = body.correct_answer;
  const { data: qRow } = await supabase
    .from('session_questions')
    .select('question_data')
    .eq('session_id', session.id)
    .eq('question_index', body.question_index)
    .maybeSingle();

  let qType: Question['type'] = 'multiple';
  if (qRow?.question_data) {
    try {
      const q = JSON.parse(qRow.question_data as string) as Question;
      qType = q.type;
      if (typeof q.answer === 'string' && q.answer.trim() !== '') {
        expectedAnswer = q.answer;
      }
    } catch {
      /* ignore */
    }
  }

  if (existingAns) {
    const { data: player } = await supabase.from('players').select('*').eq('id', body.player_id).single();
    return NextResponse.json({
      is_correct: existingAns.is_correct,
      official_answer: expectedAnswer,
      my_answer: body.answer,
      player,
      score_gained: 0,
      duplicate: true,
    });
  }

  const is_correct = answersEqual(body.answer, expectedAnswer, qType);
  const score_gained_preview = rewardPointsPreview(is_correct, body.time_taken);

  await supabase.from('player_answers').insert({
    player_id: body.player_id,
    session_id: session.id,
    question_index: body.question_index,
    is_correct,
    time_taken: body.time_taken,
    answer_given: body.answer,
  });

  const advanceResult = await maybeAutoAdvanceAfterAnswer(supabase, session.id);

  const { data: playerFresh } = await supabase.from('players').select('*').eq('id', body.player_id).single();

  return NextResponse.json({
    is_correct,
    official_answer: expectedAnswer,
    my_answer: body.answer,
    player: playerFresh,
    /** 채점액(라운드가 끝나 sync 된 뒤 점수/위치에 반영) */
    score_gained: score_gained_preview,
    session_advanced: advanceResult.advanced,
    ...(advanceResult.session ? { session: advanceResult.session } : {}),
  });
}
