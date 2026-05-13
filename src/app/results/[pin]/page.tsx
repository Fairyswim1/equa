'use client';

import { useState, useEffect, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { CharacterSprite } from '@/components/characters/CharacterSprite';
import { Player, PlayerAnswer, CharacterId, Question } from '@/types/game';
import * as XLSX from 'xlsx';

interface ResultData {
  session: { pin: string; map_type: string; question_count: number; teacher_name: string };
  players: Player[];
  answers: PlayerAnswer[];
  questions: Array<{ question_index: number; question_data: string }>;
}

function Confetti() {
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-sm"
          style={{
            background: colors[i % colors.length],
            left: `${Math.random() * 100}%`,
            top: -20,
          }}
          animate={{
            y: ['0vh', '110vh'],
            rotate: [0, 720 * (Math.random() > 0.5 ? 1 : -1)],
            x: [0, (Math.random() - 0.5) * 200],
          }}
          transition={{
            duration: 2 + Math.random() * 3,
            delay: Math.random() * 2,
            repeat: 2,
            ease: 'easeIn',
          }}
        />
      ))}
    </div>
  );
}

function PodiumStage({ rank, player }: { rank: 1 | 2 | 3; player: Player | undefined }) {
  const heights = { 1: 'h-32', 2: 'h-24', 3: 'h-16' };
  const colors = {
    1: 'bg-gradient-to-t from-yellow-600 to-yellow-400',
    2: 'bg-gradient-to-t from-gray-500 to-gray-300',
    3: 'bg-gradient-to-t from-orange-700 to-orange-500',
  };
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const delays = { 1: 0.3, 2: 0.5, 3: 0.7 };

  if (!player) return (
    <div className="flex flex-col items-center">
      <div className={`${colors[rank]} ${heights[rank]} w-24 rounded-t-xl opacity-30`} />
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delays[rank], type: 'spring', bounce: 0.4 }}
      className="flex flex-col items-center"
    >
      {/* Player above podium */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 1.5, delay: delays[rank] }}
        className="mb-2 flex flex-col items-center"
      >
        <span className="text-3xl mb-1">{medals[rank]}</span>
        <CharacterSprite character={player.character as CharacterId} size={rank === 1 ? 72 : 56} />
        <p className="text-white font-bold text-sm mt-1 text-center px-1">{player.nickname}</p>
        <p className="text-yellow-400 font-black text-lg">{player.score}점</p>
      </motion.div>
      {/* Stage */}
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: delays[rank] + 0.2, duration: 0.5 }}
        style={{ transformOrigin: 'bottom' }}
        className={`${colors[rank]} ${heights[rank]} w-28 rounded-t-xl flex items-start justify-center pt-2`}
      >
        <span className="text-white font-black text-2xl">{rank}</span>
      </motion.div>
    </motion.div>
  );
}

export default function ResultsPage({ params }: { params: Promise<{ pin: string }> }) {
  const router = useRouter();
  const { pin } = use(params);
  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'podium' | 'ranking' | 'stats'>('podium');
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await fetch(`/api/game/${pin}/finish`);
        if (res.ok) {
          const d = await res.json();
          setData(d);
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 6000);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [pin]);

  const sortedPlayers = data
    ? [...data.players].sort((a, b) => b.score - a.score)
    : [];

  const parsedQuestions: Question[] = data
    ? data.questions.map(q => JSON.parse(q.question_data) as Question)
    : [];

  const getPlayerAnswers = (playerId: string) =>
    data?.answers.filter(a => a.player_id === playerId) ?? [];

  const getCorrectCount = (playerId: string) =>
    getPlayerAnswers(playerId).filter(a => a.is_correct).length;

  const getWrongCount = (playerId: string) =>
    getPlayerAnswers(playerId).filter(a => !a.is_correct).length;

  const getAvgTime = (playerId: string) => {
    const ans = getPlayerAnswers(playerId);
    if (!ans.length) return 0;
    return Math.round(ans.reduce((s, a) => s + a.time_taken, 0) / ans.length * 10) / 10;
  };

  const getWrongQuestions = (playerId: string) => {
    return getPlayerAnswers(playerId)
      .filter(a => !a.is_correct)
      .map(a => ({
        answer: a,
        question: parsedQuestions[a.question_index],
      }))
      .filter(x => x.question);
  };

  const downloadExcel = () => {
    if (!data) return;

    // 전체 순위 시트
    const rankingSheet = sortedPlayers.map((p, idx) => ({
      순위: idx + 1,
      닉네임: p.nickname,
      캐릭터: p.character,
      점수: p.score,
      정답수: getCorrectCount(p.id),
      오답수: getWrongCount(p.id),
      평균풀이시간: `${getAvgTime(p.id)}초`,
      완주여부: p.is_finished ? '완주' : '미완주',
    }));

    // 문제별 통계 시트
    const questionStats = parsedQuestions.map((q, idx) => {
      const allAnswers = (data?.answers ?? []).filter(a => a.question_index === idx);
      const correct = allAnswers.filter(a => a.is_correct).length;
      return {
        문제번호: idx + 1,
        카테고리: q.category === 'complex' ? '복소수' : q.category === 'quadratic' ? '이차방정식' : '개념',
        문제유형: q.type === 'multiple' ? '객관식' : '주관식',
        난이도: '⭐'.repeat(q.difficulty),
        문제내용: q.text,
        정답: q.answer,
        정답자수: correct,
        응시자수: allAnswers.length,
        정답률: allAnswers.length ? `${Math.round(correct / allAnswers.length * 100)}%` : '-',
      };
    });

    // 학생별 답안 시트
    const studentAnswers = sortedPlayers.flatMap((p) =>
      getPlayerAnswers(p.id).map(a => ({
        닉네임: p.nickname,
        문제번호: a.question_index + 1,
        제출답안: a.answer_given,
        정답여부: a.is_correct ? '정답' : '오답',
        풀이시간: `${a.time_taken.toFixed(1)}초`,
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rankingSheet), '전체순위');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(questionStats), '문제별통계');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(studentAnswers), '학생별답안');

    XLSX.writeFile(wb, `수학레이스_${pin}_결과.xlsx`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-violet-950 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
          <span className="text-6xl">⏳</span>
        </motion.div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-violet-950 flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-2xl mb-4">결과를 불러올 수 없습니다.</p>
          <button onClick={() => router.push('/')} className="text-purple-300 hover:text-white">← 홈으로</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-violet-950">
      {showConfetti && <Confetti />}

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-black text-yellow-400 mb-2">🏆 최종 결과</h1>
          <p className="text-purple-300">PIN: {pin} | {data.session.question_count}문제</p>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 bg-white/5 rounded-2xl p-1.5">
          {(['podium', 'ranking', 'stats'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                tab === t ? 'bg-yellow-400 text-yellow-900' : 'text-white/60 hover:text-white'
              }`}
            >
              {t === 'podium' ? '🥇 시상식' : t === 'ranking' ? '📊 전체순위' : '📈 문제통계'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* PODIUM */}
          {tab === 'podium' && (
            <motion.div key="podium" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="flex items-end justify-center gap-4 mb-10 pt-6">
                <PodiumStage rank={2} player={sortedPlayers[1]} />
                <PodiumStage rank={1} player={sortedPlayers[0]} />
                <PodiumStage rank={3} player={sortedPlayers[2]} />
              </div>

              {/* 나머지 순위 */}
              {sortedPlayers.length > 3 && (
                <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20">
                  <h3 className="text-white font-bold mb-3 text-sm">나머지 순위</h3>
                  <div className="space-y-2">
                    {sortedPlayers.slice(3).map((p, i) => (
                      <div key={p.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-2">
                        <span className="text-white/60 font-bold w-6 text-center">{i + 4}</span>
                        <CharacterSprite character={p.character as CharacterId} size={28} />
                        <span className="text-white text-sm">{p.nickname}</span>
                        <span className="ml-auto text-yellow-400 font-bold">{p.score}점</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* RANKING TABLE */}
          {tab === 'ranking' && (
            <motion.div key="ranking" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="bg-white/10 backdrop-blur rounded-2xl border border-white/20 overflow-hidden mb-4">
                <table className="w-full">
                  <thead className="bg-white/10">
                    <tr className="text-purple-300 text-xs">
                      <th className="p-3 text-left">순위</th>
                      <th className="p-3 text-left">학생</th>
                      <th className="p-3 text-center">점수</th>
                      <th className="p-3 text-center">정답</th>
                      <th className="p-3 text-center">오답</th>
                      <th className="p-3 text-center">평균시간</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPlayers.map((p, idx) => (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`border-t border-white/10 ${idx < 3 ? 'bg-yellow-500/5' : ''}`}
                      >
                        <td className="p-3">
                          <span className="text-xl">{idx < 3 ? ['🥇', '🥈', '🥉'][idx] : `${idx + 1}위`}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <CharacterSprite character={p.character as CharacterId} size={28} />
                            <span className="text-white font-medium text-sm">{p.nickname}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center text-yellow-400 font-bold">{p.score}</td>
                        <td className="p-3 text-center text-green-400 font-bold">{getCorrectCount(p.id)}</td>
                        <td className="p-3 text-center text-red-400 font-bold">{getWrongCount(p.id)}</td>
                        <td className="p-3 text-center text-purple-300 text-sm">{getAvgTime(p.id)}초</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 개별 틀린 문제 */}
              <div className="space-y-3">
                <h3 className="text-white font-bold">📝 학생별 오답 현황</h3>
                {sortedPlayers.map((p) => {
                  const wrongQs = getWrongQuestions(p.id);
                  if (!wrongQs.length) return null;
                  return (
                    <details key={p.id} className="bg-white/10 backdrop-blur rounded-xl border border-white/20">
                      <summary className="p-4 cursor-pointer flex items-center gap-2">
                        <CharacterSprite character={p.character as CharacterId} size={24} />
                        <span className="text-white font-medium">{p.nickname}</span>
                        <span className="ml-auto text-red-400 text-sm">{wrongQs.length}개 오답</span>
                      </summary>
                      <div className="px-4 pb-4 space-y-2">
                        {wrongQs.map(({ answer: a, question: q }) => (
                          <div key={a.id} className="bg-red-500/10 rounded-xl p-3 text-sm">
                            <p className="text-white/80 mb-1">Q. {q.text}</p>
                            <p className="text-red-300">제출: {a.answer_given || '(미제출)'}</p>
                            <p className="text-green-300">정답: {q.answer}</p>
                          </div>
                        ))}
                      </div>
                    </details>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STATS */}
          {tab === 'stats' && (
            <motion.div key="stats" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="space-y-3">
                {parsedQuestions.map((q, idx) => {
                  const allAns = (data?.answers ?? []).filter(a => a.question_index === idx);
                  const correct = allAns.filter(a => a.is_correct).length;
                  const rate = allAns.length ? Math.round(correct / allAns.length * 100) : 0;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-purple-300 font-bold text-sm w-6">{idx + 1}</span>
                        <div className="flex-1">
                          <p className="text-white text-sm mb-2">{q.text}</p>
                          <div className="flex items-center gap-3 text-xs">
                            <span className={`px-2 py-0.5 rounded-full ${
                              q.category === 'complex' ? 'bg-purple-500/30 text-purple-300' :
                              q.category === 'quadratic' ? 'bg-blue-500/30 text-blue-300' :
                              'bg-yellow-500/30 text-yellow-300'
                            }`}>
                              {q.category === 'complex' ? '복소수' : q.category === 'quadratic' ? '이차방정식' : '개념'}
                            </span>
                            <span className="text-purple-300">정답: {q.answer}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-black text-xl ${rate >= 70 ? 'text-green-400' : rate >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {rate}%
                          </p>
                          <p className="text-purple-300 text-xs">{correct}/{allAns.length}명</p>
                        </div>
                      </div>
                      <div className="mt-2 w-full bg-white/10 rounded-full h-2">
                        <div
                          className={`h-full rounded-full transition-all ${rate >= 70 ? 'bg-green-400' : rate >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`}
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={downloadExcel}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl text-white font-bold flex items-center gap-2 shadow-xl"
          >
            <span>📥</span> 엑셀 다운로드
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/teacher')}
            className="px-6 py-3 bg-white/10 backdrop-blur rounded-2xl text-white font-bold border border-white/20"
          >
            🆕 새 게임 만들기
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-white/10 backdrop-blur rounded-2xl text-white font-bold border border-white/20"
          >
            🏠 홈으로
          </motion.button>
        </div>
      </div>
    </div>
  );
}
