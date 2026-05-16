'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CharacterCard, CharacterSprite } from '@/components/characters/CharacterSprite';
import { ClimbRaceTrack } from '@/components/game/ClimbRaceTrack';
import { MathText } from '@/components/MathText';
import { GameSession, Player, Question, CharacterId } from '@/types/game';
import { QUESTION_TIME_LIMIT_SEC } from '@/lib/game/sessionAdvance';
import { getRankEmoji, cn } from '@/lib/utils';

const CHARACTERS: CharacterId[] = ['fox', 'cat', 'rabbit', 'bear', 'penguin', 'dog'];

/** 서버 세션 인덱스(0~)를 문제 배열 길이 안으로 맞춤 */
function clampSessionQuestionIndex(raw: unknown, questionCount: number): number {
  if (questionCount <= 0) return 0;
  const v = raw === undefined || raw === null ? 0 : Number(raw);
  const idx = Number.isFinite(v) ? v : 0;
  return Math.min(Math.max(0, idx), questionCount - 1);
}

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
  const [answerResult, setAnswerResult] = useState<'correct' | 'wrong' | 'timeout' | null>(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT_SEC);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shortAnswer, setShortAnswer] = useState('');
  const [scoreGained, setScoreGained] = useState(0);
  /** 채점 직후 문자열 피드백(API official_answer 포함) */
  const [feedbackDetail, setFeedbackDetail] = useState<{
    myAnswer: string;
    officialAnswer: string;
    scorePreview: number;
  } | null>(null);
  const submittingRef = useRef(false);
  /** 같은 문항+시작시각 재적용 방지, question_started_at만 바뀌면 다시 적용 */
  const lastAppliedSessionSyncKeyRef = useRef('');
  /** GET /pin 폴링 응답 순서 처리 */
  const pollGenRef = useRef(0);
  /** 문제 은행 fetch 완료 순서 처리 */
  const questionsLoadGenRef = useRef(0);

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
          if (updated.status === 'playing') {
            setStep((prev) => (prev === 'waiting' ? 'playing' : prev));
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
  }, [session, player, fetchPlayers]);

  /** 대기실 진입 시·주기적으로 참가자 목록 갱신 (실시간만으로는 첫 로드가 비는 경우 방지) */
  useEffect(() => {
    if (step !== 'waiting' || !session || !player) return;
    void fetchPlayers(session.id, session.pin);
    const id = setInterval(() => {
      void fetchPlayers(session.id, session.pin);
    }, 4000);
    return () => clearInterval(id);
  }, [step, session?.id, player?.id, session?.pin, fetchPlayers]);

  // GET으로 세션 권위 복구 (실시간 누락·지연 완화, 문항 불일치 방지)
  useEffect(() => {
    if (!session?.pin || (step !== 'waiting' && step !== 'playing')) return;

    let cancelled = false;
    const seqAtMount = ++pollGenRef.current;

    const poll = async () => {
      const seq = ++pollGenRef.current;
      try {
        const res = await fetch(`/api/game/${session.pin}`);
        if (!res.ok || cancelled) return;
        const body = (await res.json()) as GameSession;
        if (cancelled || seq !== pollGenRef.current) return;

        setSession(body);
        if (body.status === 'playing') {
          setStep((prev) => (prev === 'waiting' ? 'playing' : prev));
        }
        if (body.status === 'finished') {
          setStep('finished');
        }
      } catch {
        /* 네트워크 일시 실패 무시 */
      }
    };

    void poll();
    const id = setInterval(poll, 2500);
    return () => {
      cancelled = true;
      pollGenRef.current = seqAtMount + 1;
      clearInterval(id);
    };
  }, [step, session?.pin]);

  // 서버와 동일한 문항 인덱스로 문제·입력 초기화
  useEffect(() => {
    if (step !== 'playing' || !session || questions.length === 0) return;
    if (session.status === 'finished') {
      setStep('finished');
      return;
    }
    const idxSafe = clampSessionQuestionIndex(session.current_question_index, questions.length);
    const syncKey = `${session.id}|${idxSafe}|${session.question_started_at ?? ''}|${session.status}`;
    if (lastAppliedSessionSyncKeyRef.current === syncKey && currentQ != null) return;

    lastAppliedSessionSyncKeyRef.current = syncKey;
    setQIndex(idxSafe);
    setCurrentQ(questions[idxSafe]);
    setSelectedAnswer(null);
    setShortAnswer('');
    setAnswerResult(null);
    setFeedbackDetail(null);
    setScoreGained(0);
    if (session.question_started_at) {
      setQuestionStartTime(new Date(session.question_started_at).getTime());
    } else {
      setQuestionStartTime(Date.now());
    }
  }, [
    step,
    session?.id,
    session?.current_question_index,
    session?.question_started_at,
    session?.status,
    questions,
    currentQ,
  ]);

  const handleSubmitRef = useRef<((explicitAnswer?: string, fromTimer?: boolean) => Promise<void>) | null>(null);

  // 40초 제한 — 서버 question_started_at 기준 (없으면 questionStartTime 폴백)
  useEffect(() => {
    if (step !== 'playing' || answerResult !== null || !session) return;

    const tick = () => {
      const start = session.question_started_at
        ? new Date(session.question_started_at).getTime()
        : questionStartTime;
      const left = Math.ceil(QUESTION_TIME_LIMIT_SEC - (Date.now() - start) / 1000);
      setTimeLeft(Math.max(0, left));
      // 마감 제출은 선택 보기(short 입력값)까지 반영해서 정답이 덮여씌워지지 않도록 인자 없이 처리(fromTimer 참조)
      if (left <= 0 && !submittingRef.current) {
        void handleSubmitRef.current?.(undefined, true);
      }
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [step, session, session?.question_started_at, session?.current_question_index, answerResult, questionStartTime]);

  // 문제 은행 로드 후, 현재 문항 인덱스는 항상 GET /api 게임 세션(권위)으로 맞춤 — 오래된 session 클로저로 다른 문제가 나오는 버그 방지
  useEffect(() => {
    if (step !== 'playing' || !session?.pin || !session.id) return;
    if (questions.length > 0) return;

    let cancelled = false;
    const loadSeq = ++questionsLoadGenRef.current;

    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('session_questions')
        .select('question_data')
        .eq('session_id', session.id)
        .order('question_index', { ascending: true });
      if (cancelled || !data?.length) return;

      const qs = data.map((d) => JSON.parse(d.question_data as string) as Question);
      const res = await fetch(`/api/game/${session.pin}`);
      if (cancelled || loadSeq !== questionsLoadGenRef.current) return;

      const srv = (res.ok ? await res.json() : session) as GameSession;

      if (srv.status === 'finished') setStep('finished');

      const idxSafe = clampSessionQuestionIndex(srv.current_question_index, qs.length);
      const syncKey = `${srv.id}|${idxSafe}|${srv.question_started_at ?? ''}|${srv.status}`;
      lastAppliedSessionSyncKeyRef.current = syncKey;
      setSession(srv);
      setQuestions(qs);
      setQIndex(idxSafe);
      setCurrentQ(qs[idxSafe]);
      setSelectedAnswer(null);
      setShortAnswer('');
      setAnswerResult(null);
      setScoreGained(0);
      if (srv.question_started_at) {
        setQuestionStartTime(new Date(srv.question_started_at).getTime());
      } else {
        setQuestionStartTime(Date.now());
      }
    })();

    return () => {
      cancelled = true;
      questionsLoadGenRef.current++;
    };
  }, [step, session?.pin, session?.id, questions.length]);

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

  const handleSubmitAnswer = async (explicitAnswer?: string, fromTimer = false) => {
    if (!player || !currentQ || !session || answerResult !== null) return;
    if (submittingRef.current) return;

    submittingRef.current = true;
    try {
      const qIdxServer = session.current_question_index ?? qIndex;
      const startMs = session.question_started_at
        ? new Date(session.question_started_at).getTime()
        : questionStartTime;
      const timeTaken = Math.min(
        QUESTION_TIME_LIMIT_SEC,
        Math.max(0, (Date.now() - startMs) / 1000)
      );
      const finalAnswer =
        explicitAnswer !== undefined
          ? explicitAnswer
          : currentQ.type === 'short'
            ? shortAnswer
            : selectedAnswer ?? '';

      /** 타이머가 빈 채점일 때만 "시간 초과" 카피(선택/입력값이 반영된 마감 제출은 여기 포함 안 함) */
      const timerForcedEmptySubmit = fromTimer && finalAnswer.trim() === '';

      const res = await fetch(`/api/game/${session.pin}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: player.id,
          question_index: qIdxServer,
          answer: finalAnswer,
          time_taken: timeTaken,
          correct_answer: currentQ.answer,
          total_questions: session.question_count,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 409) {
        const sr = await fetch(`/api/game/${session.pin}`);
        if (sr.ok) setSession(await sr.json());
        return;
      }

      if (!res.ok) return;

      const advanced = data.session_advanced === true;
      if (advanced) {
        if (data.session && typeof data.session === 'object') {
          setSession(data.session as GameSession);
        } else {
          const sr = await fetch(`/api/game/${session.pin}`);
          if (sr.ok) setSession((await sr.json()) as GameSession);
        }
        setAnswerResult(null);
        setFeedbackDetail(null);
        void fetchPlayers(session.id, session.pin);
      } else {
        const isCorrect = data.is_correct === true;
        if (timerForcedEmptySubmit && !isCorrect) setAnswerResult('timeout');
        else setAnswerResult(isCorrect ? 'correct' : 'wrong');
        const official =
          typeof data.official_answer === 'string' && data.official_answer.trim() !== ''
            ? (data.official_answer as string)
            : currentQ.answer;
        setFeedbackDetail({
          myAnswer:
            typeof data.my_answer === 'string'
              ? (data.my_answer as string).trim()
              : finalAnswer.trim(),
          officialAnswer: official,
          scorePreview:
            typeof data.score_gained === 'number' ? (data.score_gained as number) : 0,
        });
      }
      if (data.player) setPlayer(data.player);
      if (typeof data.score_gained === 'number') setScoreGained(data.score_gained);
    } finally {
      submittingRef.current = false;
    }
  };

  handleSubmitRef.current = handleSubmitAnswer;

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
              <span>문제 {(session.current_question_index ?? qIndex) + 1} / {session.question_count}</span>
              <span className="text-white/50">|</span>
              <span>{player.nickname}</span>
              <span className="text-amber-200">{player.score}점</span>
            </div>
            <div className="flex-1 overflow-y-auto bg-[#EDE7F6] p-3 sm:p-5">
              <motion.div
                key={session.current_question_index ?? qIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'mx-auto max-w-xl rounded-2xl border-2 bg-white p-5 shadow-lg',
                  answerResult === 'correct' && 'border-emerald-500 ring-2 ring-emerald-200',
                  (answerResult === 'wrong' || answerResult === 'timeout') && 'border-amber-400 ring-2 ring-amber-100',
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

                <MathText className="mb-4 block text-base font-bold leading-relaxed text-slate-900" as="div">
                  {currentQ.text}
                </MathText>

                <AnimatePresence>
                  {answerResult && (
                    <motion.div
                      initial={{ scale: 0.96, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={cn(
                        'mb-3 space-y-2 rounded-xl px-3 py-3 text-left',
                        answerResult === 'correct' && 'bg-emerald-100 text-emerald-900 ring-2 ring-emerald-200',
                        answerResult === 'wrong' && 'bg-red-50 text-red-950 ring-2 ring-red-200',
                        answerResult === 'timeout' && 'bg-amber-100 text-amber-950 ring-2 ring-amber-200'
                      )}
                    >
                      <div
                        className={cn(
                          'text-center text-base font-black',
                          answerResult === 'correct' && 'text-emerald-900',
                          answerResult === 'wrong' && 'text-red-900',
                          answerResult === 'timeout' && 'text-amber-950'
                        )}
                      >
                        {answerResult === 'correct'
                          ? '정답이에요'
                          : answerResult === 'timeout'
                            ? '시간 초과 — 오답 처리'
                            : '오답이에요'}
                      </div>
                      {(answerResult === 'wrong' ||
                        answerResult === 'timeout') &&
                        feedbackDetail && (
                        <div className="rounded-lg border border-black/10 bg-white/75 px-2.5 py-2 text-sm">
                          <div className="mb-1 flex flex-wrap items-baseline gap-1 font-bold text-slate-800">
                            <span className="text-slate-600">내가 제출한 답</span>
                            <MathText as="span" className="inline font-black text-violet-900">
                              {answerResult === 'timeout' &&
                              !(feedbackDetail.myAnswer && feedbackDetail.myAnswer.trim())
                                ? '(미제출)'
                                : feedbackDetail.myAnswer || '—'}
                            </MathText>
                          </div>
                          <div className="flex flex-wrap items-baseline gap-1 font-bold">
                            <span className="text-emerald-800">모범 정답</span>
                            <MathText as="span" className="inline font-black text-emerald-950">
                              {feedbackDetail.officialAnswer}
                            </MathText>
                          </div>
                        </div>
                      )}
                      {answerResult === 'correct' && (
                        <>
                          <p className="text-center text-[13px] font-bold leading-snug text-emerald-900">
                            채점 획득 예정 보너스{' '}
                            <span className="font-black">+{scoreGained}</span>
                            점 (모두가 이 문제를 제출하면 점수·레이스에 반영돼요)
                          </p>
                          {(feedbackDetail?.myAnswer?.trim()?.length ?? 0) > 0 && feedbackDetail ? (
                            <p className="text-center text-xs font-semibold text-emerald-800/95">
                              제출 내용{' '}
                              <MathText as="span" className="inline font-black">
                                {feedbackDetail.myAnswer}
                              </MathText>
                            </p>
                          ) : null}
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {answerResult !== null && (
                  <p className="mb-3 text-center text-xs font-semibold text-violet-800">
                    이 문제에서는 정답을 맞춰도 캐릭터는 움직이지 않아요. 모두 제출해야 한 번에 레이스가
                    업데이트되고 다음 문제로 넘어가요.
                  </p>
                )}

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
                            selectedAnswer !== null &&
                            opt === selectedAnswer &&
                            opt !== currentQ.answer &&
                            'border-red-400 bg-red-50 text-red-900',
                          answerResult === null && selectedAnswer === opt && 'border-amber-400 bg-amber-50',
                          answerResult === null && selectedAnswer !== opt && 'border-slate-200 bg-slate-50 hover:border-violet-300 hover:bg-violet-50/50'
                        )}
                      >
                        <span className="mr-2 font-black text-violet-600">{['①', '②', '③', '④'][i]}</span>
                        <MathText as="span">{opt}</MathText>
                      </motion.button>
                    ))}
                  </div>
                )}

                {currentQ.type === 'short' && (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="-?[0-9]*"
                      placeholder="정수만 입력"
                      value={shortAnswer}
                      onChange={(e) => setShortAnswer(e.target.value.replace(/[^0-9-]/g, '').slice(0, 8))}
                      onKeyDown={(e) => e.key === 'Enter' && answerResult === null && handleSubmitAnswer()}
                      disabled={answerResult !== null}
                      className="flex-1 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-center font-bold text-slate-900 focus:border-violet-500 focus:outline-none"
                    />
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => answerResult === null && handleSubmitAnswer()}
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
