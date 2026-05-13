import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseForApi } from '@/lib/supabase/api';

// POST /api/game/[pin]/finish - 게임 종료
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ pin: string }> }
) {
  const { pin } = await params;
  const supabase = createSupabaseForApi();

  const { data, error } = await supabase
    .from('game_sessions')
    .update({ status: 'finished', finished_at: new Date().toISOString() })
    .eq('pin', pin)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// GET /api/game/[pin]/finish - 결과 데이터 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ pin: string }> }
) {
  const { pin } = await params;
  const supabase = createSupabaseForApi();

  const { data: session } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('pin', pin)
    .single();

  if (!session) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  const { data: players } = await supabase
    .from('players')
    .select('*')
    .eq('session_id', session.id)
    .order('score', { ascending: false });

  const { data: answers } = await supabase
    .from('player_answers')
    .select('*')
    .eq('session_id', session.id);

  const { data: questions } = await supabase
    .from('session_questions')
    .select('*')
    .eq('session_id', session.id)
    .order('question_index', { ascending: true });

  return NextResponse.json({ session, players: players ?? [], answers: answers ?? [], questions: questions ?? [] });
}
