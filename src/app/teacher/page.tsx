'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MapCard } from '@/components/maps/MapBackground';
import { CharacterSprite } from '@/components/characters/CharacterSprite';
import { Player, GameSession, MapId, CharacterId } from '@/types/game';
import { getRankEmoji } from '@/lib/utils';

function TeacherPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const existingPin = searchParams.get('pin');

  const [step, setStep] = useState<'setup' | 'lobby' | 'playing' | 'finished'>(existingPin ? 'lobby' : 'setup');
  const [mapType, setMapType] = useState<MapId>('forest');
  const [questionCount, setQuestionCount] = useState(10);
  const [teacherName, setTeacherName] = useState('');
  const [session, setSession] = useState<GameSession | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSession = useCallback(async (pin: string) => {
    const res = await fetch(`/api/game/${pin}`);
    if (res.ok) {
      const data = await res.json();
      setSession(data);
      if (data.status === 'playing') setStep('playing');
      if (data.status === 'finished') setStep('finished');
    }
  }, []);

  const fetchPlayers = useCallback(async (pin: string) => {
    const res = await fetch(`/api/game/${pin}/players`);
    if (res.ok) {
      const data = await res.json();
      setPlayers(data);
    }
  }, []);

  useEffect(() => {
    if (existingPin) {
      fetchSession(existingPin);
      fetchPlayers(existingPin);
    }
  }, [existingPin, fetchSession, fetchPlayers]);

  // Supabase Realtime 구독
  useEffect(() => {
    if (!session) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`game:${session.pin}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `session_id=eq.${session.id}` },
        () => { fetchPlayers(session.pin); }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_sessions', filter: `id=eq.${session.id}` },
        (payload) => {
          const updated = payload.new as GameSession;
          setSession(updated);
          if (updated.status === 'playing') setStep('playing');
          if (updated.status === 'finished') setStep('finished');
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session, fetchPlayers]);

  const handleCreateGame = async () => {
    if (!teacherName.trim()) { setError('이름을 입력해주세요.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ map_type: mapType, question_count: questionCount, teacher_name: teacherName }),
      });
      const data = await res.json();
      if (!res.ok) {
        const main =
          typeof data.error === 'string' && data.error ? data.error : `게임 생성 실패 (${res.status})`;
        const extra =
          typeof data.details === 'string' && data.details ? `\n(${data.details})` : '';
        const build =
          typeof data.build === 'string' && data.build ? `\n[빌드: ${data.build}]` : '';
        const envHint =
          data.env && typeof data.env === 'object'
            ? `\n(서버에 잡힌 변수: PUBLIC_URL=${Boolean((data.env as { hasNEXT_PUBLIC_SUPABASE_URL?: boolean }).hasNEXT_PUBLIC_SUPABASE_URL)}, PUBLIC_KEY=${Boolean((data.env as { hasNEXT_PUBLIC_SUPABASE_ANON_KEY?: boolean }).hasNEXT_PUBLIC_SUPABASE_ANON_KEY)}, SUPABASE_URL=${Boolean((data.env as { hasSUPABASE_URL?: boolean }).hasSUPABASE_URL)}, SUPABASE_ANON=${Boolean((data.env as { hasSUPABASE_ANON_KEY?: boolean }).hasSUPABASE_ANON_KEY)})`
            : '';
        const hint =
          typeof data.hint === 'string' && data.hint ? `\n※ ${data.hint}` : '';
        throw new Error(main + extra + build + envHint + hint);
      }
      setSession(data.session);
      setStep('lobby');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = async () => {
    if (!session) return;
    if (players.length < 1) { setError('최소 1명이 참여해야 합니다.'); return; }
    setLoading(true);
    try {
      await fetch(`/api/game/${session.pin}/start`, { method: 'POST' });
      setStep('playing');
    } finally {
      setLoading(false);
    }
  };

  const handleFinishGame = async () => {
    if (!session) return;
    await fetch(`/api/game/${session.pin}/finish`, { method: 'POST' });
    setStep('finished');
  };

  const maps: MapId[] = ['forest', 'ocean', 'space', 'sky', 'volcano'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-3 mb-8"
        >
          <button onClick={() => router.push('/')} className="text-white/60 hover:text-white transition-colors text-sm">
            ← 홈
          </button>
          <h1 className="text-3xl font-black text-white">👩‍🏫 선생님 대시보드</h1>
          {session && (
            <span className="ml-auto bg-white/10 text-white px-4 py-1 rounded-full font-mono text-lg font-bold tracking-widest">
              PIN: {session.pin}
            </span>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {/* STEP 1: 게임 설정 */}
          {step === 'setup' && (
            <motion.div key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="grid md:grid-cols-2 gap-6">
                {/* 기본 설정 */}
                <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
                  <h2 className="text-xl font-bold text-white mb-4">⚙️ 기본 설정</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-purple-200 text-sm mb-1 block">선생님 이름</label>
                      <input
                        value={teacherName}
                        onChange={(e) => setTeacherName(e.target.value)}
                        placeholder="이름 입력"
                        className="w-full px-4 py-2 rounded-xl bg-white/20 text-white placeholder-purple-300 border border-white/30 focus:outline-none focus:border-yellow-400"
                      />
                    </div>
                    <div>
                      <label className="text-purple-200 text-sm mb-2 block">
                        문항 수: <span className="text-yellow-400 font-bold">{questionCount}문제</span>
                      </label>
                      <input
                        type="range"
                        min={5} max={30} step={5}
                        value={questionCount}
                        onChange={(e) => setQuestionCount(Number(e.target.value))}
                        className="w-full accent-yellow-400"
                      />
                      <div className="flex justify-between text-purple-300 text-xs mt-1">
                        {[5, 10, 15, 20, 25, 30].map(n => <span key={n}>{n}</span>)}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[5, 10, 15, 20, 25, 30].map((n) => (
                        <button
                          key={n}
                          onClick={() => setQuestionCount(n)}
                          className={`py-2 rounded-xl text-sm font-bold transition-all ${
                            questionCount === n
                              ? 'bg-yellow-400 text-yellow-900'
                              : 'bg-white/10 text-white hover:bg-white/20'
                          }`}
                        >
                          {n}문제
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 맵 선택 */}
                <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
                  <h2 className="text-xl font-bold text-white mb-4">🗺️ 맵 선택</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {maps.map((m) => (
                      <MapCard key={m} map={m} selected={mapType === m} onClick={() => setMapType(m)} />
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-center mt-4">
                  ⚠️ {error}
                </motion.p>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateGame}
                disabled={loading}
                className="mt-6 w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl text-white font-black text-xl shadow-xl hover:shadow-emerald-500/30 transition-all disabled:opacity-50"
              >
                {loading ? '생성 중...' : '🎮 게임 방 만들기'}
              </motion.button>
            </motion.div>
          )}

          {/* STEP 2: 대기실 (로비) */}
          {step === 'lobby' && session && (
            <motion.div key="lobby" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="grid md:grid-cols-3 gap-6">
                {/* PIN 크게 표시 */}
                <div className="md:col-span-1 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 text-center">
                  <p className="text-yellow-900 font-bold text-sm mb-2">학생들에게 알려주세요!</p>
                  <p className="text-yellow-900 text-sm mb-3">게임 PIN 번호</p>
                  <div className="bg-white rounded-xl p-4 mb-3">
                    <p className="text-5xl font-black text-orange-600 tracking-widest">{session.pin}</p>
                  </div>
                  <p className="text-yellow-900 text-xs">
                    📱 접속: {typeof window !== 'undefined' ? window.location.origin : ''}
                  </p>
                  <div className="mt-4 text-left space-y-2 text-sm text-yellow-900">
                    <p>🗺️ 맵: {session.map_type}</p>
                    <p>📝 문항 수: {session.question_count}문제</p>
                    <p>👥 참여 중: {players.length}명</p>
                  </div>
                </div>

                {/* 참여 학생 목록 */}
                <div className="md:col-span-2 bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
                  <h2 className="text-xl font-bold text-white mb-4">
                    👥 참여 학생 ({players.length}명)
                  </h2>
                  {players.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-purple-300">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="text-5xl mb-3"
                      >
                        ⏳
                      </motion.div>
                      <p>학생들이 참여하길 기다리는 중...</p>
                      <p className="text-sm mt-1">PIN 번호를 알려주세요!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                      {players.map((p) => (
                        <motion.div
                          key={p.id}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="bg-white/10 rounded-xl p-3 flex items-center gap-2"
                        >
                          <CharacterSprite character={p.character as CharacterId} size={36} />
                          <span className="text-white text-sm font-medium truncate">{p.nickname}</span>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleStartGame}
                      disabled={loading || players.length < 1}
                      className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-bold text-lg disabled:opacity-50"
                    >
                      {loading ? '시작 중...' : '🚀 게임 시작!'}
                    </motion.button>
                  </div>
                  {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: 게임 진행 중 - 실시간 모니터링 */}
          {step === 'playing' && session && (
            <motion.div key="playing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">🏃 실시간 레이스 현황</h2>
                  <button
                    onClick={handleFinishGame}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-white text-sm font-bold transition-colors"
                  >
                    게임 종료
                  </button>
                </div>

                {/* 레이스 트랙 */}
                <div className="space-y-3">
                  {[...players]
                    .sort((a, b) => b.position - a.position)
                    .map((player, idx) => (
                      <motion.div
                        key={player.id}
                        layout
                        className="relative bg-white/5 rounded-xl p-3"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-white font-bold w-6 text-center text-sm">{idx + 1}</span>
                          <CharacterSprite character={player.character as CharacterId} size={32} running />
                          <span className="text-white font-medium text-sm">{player.nickname}</span>
                          <span className="ml-auto text-yellow-400 font-bold text-sm">{player.score}점</span>
                          <span className="text-purple-300 text-xs">
                            {player.current_question_index}/{session.question_count}문제
                          </span>
                          {player.is_finished && (
                            <span className="text-green-400 text-xs font-bold">완주! ✓</span>
                          )}
                        </div>
                        {/* 진행 바 */}
                        <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                            animate={{ width: `${player.position}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                        {/* 캐릭터 위치 표시 */}
                        <motion.div
                          className="absolute bottom-4"
                          animate={{ left: `${Math.max(2, player.position - 3)}%` }}
                          transition={{ duration: 0.5 }}
                        >
                          <CharacterSprite character={player.character as CharacterId} size={24} running />
                        </motion.div>
                      </motion.div>
                    ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: 결과 */}
          {step === 'finished' && session && (
            <motion.div key="finished" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="text-center mb-6">
                <motion.h2
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-4xl font-black text-yellow-400 mb-2"
                >
                  🎉 게임 종료!
                </motion.h2>
              </div>
              <div className="flex gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => router.push(`/results/${session.pin}`)}
                  className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl text-white font-black text-lg"
                >
                  📊 전체 결과 보기
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => router.push('/teacher')}
                  className="px-8 py-4 bg-white/10 rounded-2xl text-white font-bold text-lg"
                >
                  🆕 새 게임
                </motion.button>
              </div>

              {/* 간단 순위 미리보기 */}
              <div className="mt-6 bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
                <h3 className="text-white font-bold mb-4">🏆 순위 미리보기</h3>
                <div className="space-y-2">
                  {[...players]
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 5)
                    .map((p, idx) => (
                      <div key={p.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                        <span className="text-xl">{getRankEmoji(idx + 1)}</span>
                        <CharacterSprite character={p.character as CharacterId} size={32} />
                        <span className="text-white font-medium">{p.nickname}</span>
                        <span className="ml-auto text-yellow-400 font-bold">{p.score}점</span>
                      </div>
                    ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function TeacherPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">로딩 중...</div>}>
      <TeacherPageInner />
    </Suspense>
  );
}
