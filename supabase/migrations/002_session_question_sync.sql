-- 전역 문항 동기화: 모든 학생이 같은 문제에 머무름, 전원 응답(또는 교사 강제) 후 다음 문항
ALTER TABLE game_sessions
  ADD COLUMN IF NOT EXISTS current_question_index INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS question_started_at TIMESTAMPTZ;

COMMENT ON COLUMN game_sessions.current_question_index IS '현재 풀고 있는 문제 인덱스 (0부터)';
COMMENT ON COLUMN game_sessions.question_started_at IS '현재 문항 시작 시각 (타이머 동기화)';
