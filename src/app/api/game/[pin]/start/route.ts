import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseForApi } from '@/lib/supabase/api';

function isMissingSyncColumnsError(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes('column') && m.includes('does not exist');
}

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
  const fullUpdate = {
    status: 'playing' as const,
    started_at: now,
    current_question_index: 0,
    question_started_at: now,
  };

  let { data, error } = await supabase.from('game_sessions').update(fullUpdate).eq('pin', pin).select().single();

  if (error) {
    if (isMissingSyncColumnsError(error.message)) {
      const legacy = await supabase
        .from('game_sessions')
        .update({ status: 'playing', started_at: now })
        .eq('pin', pin)
        .select()
        .single();
      if (legacy.error) {
        return NextResponse.json({ error: legacy.error.message }, { status: 500 });
      }
      return NextResponse.json({
        ...legacy.data,
        _warning:
          'DB에 supabase/migrations/002_session_question_sync.sql 을 적용하면 문항 동기·40초 타이머가 정상 동작합니다.',
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
