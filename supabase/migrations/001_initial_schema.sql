-- 수학 레이스 게임 데이터베이스 스키마
-- Supabase SQL Editor에서 실행하세요

-- ============================================
-- 1. 게임 세션 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin VARCHAR(6) UNIQUE NOT NULL,
  map_type VARCHAR(20) NOT NULL DEFAULT 'forest',
  question_count INT NOT NULL DEFAULT 10,
  status VARCHAR(20) NOT NULL DEFAULT 'waiting',
  teacher_name VARCHAR(50),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. 플레이어 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE NOT NULL,
  nickname VARCHAR(20) NOT NULL,
  character VARCHAR(20) NOT NULL DEFAULT 'fox',
  score INT DEFAULT 0,
  position FLOAT DEFAULT 0,
  current_question_index INT DEFAULT 0,
  correct_count INT DEFAULT 0,
  is_finished BOOLEAN DEFAULT FALSE,
  finish_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. 세션 문제 테이블 (게임별 문제 저장)
-- ============================================
CREATE TABLE IF NOT EXISTS session_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE NOT NULL,
  question_index INT NOT NULL,
  question_data TEXT NOT NULL, -- JSON string
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, question_index)
);

-- ============================================
-- 4. 플레이어 답변 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS player_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE NOT NULL,
  question_index INT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  time_taken FLOAT NOT NULL DEFAULT 0,
  answer_given TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 인덱스
-- ============================================
CREATE INDEX IF NOT EXISTS idx_players_session ON players(session_id);
CREATE INDEX IF NOT EXISTS idx_answers_player ON player_answers(player_id);
CREATE INDEX IF NOT EXISTS idx_answers_session ON player_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_questions_session ON session_questions(session_id);

-- ============================================
-- RLS (Row Level Security) - 공개 접근 허용
-- ============================================
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_answers ENABLE ROW LEVEL SECURITY;

-- 모든 사용자 읽기/쓰기 허용 (게임 특성상)
CREATE POLICY "Allow all" ON game_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON session_questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON player_answers FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Realtime 활성화
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE player_answers;
