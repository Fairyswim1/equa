import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseForApi } from '@/lib/supabase/api';
import { CharacterId } from '@/types/game';

export const runtime = 'nodejs';

// GET /api/game/[pin]/players - 플레이어 목록 조회
export async function GET(
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

  const { data: players, error } = await supabase
    .from('players')
    .select('*')
    .eq('session_id', session.id)
    .order('score', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(players ?? []);
}

// POST /api/game/[pin]/players - 플레이어 추가 (참여)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pin: string }> }
) {
  const { pin } = await params;
  const supabase = createSupabaseForApi();
  const body = await request.json() as { nickname: string; character: CharacterId };

  const { data: session } = await supabase
    .from('game_sessions')
    .select('id, status')
    .eq('pin', pin)
    .single();

  if (!session) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }
  if (session.status !== 'waiting' && session.status !== 'selecting') {
    return NextResponse.json({ error: 'Game already started' }, { status: 400 });
  }

  // 닉네임 중복 확인
  const { data: existing } = await supabase
    .from('players')
    .select('id')
    .eq('session_id', session.id)
    .eq('nickname', body.nickname)
    .single();

  if (existing) {
    return NextResponse.json({ error: '이미 사용 중인 닉네임입니다.' }, { status: 400 });
  }

  const { data: player, error } = await supabase
    .from('players')
    .insert({
      session_id: session.id,
      nickname: body.nickname,
      character: body.character,
      score: 0,
      position: 0,
      current_question_index: 0,
      correct_count: 0,
      is_finished: false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(player);
}
