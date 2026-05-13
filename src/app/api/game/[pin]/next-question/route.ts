import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseForApi } from '@/lib/supabase/api';
import { advanceToNextQuestion } from '@/lib/game/sessionAdvance';

/** 교사가 미응답자를 넘기고 다음 문항으로 진행 (미제출자는 자동 오답 처리) */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ pin: string }> }
) {
  const { pin } = await params;
  const supabase = createSupabaseForApi();

  const { data: session, error } = await supabase.from('game_sessions').select('*').eq('pin', pin).single();

  if (error || !session) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  if (session.status !== 'playing') {
    return NextResponse.json({ error: '진행 중인 게임이 아닙니다.' }, { status: 400 });
  }

  const result = await advanceToNextQuestion(supabase, session, { finalizeCurrent: true });

  if (!result.advanced || !result.session) {
    return NextResponse.json({ error: '진행할 수 없습니다.' }, { status: 400 });
  }

  return NextResponse.json({ session: result.session, finished: result.finished });
}
