import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Route Handler / 서버 API 전용. 쿠키를 쓰지 않아 Vercel 등에서 안정적으로 동작합니다.
 */
export function createSupabaseForApi(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 가 없습니다.');
  }
  return createClient(url.trim(), key.trim());
}
