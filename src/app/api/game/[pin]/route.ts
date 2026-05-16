import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseForApi } from '@/lib/supabase/api';

export const runtime = 'nodejs';

// GET /api/game/[pin] - 게임 세션 정보 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ pin: string }> }
) {
  const { pin } = await params;
  const supabase = createSupabaseForApi();

  const { data: session, error } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('pin', pin)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  return NextResponse.json(session);
}

// PATCH /api/game/[pin] - 게임 세션 업데이트 (맵, 설정 변경)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ pin: string }> }
) {
  const { pin } = await params;
  const supabase = createSupabaseForApi();
  const body = await request.json();

  const { data, error } = await supabase
    .from('game_sessions')
    .update(body)
    .eq('pin', pin)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
