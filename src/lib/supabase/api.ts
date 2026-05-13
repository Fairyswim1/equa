import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type SupabaseServerConfig = { url: string; key: string };

/**
 * 서버(API Route)에서 Supabase 접속 정보.
 * Vercel에서는 NEXT_PUBLIC_* 가 Production에 없으면 비어 있을 수 있어,
 * 서버 전용 이름(SUPABASE_*)도 허용합니다.
 * 브라우저(실시간 구독)는 여전히 NEXT_PUBLIC_* 가 필요합니다.
 */
export function getSupabaseServerConfig(): SupabaseServerConfig | null {
  const url =
    process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;
  return { url, key };
}

/** Route Handler에서만 사용. 브라우저용이 아님. */
export function getSupabaseEnvDebug(): {
  hasSUPABASE_URL: boolean;
  hasNEXT_PUBLIC_SUPABASE_URL: boolean;
  hasSUPABASE_ANON_KEY: boolean;
  hasNEXT_PUBLIC_SUPABASE_ANON_KEY: boolean;
} {
  return {
    hasSUPABASE_URL: Boolean(process.env.SUPABASE_URL?.trim()),
    hasNEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
    hasSUPABASE_ANON_KEY: Boolean(process.env.SUPABASE_ANON_KEY?.trim()),
    hasNEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()),
  };
}

/**
 * Route Handler / 서버 API 전용. 쿠키를 쓰지 않아 Vercel 등에서 안정적으로 동작합니다.
 */
export function createSupabaseForApi(): SupabaseClient {
  const cfg = getSupabaseServerConfig();
  if (!cfg) {
    throw new Error(
      'Supabase URL/anon 키가 없습니다. Vercel에 SUPABASE_URL+SUPABASE_ANON_KEY 또는 NEXT_PUBLIC_SUPABASE_URL+NEXT_PUBLIC_SUPABASE_ANON_KEY 를 Production으로 넣고 Redeploy 하세요.'
    );
  }
  return createClient(cfg.url, cfg.key);
}
