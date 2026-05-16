import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseForApi } from '@/lib/supabase/api';

export const runtime = 'nodejs';

// POST /api/game/[pin]/start - 게임 시작
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ pin: string }> }
) {
  const { pin } = await params;
  const supabase = createSupabaseForApi();

  const { data: session } = await supabase
    .from('game_sessions')
    .select('id')
    .eq('pin', pin)
    .single();

  if (!session) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  const now = new Date().toISOString();
  const legacyUpdate = { status: 'playing' as const, started_at: now };
  const fullUpdate = {
    ...legacyUpdate,
    current_question_index: 0,
    question_started_at: now,
  };

  let { data, error } = await supabase
    .from('game_sessions')
    .update(fullUpdate)
    .eq('pin', pin)
    .select()
    .single();

  if (error) {
    const legacy = await supabase
      .from('game_sessions')
      .update(legacyUpdate)
      .eq('pin', pin)
      .select()
      .single();

    if (legacy.error) {
      return NextResponse.json(
        {
          error: legacy.error.message,
          hint: 'RLS·테이블 권한·환경 변수를 확인하세요. 첫 시도 오류는 fullUpdateError에 있습니다.',
          fullUpdateError: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...legacy.data,
      _usedLegacyStart: true,
      _warning:
        '문항 동기 컬럼이 없거나 갱신에 실패해 기본 필드만 적용했습니다. supabase/migrations/002_session_question_sync.sql 적용을 권장합니다.',
      _fullUpdateError: error.message,
    });
  }

  return NextResponse.json(data);
}
