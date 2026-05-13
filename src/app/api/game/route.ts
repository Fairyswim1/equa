import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generatePin } from '@/lib/utils';
import { getQuestions } from '@/lib/questions/bank';
import { MapId } from '@/types/game';

// POST /api/game - 새 게임 세션 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { map_type, question_count, teacher_name } = body as {
      map_type: MapId;
      question_count: number;
      teacher_name: string;
    };

    const supabase = await createClient();

    // 고유 PIN 생성
    let pin = generatePin();
    let attempts = 0;
    while (attempts < 10) {
      const { data } = await supabase
        .from('game_sessions')
        .select('pin')
        .eq('pin', pin)
        .single();
      if (!data) break;
      pin = generatePin();
      attempts++;
    }

    // 게임 세션 생성
    const { data: session, error } = await supabase
      .from('game_sessions')
      .insert({
        pin,
        map_type,
        question_count,
        status: 'waiting',
        teacher_name,
      })
      .select()
      .single();

    if (error) {
      console.error('Session creation error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 문제 은행에서 질문 생성하여 저장
    const questions = getQuestions(question_count);
    const questionInserts = questions.map((q, idx) => ({
      session_id: session.id,
      question_index: idx,
      question_data: JSON.stringify(q),
    }));

    const { error: qError } = await supabase
      .from('session_questions')
      .insert(questionInserts);

    if (qError) {
      console.error('Questions insert error:', qError);
    }

    return NextResponse.json({ session, pin });
  } catch (err) {
    console.error('POST /api/game error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
