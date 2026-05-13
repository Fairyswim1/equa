export type CharacterId = 'fox' | 'cat' | 'rabbit' | 'bear' | 'penguin' | 'dog';
export type MapId = 'forest' | 'ocean' | 'space' | 'sky' | 'volcano';
export type GameStatus = 'waiting' | 'selecting' | 'playing' | 'finished';
export type QuestionType = 'multiple' | 'short';

export interface GameSession {
  id: string;
  pin: string;
  map_type: MapId;
  question_count: number;
  status: GameStatus;
  created_at: string;
  teacher_name?: string;
  /** DB 마이그레이션 002 이후: 전역 문항 인덱스(0~) */
  current_question_index?: number;
  question_started_at?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
}

export interface Player {
  id: string;
  session_id: string;
  nickname: string;
  character: CharacterId;
  score: number;
  position: number; // 0 ~ 100
  current_question_index: number;
  correct_count: number;
  is_finished: boolean;
  finish_time?: string;
  created_at: string;
}

export interface PlayerAnswer {
  id: string;
  player_id: string;
  session_id: string;
  question_index: number;
  is_correct: boolean;
  time_taken: number;
  answer_given: string;
  created_at: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  category: 'complex' | 'quadratic' | 'concept';
  difficulty: 1 | 2 | 3;
  text: string;
  options?: string[];
  answer: string;
  explanation?: string;
  latex?: boolean;
}

export interface GameState {
  session: GameSession;
  players: Player[];
  currentQuestion?: Question;
  questionStartTime?: number;
}

export interface PlayerStats {
  player: Player;
  answers: PlayerAnswer[];
  correctCount: number;
  wrongCount: number;
  avgTime: number;
  rank: number;
}

export interface RealtimePayload {
  type: 'player_joined' | 'player_updated' | 'game_started' | 'game_finished' | 'answer_submitted' | 'question_changed';
  data: unknown;
}
