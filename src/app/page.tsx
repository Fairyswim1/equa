'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { CharacterSprite } from '@/components/characters/CharacterSprite';
import { CharacterId } from '@/types/game';

const FLOATING_CHARS: CharacterId[] = ['fox', 'cat', 'rabbit', 'bear', 'penguin', 'dog'];

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<'home' | 'student' | 'teacher'>('home');
  const [pin, setPin] = useState('');
  const [teacherPin, setTeacherPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStudentJoin = async () => {
    if (pin.length !== 6) {
      setError('PIN 번호는 6자리여야 합니다.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/game/${pin}`);
      if (!res.ok) {
        setError('존재하지 않는 게임 PIN입니다.');
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.status === 'finished') {
        setError('이미 종료된 게임입니다.');
        setLoading(false);
        return;
      }
      if (data.status === 'playing') {
        setError('이미 시작된 게임입니다. 다음 게임을 기다려주세요.');
        setLoading(false);
        return;
      }
      router.push(`/student?pin=${pin}`);
    } catch {
      setError('서버 연결에 실패했습니다.');
      setLoading(false);
    }
  };

  const handleTeacherAccess = async () => {
    if (!teacherPin) {
      router.push('/teacher');
      return;
    }
    router.push(`/teacher?pin=${teacherPin}`);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900">
      {/* Animated background stars */}
      <div className="absolute inset-0">
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 4 + 1,
              height: Math.random() * 4 + 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: Math.random() * 3 + 2, repeat: Infinity, delay: Math.random() * 3 }}
          />
        ))}
      </div>

      {/* Floating characters */}
      <div className="absolute inset-0 pointer-events-none">
        {FLOATING_CHARS.map((char, i) => (
          <motion.div
            key={char}
            className="absolute opacity-60"
            style={{ left: `${(i * 17 + 5) % 90}%`, top: `${(i * 23 + 10) % 80}%` }}
            animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.8 }}
          >
            <CharacterSprite character={char} size={50} />
          </motion.div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Title */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, type: 'spring' }}
          className="text-center mb-10"
        >
          <h1 className="text-6xl font-black text-white mb-3 drop-shadow-2xl">
            수학 레이스
            <span className="ml-3">🏃</span>
          </h1>
          <p className="text-xl text-purple-200 font-medium">
            복소수와 이차방정식을 풀고 결승선으로 달려라!
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {mode === 'home' && (
            <motion.div
              key="home"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMode('student')}
                className="px-10 py-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl text-white font-black text-2xl shadow-2xl shadow-emerald-500/30 flex flex-col items-center gap-2"
              >
                <span className="text-4xl">🎮</span>
                학생으로 참여
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMode('teacher')}
                className="px-10 py-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl text-white font-black text-2xl shadow-2xl shadow-amber-500/30 flex flex-col items-center gap-2"
              >
                <span className="text-4xl">👩‍🏫</span>
                선생님 입장
              </motion.button>
            </motion.div>
          )}

          {mode === 'student' && (
            <motion.div
              key="student"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              className="bg-white/10 backdrop-blur-md rounded-3xl p-8 w-full max-w-sm border border-white/20"
            >
              <h2 className="text-2xl font-black text-white text-center mb-6">
                🎮 게임 참여
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-purple-200 text-sm font-medium mb-1 block">게임 PIN 번호</label>
                  <input
                    type="text"
                    placeholder="6자리 숫자 입력"
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setError('');
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleStudentJoin()}
                    className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-purple-300 border border-white/30 focus:outline-none focus:border-yellow-400 text-center text-2xl font-bold tracking-widest"
                    maxLength={6}
                  />
                </div>
                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-300 text-sm text-center"
                  >
                    ⚠️ {error}
                  </motion.p>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStudentJoin}
                  disabled={loading || pin.length !== 6}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 rounded-xl text-white font-bold text-lg transition-colors"
                >
                  {loading ? '확인 중...' : '🚀 입장하기'}
                </motion.button>
                <button
                  onClick={() => { setMode('home'); setPin(''); setError(''); }}
                  className="w-full text-purple-300 hover:text-white text-sm transition-colors"
                >
                  ← 돌아가기
                </button>
              </div>
            </motion.div>
          )}

          {mode === 'teacher' && (
            <motion.div
              key="teacher"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              className="bg-white/10 backdrop-blur-md rounded-3xl p-8 w-full max-w-sm border border-white/20"
            >
              <h2 className="text-2xl font-black text-white text-center mb-6">
                👩‍🏫 선생님 입장
              </h2>
              <div className="space-y-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/teacher')}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white font-bold text-lg"
                >
                  🆕 새 게임 만들기
                </motion.button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20"></div>
                  </div>
                  <div className="relative text-center text-white/60 text-sm">또는</div>
                </div>
                <div>
                  <label className="text-purple-200 text-sm font-medium mb-1 block">기존 게임 PIN으로 접속</label>
                  <input
                    type="text"
                    placeholder="기존 PIN 번호"
                    value={teacherPin}
                    onChange={(e) => setTeacherPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-purple-300 border border-white/30 focus:outline-none focus:border-yellow-400 text-center text-xl font-bold tracking-widest"
                    maxLength={6}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleTeacherAccess}
                  disabled={!teacherPin || teacherPin.length !== 6}
                  className="w-full py-3 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 rounded-xl text-white font-bold text-lg transition-colors"
                >
                  📊 대시보드 접속
                </motion.button>
                <button
                  onClick={() => { setMode('home'); setTeacherPin(''); }}
                  className="w-full text-purple-300 hover:text-white text-sm transition-colors"
                >
                  ← 돌아가기
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-6 text-purple-300 text-sm"
        >
          고1 수학 | 복소수와 이차방정식 🔢
        </motion.p>
      </div>
    </div>
  );
}
