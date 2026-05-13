import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function calculatePosition(correctCount: number, totalQuestions: number, speed?: number): number {
  const basePosition = (correctCount / totalQuestions) * 100;
  const speedBonus = speed ? Math.max(0, (10 - speed) / 10) * 2 : 0;
  return Math.min(100, basePosition + speedBonus);
}

export function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}초`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}분 ${s}초`;
}

export function getRankEmoji(rank: number): string {
  const emojis = ['🥇', '🥈', '🥉'];
  return emojis[rank - 1] || `${rank}위`;
}
