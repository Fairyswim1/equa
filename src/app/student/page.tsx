'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CharacterCard, CharacterSprite } from '@/components/characters/CharacterSprite';
import { ClimbRaceTrack } from '@/components/game/ClimbRaceTrack';
import { GameSession, Player, Question, CharacterId } from '@/types/game';
import { getRankEmoji, cn } from '@/lib/utils';

const CHARACTERS: CharacterId[] = ['fox', 'cat', 'rabbit', 'bear', 'penguin', 'dog'];

function StudentPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pinFromUrl = searchParams.get('pin') ?? '';

  const [step, setStep] = useState<'join' | 'character' | 'waiting' | 'playing' | 'finished'>('join');
  const [pin, setPin] = useState(pinFromUrl);
  const [nickname, setNickname] = useState('');
  const [selectedChar, setSelectedChar] = useState<CharacterId | null>(null);
  const [session, setSession] = useState<GameSession | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState<Question | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerResult, setAnswerResult] = useState<'correct' | 'wrong' | null>(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shortAnswer, setShortAnswer] = useState('');
  const [scoreGained, setScoreGained] = useState(0);

  // 게임 시작 감지
  const fetchPlayers = useCallback(async (sessionId: string, sessionPin: string) => {
    const res = await fetch(`/api/game/${sessionPin}/players`);
    if (res.ok) {
      const data: Player[] = await res.json();
      setAllPlayers(data);
      if (player) {
        const me = data.find(p => p.id === player.id);
        if (me) setPlayer(me);
      }
    }
    void sessionId;
  }, [player]);

  // Supabase Realtime
  useEffect(() => {
    if (!session || !player) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`student:${session.pin}:${player.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_sessions', filter: `id=eq.${session.id}` },
        (payload) => {
          const updated = payload.new as GameSession;
          setSession(updated);
          if (updated.status === 'playing' && step === 'waiting') {
            setStep('playing');
          }
          if (updated.status === 'finished') {
            setStep('finished');
          }
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `session_id=eq.${session.id}` },
        () => fetchPlayers(session.id, session.pin)
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session, player, step, fetchPlayers]);

  // 문제 타이머
  useEffect(() => {
    if (step !== 'playing' || answerResult !== null) return;
    if (timeLeft <= 0) {
      handleSubmitAnswer('');
      return;
    }
    const t = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, timeLeft, answerResult]);

  // 문제 로드 (게임 시작 시)
  useEffect(() => {
    if (step === 'playing' && session && questions.length === 0) {
      loadQuestions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, session]);

  const loadQuestions = async () => {
    if (!session) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('session_questions')
      .select('question_data')
      .eq('session_id', session.id)
      .order('question_index', { ascending: true });
    if (data && data.length > 0) {
      const qs = data.map(d => JSON.parse(d.question_data) as Question);
      setQuestions(qs);
      setCurrentQ(qs[0]);
      setQIndex(0);
      setTimeLeft(20);
      setQuestionStartTime(Date.now());
    }
  };

  const nextQuestion = useCallback((currentIndex: number, qs: Question[]) => {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= qs.length) {
      setStep('finished');
      return;
    }
    setQIndex(nextIdx);
    setCurrentQ(qs[nextIdx]);
    setSelectedAnswer(null);
    setShortAnswer('');
    setAnswerResult(null);
    setTimeLeft(20);
    setQuestionStartTime(Date.now());
    setScoreGained(0);
  }, []);

  useEffect(() => {
    if (answerResult !== null) {
      const t = setTimeout(() => {
        nextQuestion(qIndex, questions);
      }, 1800);
      return () => clearTimeout(t);
    }
  }, [answerResult, qIndex, questions, nextQuestion]);

  const handleJoin = async () => {
    if (!nickname.trim()) { setError('닉네임을 입력해주세요.'); return; }
    if (pin.length !== 6) { setError('PIN 번호 6자리를 입력해주세요.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/game/${pin}`);
      if (!res.ok) { setError('존재하지 않는 PIN입니다.'); return; }
      const sessionData: GameSession = await res.json();
      if (sessionData.status === 'playing' || sessionData.status === 'finished') {
        setError('이미 시작된 게임입니다.');
        return;
      }
      setSession(sessionData);
      setStep('character');
    } catch {
      setError('서버 연결 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCharacterAndJoin = async () => {
    if (!selectedChar || !session) { setError('캐릭터를 선택해주세요!'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/game/${session.pin}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, character: selectedChar }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? '참여 실패');
        return;
      }
      const playerData: Player = await res.json();
      setPlayer(playerData);
      setStep('waiting');
    } catch {
      setError('서버 연결 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (answer: string) => {
    if (!player || !currentQ || !session || answerResult !== null) return;
    const timeTaken = (Date.now() - questionStartTime) / 1000;
    const finalAnswer = answer !== undefined ? answer : (currentQ.type === 'short' ? shortAnswer : selectedAnswer ?? '');

    const res = await fetch(`/api/game/${session.pin}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: player.id,
        question_index: qIndex,
        answer: finalAnswer,
        time_taken: timeTaken,
        correct_answer: currentQ.answer,
        total_questions: session.question_count,
      }),
    });

    const data = await res.json();
    const isCorrect = data.is_correct;
    setAnswerResult(isCorrect ? 'correct' : 'wrong');
    if (data.player) setPlayer(data.player);
    if (data.score_gained) setScoreGained(data.score_gained);
  };

  const handleMultipleChoice = (option: string) => {
    if (answerResult !== null) return;
    setSelectedAnswer(option);
    handleSubmitAnswer(option);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900">
      {/* Nearpod식: 와이드에서 퀴즈 | 맵 경주 */}
      {step === 'playing' && currentQ && player && session ? (
        <div className="flex min-h-screen flex-col lg:flex-row">
          <div className="relative order-1 h-[min(38vh,280px)] w-full shrink-0 lg:order-2 lg:h-screen lg:min-h-0 lg:w-[min(440px,40vw)]">
            <ClimbRaceTrack
              mapId={session.map_type}
              players={allPlayers.length ? allPlayers : [player]}
              emphasizePlayerId={player.id}
              timerSeconds={timeLeft}
              className="h-full rounded-none border-0 shadow-none lg:rounded-l-none"
            />
          </div>
          <div className="relative z-30 order-2 flex min-h-0 flex-1 flex-col lg:order-1">
            <div className="flex items-center justify-center gap-2 bg-[#6B4BA8] py-3 text-center text-sm font-black text-white shadow-md">
              <span>문제 {qIndex + 1} / {session.question_count}</span>
              <span className="text-white/50">|</span>
              <span>{player.nickname}</span>
              <span className="text-amber-200">{player.score}점</span>
            </div>
            <div className="flex-1 overflow-y-auto bg-[#EDE7F6] p-3 sm:p-5">
              <motion.div
                key={qIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'mx-auto max-w-xl rounded-2xl border-2 bg-white p-5 shadow-lg',
                  answerResult === 'correct' && 'border-emerald-500 ring-2 ring-emerald-200',
                  answerResult === 'wrong' && 'border-red-400 ring-2 ring-red-100',
                  !answerResult && 'border-[#D1C4E9]'
                )}
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[11px] font-bold',
                      currentQ.category === 'complex' && 'bg-purple-100 text-purple-800',
                      currentQ.category === 'quadratic' && 'bg-blue-100 text-blue-800',
                      currentQ.category === 'concept' && 'bg-amber-100 text-amber-900'
                    )}
                  >
                    {currentQ.category === 'complex'
                      ? '복소수'
                      : currentQ.category === 'quadratic'
                        ? '이차방정식'
                        : '개념'}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                    {currentQ.type === 'multiple' ? '객관식' : '주관식'}
                  </span>
                  <span className="ml-auto text-amber-500">{'★'.repeat(currentQ.difficulty)}</span>
                </div>

                <p className="mb-4 text-base font-bold leading-relaxed text-slate-900">{currentQ.text}</p>

                <AnimatePresence>
                  {answerResult && (
                    <motion.div
                      initial={{ scale: 0.96, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={cn(
                        'mb-3 rounded-xl py-2.5 text-center text-base font-black',
                        answerResult === 'correct' && 'bg-emerald-100 text-emerald-800',
                        answerResult === 'wrong' && 'bg-red-100 text-red-800'
                      )}
                    >
                      {answerResult === 'correct' ? `정답! +${scoreGained}점` : `오답 — 정답: ${currentQ.answer}`}
                    </motion.div>
                  )}
                </AnimatePresence>

                {currentQ.type === 'multiple' && currentQ.options && (
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {currentQ.options.map((opt, i) => (
                      <motion.button
                        key={i}
                        type="button"
                        whileHover={answerResult === null ? { scale: 1.01 } : {}}
                        whileTap={answerResult === null ? { scale: 0.99 } : {}}
                        onClick={() => handleMultipleChoice(opt)}
                        disabled={answerResult !== null}
                        className={cn(
                          'rounded-xl border-2 py-3.5 px-4 text-left text-sm font-semibold transition-colors',
                          answerResult !== null && opt === currentQ.answer && 'border-emerald-500 bg-emerald-50 text-emerald-900',
                          answerResult !== null &&
                            opt === selectedAnswer &&
                            opt !== currentQ.answer &&
                            'border-red-400 bg-red-50 text-red-900',
                          answerResult === null && selectedAnswer === opt && 'border-amber-400 bg-amber-50',
                          answerResult === null && selectedAnswer !== opt && 'border-slate-200 bg-slate-50 hover:border-violet-300 hover:bg-violet-50/50'
                        )}
                      >
                        <span className="mr-2 font-black text-violet-600">{['①', '②', '③', '④'][i]}</span>
                        {opt}
                      </motion.button>
                    ))}
                  </div>
                )}

                {currentQ.type === 'short' && (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      placeholder="답 입력"
                      value={shortAnswer}
                      onChange={(e) => setShortAnswer(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && answerResult === null && handleSubmitAnswer(shortAnswer)}
                      disabled={answerResult !== null}
                      className="flex-1 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-center font-bold text-slate-900 focus:border-violet-500 focus:outline-none"
                    />
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => answerResult === null && handleSubmitAnswer(shortAnswer)}
                      disabled={answerResult !== null || !shortAnswer.trim()}
                      className="rounded-xl bg-amber-400 px-8 py-3 font-black text-amber-950 shadow disabled:opacity-40"
                    >
                      제출
                    </motion.button>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      ) : (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">

          {/* JOIN */}
          {step === 'join' && (
            <motion.div key="join" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}>
              <div className="text-center mb-8">
                <h1 className="text-4xl font-black text-white mb-2">🎮 게임 참여</h1>
                <p className="text-teal-200">선생님께 PIN 번호를 물어보세요!</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-3xl p-8 border border-white/20 space-y-4">
                <div>
                  <label className="text-teal-200 text-sm mb-1 block">게임 PIN 번호</label>
                  <input
                    type="text"
                    placeholder="6자리 숫자"
                    value={pin}
                    onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                    className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-teal-300 border border-white/30 focus:outline-none focus:border-yellow-400 text-center text-3xl font-bold tracking-widest"
                    maxLength={6}
                  />
                </div>
                <div>
                  <label className="text-teal-200 text-sm mb-1 block">닉네임</label>
                  <input
                    type="text"
                    placeholder="게임에서 사용할 이름"
                    value={nickname}
                    onChange={(e) => { setNickname(e.target.value.slice(0, 10)); setError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                    className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-teal-300 border border-white/30 focus:outline-none focus:border-yellow-400 text-center text-xl font-bold"
                    maxLength={10}
                  />
                </div>
                {error && <p className="text-red-300 text-sm text-center">⚠️ {error}</p>}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleJoin}
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white font-black text-xl"
                >
                  {loading ? '확인 중...' : '🚀 다음'}
                </motion.button>
                <button onClick={() => router.push('/')} className="w-full text-teal-300 hover:text-white text-sm transition-colors">
                  ← 돌아가기
                </button>
              </div>
            </motion.div>
          )}

          {/* CHARACTER SELECT */}
          {step === 'character' && (
            <motion.div key="character" initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -100 }}>
              <div className="text-center mb-6">
                <h2 className="text-3xl font-black text-white mb-2">🐾 캐릭터 선택</h2>
                <p className="text-teal-200">나를 대신해 달릴 친구를 골라봐!</p>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {CHARACTERS.map((c) => (
                  <CharacterCard key={c} character={c} selected={selectedChar === c} onClick={() => setSelectedChar(c)} />
                ))}
              </div>
              {error && <p className="text-red-300 text-sm text-center mb-3">⚠️ {error}</p>}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSelectCharacterAndJoin}
                disabled={loading || !selectedChar}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl text-white font-black text-xl disabled:opacity-50"
              >
                {loading ? '참여 중...' : `${selectedChar ? '🎮 게임 참여!' : '캐릭터를 선택해주세요'}`}
              </motion.button>
            </motion.div>
          )}

          {/* WAITING */}
          {step === 'waiting' && player && session && (
            <motion.div key="waiting" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <div className="text-center py-10">
                <motion.div
                  animate={{ y: [0, -15, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="mb-6"
                >
                  <CharacterSprite character={player.character as CharacterId} size={120} running />
                </motion.div>
                <h2 className="text-3xl font-black text-white mb-2">{player.nickname} 준비완료!</h2>
                <p className="text-teal-200 text-lg mb-6">선생님이 게임을 시작할 때까지 기다려요!</p>
                <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20 mb-6">
                  <p className="text-white/60 text-sm mb-3">현재 참여 인원</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {allPlayers.map((p) => (
                      <div key={p.id} className="flex items-center gap-1 bg-white/10 rounded-full px-3 py-1">
                        <CharacterSprite character={p.character as CharacterId} size={24} />
                        <span className="text-white text-sm">{p.nickname}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-yellow-400 font-bold text-lg"
                >
                  ⏳ 선생님을 기다리는 중...
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* FINISHED */}
          {(step === 'finished' || (player && player.is_finished)) && player && session && (
            <motion.div key="finished" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <div className="text-center py-6">
                <motion.div
                  initial={{ rotate: -10 }}
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-6xl mb-4"
                >
                  🏆
                </motion.div>
                <h2 className="text-4xl font-black text-yellow-400 mb-2">완주!</h2>
                <p className="text-white text-lg mb-2">{player.nickname}</p>
                <p className="text-teal-300 text-2xl font-bold mb-6">최종 점수: {player.score}점</p>

                <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20 mb-6">
                  <p className="text-white/60 text-sm mb-4">현재 순위</p>
                  <div className="space-y-2">
                    {[...allPlayers]
                      .sort((a, b) => b.score - a.score)
                      .map((p, idx) => (
                        <div
                          key={p.id}
                          className={`flex items-center gap-3 rounded-xl p-2 ${p.id === player.id ? 'bg-yellow-500/20 border border-yellow-400/50' : 'bg-white/5'}`}
                        >
                          <span className="text-lg">{getRankEmoji(idx + 1)}</span>
                          <CharacterSprite character={p.character as CharacterId} size={28} />
                          <span className="text-white text-sm font-medium">{p.nickname}</span>
                          <span className="ml-auto text-yellow-400 font-bold text-sm">{p.score}점</span>
                        </div>
                      ))}
                  </div>
                </div>

                <p className="text-teal-300 text-sm animate-pulse">선생님이 결과를 발표할 때까지 기다려주세요 🎉</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      )}
    </div>
  );
}

export default function StudentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-emerald-900 flex items-center justify-center text-white">로딩 중...</div>}>
      <StudentPageInner />
    </Suspense>
  );
}
