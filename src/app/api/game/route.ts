import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generatePin } from '@/lib/utils';
import { getQuestions } from '@/lib/questions/bank';
import { MapId } from '@/types/game';
import { getSupabaseServerConfig, getSupabaseEnvDebug } from '@/lib/supabase/api';

/** Vercel Edge가 아닌 Node에서 실행 (Supabase 클라이언트 안정성) */
export const runtime = 'nodejs';

function supabaseHint(message: unknown): string {
  const raw = typeof message === 'string' ? message : message == null ? '' : JSON.stringify(message);
  const m = raw.toLowerCase();
  if (m.includes('relation') && m.includes('does not exist')) {
    return 'Supabase에 테이블이 없습니다. SQL Editor에서 supabase/migrations/001_initial_schema.sql 전체를 실행하세요.';
  }
  if (m.includes('invalid api key') || m.includes('jwt')) {
    return 'Supabase 키가 잘못되었습니다. Vercel 환경 변수 NEXT_PUBLIC_SUPABASE_ANON_KEY(anon 공개 키)와 NEXT_PUBLIC_SUPABASE_URL을 확인하세요.';
  }
  if (m.includes('fetch failed') || m.includes('network')) {
    return 'Supabase에 연결할 수 없습니다. Project URL이 https://xxx.supabase.co 형태인지 확인하세요(/rest/v1 제거).';
  }
  if (m.includes('permission denied') || m.includes('rls') || m.includes('row-level security')) {
    return 'DB 권한(RLS) 문제입니다. Supabase에서 001_initial_schema.sql의 RLS 정책이 적용됐는지 확인하세요.';
  }
  return raw || '알 수 없는 Supabase 오류';
}

// POST /api/game - 새 게임 세션 생성
export async function POST(request: NextRequest) {
  try {
    const cfg = getSupabaseServerConfig();
    if (!cfg) {
      return NextResponse.json(
        {
          error:
            'Supabase 환경 변수가 이 배포(서버)에 없습니다. Vercel → Settings → Environment Variables에서 URL·anon 키를 추가할 때 반드시 Production에도 체크하고, Save 후 Redeploy 하세요.',
          env: getSupabaseEnvDebug(),
          hint:
            '이름은 둘 중 한 세트면 됩니다: (1) NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY (2) SUPABASE_URL + SUPABASE_ANON_KEY — 값은 Supabase Project Settings → API와 동일하게. 학생/교사 화면 실시간 기능은 브라우저용이라 (1)도 꼭 넣는 것을 권장합니다.',
          build: 'equa-api-v2',
        },
        { status: 503 }
      );
    }

    const supabase = createClient(cfg.url, cfg.key);

    let body: { map_type?: MapId; question_count?: number; teacher_name?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: '요청 본문이 JSON이 아닙니다.' }, { status: 400 });
    }

    const { map_type, question_count, teacher_name } = body;

    if (!map_type || typeof question_count !== 'number' || !teacher_name?.trim()) {
      return NextResponse.json(
        { error: 'map_type, question_count, teacher_name이 필요합니다.' },
        { status: 400 }
      );
    }

    // 고유 PIN 생성
    let pin = generatePin();
    let attempts = 0;
    while (attempts < 10) {
      const { data: existing } = await supabase
        .from('game_sessions')
        .select('pin')
        .eq('pin', pin)
        .maybeSingle();
      if (!existing) break;
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
      const detail = (error as { message?: string }).message ?? JSON.stringify(error);
      const hint = supabaseHint(detail);
      return NextResponse.json({ error: hint, details: detail, build: 'equa-api-v2' }, { status: 500 });
    }

    if (!session?.id) {
      return NextResponse.json(
        { error: '세션이 생성됐지만 id가 없습니다. Supabase 로그를 확인하세요.', build: 'equa-api-v2' },
        { status: 500 }
      );
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
      const detail = (qError as { message?: string }).message ?? JSON.stringify(qError);
      const hint = supabaseHint(detail);
      return NextResponse.json(
        {
          error: `문제 목록 저장 실패: ${hint}`,
          details: detail,
          session,
          pin,
          build: 'equa-api-v2',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ session, pin, build: 'equa-api-v2' });
  } catch (err) {
    console.error('POST /api/game error:', err);
    const msg =
      err instanceof Error
        ? err.message
        : typeof err === 'string'
          ? err
          : JSON.stringify(err);
    return NextResponse.json(
      {
        error: `방 만들기 처리 중 오류: ${msg}`,
        hint: 'Vercel → 프로젝트 → Logs 에서 같은 시각의 에러 로그를 확인하세요.',
        build: 'equa-api-v2',
      },
      { status: 500 }
    );
  }
}
