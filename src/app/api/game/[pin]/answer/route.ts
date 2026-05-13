import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/game/[pin]/answer - 답 제출
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pin: string }> }
) {
  const { pin } = await params;
  const supabase = await createClient();
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
    .select('id, question_count')
    .eq('pin', pin)
    .single();

  if (!session) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  const is_correct = body.answer.trim() === body.correct_answer.trim();

  // 답변 기록
  await supabase.from('player_answers').insert({
    player_id: body.player_id,
    session_id: session.id,
    question_index: body.question_index,
    is_correct,
    time_taken: body.time_taken,
    answer_given: body.answer,
  });

  // 플레이어 상태 업데이트
  const { data: player } = await supabase
    .from('players')
    .select('correct_count, current_question_index')
    .eq('id', body.player_id)
    .single();

  if (player) {
    const newCorrectCount = is_correct ? player.correct_count + 1 : player.correct_count;
    const newQuestionIndex = player.current_question_index + 1;
    const totalQ = body.total_questions;
    // 포지션: 정답 비율 + 속도 보너스
    const speedBonus = is_correct ? Math.max(0, (15 - body.time_taken) / 15) * 3 : 0;
    const position = Math.min(100, (newCorrectCount / totalQ) * 100 + speedBonus);
    const isFinished = newQuestionIndex >= totalQ;
    const scoreAdd = is_correct ? Math.max(10, Math.round(100 - body.time_taken * 5)) : 0;

    const { data: updatedPlayer } = await supabase
      .from('players')
      .update({
        correct_count: newCorrectCount,
        current_question_index: newQuestionIndex,
        position,
        score: (player as { score?: number }).score ?? 0 + scoreAdd,
        is_finished: isFinished,
        finish_time: isFinished ? new Date().toISOString() : null,
      })
      .eq('id', body.player_id)
      .select()
      .single();

    return NextResponse.json({ is_correct, player: updatedPlayer, score_gained: scoreAdd });
  }

  return NextResponse.json({ is_correct });
}
