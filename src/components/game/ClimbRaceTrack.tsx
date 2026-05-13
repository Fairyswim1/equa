'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { MapId } from '@/types/game';
import type { Player } from '@/types/game';
import { CharacterSprite } from '@/components/characters/CharacterSprite';
import type { CharacterId } from '@/types/game';
import { CLIMB_TRACK_POINTS, getPointOnPolyline, trackPathD } from '@/lib/climbPath';
import { cn } from '@/lib/utils';

type Theme = {
  sky0: string;
  sky1: string;
  slope0: string;
  slope1: string;
  trailFill: string;
  trailStroke: string;
};

const THEMES: Record<MapId, Theme> = {
  forest: {
    sky0: '#7EC8E3',
    sky1: '#BFE9FF',
    slope0: '#4CAF50',
    slope1: '#2E7D32',
    trailFill: '#FFB74D',
    trailStroke: '#E65100',
  },
  ocean: {
    sky0: '#0D47A1',
    sky1: '#42A5F5',
    slope0: '#1565C0',
    slope1: '#0277BD',
    trailFill: '#B3E5FC',
    trailStroke: '#01579B',
  },
  space: {
    sky0: '#1A0A2E',
    sky1: '#4A148C',
    slope0: '#5E35B1',
    slope1: '#311B92',
    trailFill: '#CE93D8',
    trailStroke: '#6A1B9A',
  },
  sky: {
    sky0: '#64B5F6',
    sky1: '#E1F5FE',
    slope0: '#81C784',
    slope1: '#43A047',
    trailFill: '#FFF59D',
    trailStroke: '#F9A825',
  },
  volcano: {
    sky0: '#5D4037',
    sky1: '#FF7043',
    slope0: '#6D4C41',
    slope1: '#3E2723',
    trailFill: '#FFAB91',
    trailStroke: '#BF360C',
  },
};

function MapScenery({ mapId, theme }: { mapId: MapId; theme: Theme }) {
  switch (mapId) {
    case 'forest':
      return (
        <g opacity={0.95}>
          <polygon points="0,55 18,38 35,52 52,35 70,48 88,30 100,40 100,100 0,100" fill={theme.slope1} />
          {[12, 28, 48, 68, 86].map((x, i) => (
            <g key={i} transform={`translate(${x}, ${58 + (i % 2) * 8})`}>
              <polygon points="0,0 -6,18 7,18" fill="#1B5E20" stroke="#0D3B12" strokeWidth="0.4" />
              <polygon points="0,-6 -4,12 5,12" fill="#2E7D32" stroke="#0D3B12" strokeWidth="0.3" />
            </g>
          ))}
          <ellipse cx="22" cy="16" rx="10" ry="6" fill="white" opacity={0.85} />
          <ellipse cx="58" cy="12" rx="12" ry="7" fill="white" opacity={0.75} />
        </g>
      );
    case 'ocean':
      return (
        <g opacity={0.95}>
          <polygon points="0,60 25,42 45,55 65,38 100,50 100,100 0,100" fill="#0D47A1" opacity={0.6} />
          {[15, 38, 62, 82].map((x, i) => (
            <ellipse key={i} cx={x} cy={72 + i * 3} rx="4" ry="6" fill="#AB47BC" opacity={0.8} />
          ))}
          {[20, 50, 78].map((x, i) => (
            <ellipse key={i} cx={x} cy={48 + i * 5} rx="3" ry="2" fill="#4FC3F7" opacity={0.5} />
          ))}
        </g>
      );
    case 'space':
      return (
        <g>
          {Array.from({ length: 28 }).map((_, i) => (
            <circle
              key={i}
              cx={(i * 17) % 100}
              cy={(i * 23 + 11) % 85}
              r={0.25 + (i % 3) * 0.2}
              fill="white"
              opacity={0.5 + (i % 5) * 0.1}
            />
          ))}
          <polygon points="0,50 30,38 55,52 80,36 100,48 100,100 0,100" fill="#311B92" opacity={0.45} />
        </g>
      );
    case 'sky':
      return (
        <g opacity={0.9}>
          <ellipse cx="25" cy="18" rx="14" ry="8" fill="white" opacity={0.9} />
          <ellipse cx="70" cy="14" rx="18" ry="9" fill="white" opacity={0.85} />
          <polygon points="0,58 22,44 40,56 60,40 100,52 100,100 0,100" fill={theme.slope1} />
        </g>
      );
    case 'volcano':
      return (
        <g opacity={0.95}>
          <polygon points="45,8 55,8 52,22 48,22" fill="#5D4037" />
          <polygon points="0,52 35,40 50,55 75,38 100,50 100,100 0,100" fill={theme.slope1} />
          {[18, 40, 72].map((x, i) => (
            <circle key={i} cx={x} cy={78 + i} r="2.5" fill="#FF5722" opacity={0.7} />
          ))}
        </g>
      );
    default:
      return null;
  }
}

export interface ClimbRaceTrackProps {
  mapId: MapId;
  players: Player[];
  emphasizePlayerId?: string;
  timerSeconds?: number | null;
  className?: string;
  /** 프로필 말고 트랙만 (교사용 축소) */
  compact?: boolean;
}

function ClimbRaceTrackInner({
  mapId,
  players,
  emphasizePlayerId,
  timerSeconds,
  className,
  compact,
}: ClimbRaceTrackProps) {
  const theme = THEMES[mapId] ?? THEMES.forest;
  const pathD = trackPathD(CLIMB_TRACK_POINTS);
  const stable = [...players].sort((a, b) => a.id.localeCompare(b.id));

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-2xl border-4 border-[#4a3728] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.15)]',
        compact ? 'min-h-[220px]' : 'min-h-[min(100vh,520px)] lg:min-h-screen lg:h-screen',
        className
      )}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <linearGradient id={`sky-${mapId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={theme.sky0} />
            <stop offset="100%" stopColor={theme.sky1} />
          </linearGradient>
          <linearGradient id={`slope-${mapId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.slope0} />
            <stop offset="100%" stopColor={theme.slope1} />
          </linearGradient>
          <filter id="trailShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0.8" stdDeviation="0.6" floodOpacity="0.35" />
          </filter>
        </defs>
        <rect width="100" height="100" fill={`url(#sky-${mapId})`} />
        <polygon points="0,45 100,35 100,100 0,100" fill={`url(#slope-${mapId})`} opacity={0.85} />
        <MapScenery mapId={mapId} theme={theme} />
        <path
          d={pathD}
          fill="none"
          stroke={theme.trailStroke}
          strokeWidth="4.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.55}
          filter="url(#trailShadow)"
        />
        <path
          d={pathD}
          fill="none"
          stroke={theme.trailFill}
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <g transform="translate(72, 5)">
          <rect x="-4" y="-10" width="8" height="14" rx="1" fill="#FF6F00" stroke="#4a3728" strokeWidth="0.6" />
          <polygon points="0,-12 -5,-6 5,-6" fill="#FFD54F" stroke="#4a3728" strokeWidth="0.5" />
          <circle cx="0" cy="2" r="1.6" fill="#FFEB3B" stroke="#4a3728" strokeWidth="0.3" />
        </g>
      </svg>

      {timerSeconds != null && (
        <div className="pointer-events-none absolute right-[8%] top-[8%] z-20 flex h-14 w-14 items-center justify-center rounded-full bg-[#FF6F00] text-xl font-black text-white shadow-lg ring-4 ring-white/40">
          {timerSeconds}
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 z-10">
        {stable.map((p, idx) => {
          const t = Math.min(1, Math.max(0, (p.position ?? 0) / 100));
          const base = getPointOnPolyline(CLIMB_TRACK_POINTS, t);
          const lane = idx - (stable.length - 1) / 2;
          const px = Math.min(94, Math.max(6, base.x + lane * 3.5));
          const py = Math.min(94, Math.max(6, base.y + Math.abs(lane) * 1.2));
          const isMe = emphasizePlayerId && p.id === emphasizePlayerId;
          const size = compact ? 36 : isMe ? 52 : 40;
          return (
            <motion.div
              key={p.id}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              initial={false}
              animate={{ left: `${px}%`, top: `${py}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            >
              <div
                className={cn(
                  'mb-0.5 max-w-[72px] truncate rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold shadow',
                  isMe
                    ? 'bg-amber-300 text-amber-950 ring-2 ring-amber-500'
                    : 'bg-white/90 text-gray-800'
                )}
              >
                {p.nickname}
              </div>
              <div
                className={cn(
                  'drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)]',
                  isMe && 'scale-110'
                )}
              >
                <CharacterSprite
                  character={p.character as CharacterId}
                  size={size}
                  running
                  variant="mascot"
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="pointer-events-none absolute bottom-2 left-2 right-2 z-20 rounded-lg bg-black/25 px-2 py-1 text-center text-[10px] font-medium text-white backdrop-blur-sm">
        정답일수록 코스를 더 빨리 올라가요
      </div>
    </div>
  );
}

export const ClimbRaceTrack = memo(ClimbRaceTrackInner);
