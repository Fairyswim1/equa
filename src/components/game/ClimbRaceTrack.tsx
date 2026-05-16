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
  sky2: string;
  slope0: string;
  slope1: string;
  slope2: string;
  trailFill: string;
  trailStroke: string;
  trailGlow: string;
  accent: string;
  frame: string;
};

const THEMES: Record<MapId, Theme> = {
  forest: {
    sky0: '#0E3B2E',
    sky1: '#3FA66A',
    sky2: '#B9F6D0',
    slope0: '#2D7D46',
    slope1: '#14532D',
    slope2: '#0B2F1A',
    trailFill: '#F6C46A',
    trailStroke: '#7A4214',
    trailGlow: '#FFE4A3',
    accent: '#7CFF9B',
    frame: '#2A1A10',
  },
  ocean: {
    sky0: '#062143',
    sky1: '#0B67B2',
    sky2: '#8CE7FF',
    slope0: '#0E8AB8',
    slope1: '#075985',
    slope2: '#083344',
    trailFill: '#B8F3FF',
    trailStroke: '#034A67',
    trailGlow: '#E0FBFF',
    accent: '#38D5FF',
    frame: '#07233A',
  },
  space: {
    sky0: '#090516',
    sky1: '#26145C',
    sky2: '#7C3AED',
    slope0: '#6D28D9',
    slope1: '#312E81',
    slope2: '#111827',
    trailFill: '#E9D5FF',
    trailStroke: '#581C87',
    trailGlow: '#C084FC',
    accent: '#A78BFA',
    frame: '#130B2A',
  },
  sky: {
    sky0: '#1769AA',
    sky1: '#64B5F6',
    sky2: '#E0F7FF',
    slope0: '#8CD867',
    slope1: '#43A047',
    slope2: '#1B5E20',
    trailFill: '#FFF3A3',
    trailStroke: '#B7791F',
    trailGlow: '#FFFDE7',
    accent: '#FFE66D',
    frame: '#174C7A',
  },
  volcano: {
    sky0: '#1A0B0B',
    sky1: '#7F1D1D',
    sky2: '#FF7043',
    slope0: '#8B3A24',
    slope1: '#4E1F14',
    slope2: '#1C0B08',
    trailFill: '#FFB088',
    trailStroke: '#7C1D12',
    trailGlow: '#FF6A3D',
    accent: '#FFB020',
    frame: '#2A0E0A',
  },
};

function FloatingParticles({ mapId }: { mapId: MapId }) {
  if (mapId === 'space') {
    return (
      <g>
        {Array.from({ length: 70 }).map((_, i) => (
          <circle
            key={i}
            cx={(i * 19 + 7) % 100}
            cy={(i * 29 + 13) % 92}
            r={0.15 + (i % 4) * 0.18}
            fill="white"
            opacity={0.35 + (i % 5) * 0.12}
          />
        ))}
        <circle cx="76" cy="18" r="7" fill="#FDE68A" opacity="0.9" />
        <circle cx="73" cy="16" r="7" fill="#090516" opacity="0.7" />
      </g>
    );
  }

  return (
    <g opacity="0.35">
      {Array.from({ length: 34 }).map((_, i) => (
        <circle
          key={i}
          cx={(i * 23 + 11) % 100}
          cy={(i * 17 + 9) % 70}
          r={0.25 + (i % 3) * 0.18}
          fill="white"
        />
      ))}
    </g>
  );
}

function MapScenery({ mapId, theme }: { mapId: MapId; theme: Theme }) {
  switch (mapId) {
    case 'forest':
      return (
        <g>
          <path
            d="M0 58 C18 45 28 52 42 39 C58 25 70 43 100 31 L100 100 L0 100 Z"
            fill={theme.slope2}
            opacity="0.55"
          />
          <path
            d="M0 66 C20 52 35 60 52 45 C70 30 82 48 100 40 L100 100 L0 100 Z"
            fill={theme.slope1}
            opacity="0.9"
          />
          {[8, 17, 29, 41, 54, 67, 81, 93].map((x, i) => (
            <g key={i} transform={`translate(${x}, ${61 + (i % 3) * 7})`}>
              <rect x="-1" y="13" width="2" height="9" rx="0.6" fill="#5B341E" />
              <polygon points="0,-8 -8,16 8,16" fill="#0F4A25" />
              <polygon points="0,-14 -6,8 6,8" fill="#1F7A3B" />
              <polygon points="0,-19 -4,0 4,0" fill="#39A85A" />
            </g>
          ))}
          <ellipse cx="24" cy="16" rx="14" ry="6" fill="white" opacity="0.55" />
          <ellipse cx="63" cy="11" rx="18" ry="7" fill="white" opacity="0.45" />
        </g>
      );

    case 'ocean':
      return (
        <g>
          <path
            d="M0 64 C18 52 27 58 39 49 C53 37 67 55 100 43 L100 100 L0 100 Z"
            fill={theme.slope2}
            opacity="0.5"
          />
          <path
            d="M0 72 C23 61 38 68 55 55 C73 41 88 59 100 52 L100 100 L0 100 Z"
            fill={theme.slope1}
            opacity="0.82"
          />
          {[12, 30, 48, 66, 84].map((x, i) => (
            <path
              key={i}
              d={`M${x - 7} ${76 + i * 2} C${x - 3} ${73 + i * 2}, ${x + 3} ${79 + i * 2}, ${x + 7} ${76 + i * 2}`}
              stroke="#A7F3D0"
              strokeWidth="0.8"
              fill="none"
              opacity="0.65"
            />
          ))}
          {[17, 39, 62, 82].map((x, i) => (
            <g key={i} transform={`translate(${x}, ${73 + (i % 2) * 5})`}>
              <ellipse cx="0" cy="0" rx="3.8" ry="6.5" fill="#F472B6" opacity="0.8" />
              <ellipse cx="4" cy="2" rx="2.5" ry="5" fill="#C084FC" opacity="0.75" />
            </g>
          ))}
        </g>
      );

    case 'space':
      return (
        <g>
          <path
            d="M0 60 C18 50 30 53 48 42 C64 32 78 46 100 35 L100 100 L0 100 Z"
            fill={theme.slope2}
            opacity="0.75"
          />
          <path
            d="M0 71 C21 59 37 66 54 53 C72 40 87 55 100 48 L100 100 L0 100 Z"
            fill={theme.slope1}
            opacity="0.9"
          />
          {[18, 43, 71].map((x, i) => (
            <ellipse
              key={i}
              cx={x}
              cy={78 + i * 3}
              rx="7"
              ry="2.2"
              fill="#111827"
              stroke="#8B5CF6"
              strokeWidth="0.4"
              opacity="0.75"
            />
          ))}
        </g>
      );

    case 'sky':
      return (
        <g>
          <ellipse cx="24" cy="17" rx="17" ry="7" fill="white" opacity="0.75" />
          <ellipse cx="72" cy="13" rx="21" ry="8" fill="white" opacity="0.7" />
          <ellipse cx="84" cy="25" rx="13" ry="5" fill="white" opacity="0.45" />
          <path
            d="M0 63 C16 50 31 60 45 47 C63 29 78 49 100 38 L100 100 L0 100 Z"
            fill={theme.slope2}
            opacity="0.45"
          />
          <path
            d="M0 73 C22 58 39 67 57 52 C74 38 91 58 100 50 L100 100 L0 100 Z"
            fill={theme.slope1}
            opacity="0.85"
          />
        </g>
      );

    case 'volcano':
      return (
        <g>
          <path d="M43 9 L57 9 L53 28 L47 28 Z" fill="#2A0E0A" />
          <path d="M48 9 C50 4 52 4 54 9" stroke="#FFB020" strokeWidth="1.5" fill="none" opacity="0.8" />
          <path
            d="M0 61 C18 50 32 55 48 41 C63 28 78 48 100 36 L100 100 L0 100 Z"
            fill={theme.slope2}
            opacity="0.8"
          />
          <path
            d="M0 72 C22 60 38 66 55 51 C73 34 90 56 100 49 L100 100 L0 100 Z"
            fill={theme.slope1}
            opacity="0.95"
          />
          {[16, 36, 57, 76, 91].map((x, i) => (
            <path
              key={i}
              d={`M${x} ${68 + (i % 3) * 7} C${x + 5} ${72 + (i % 3) * 7}, ${x - 2} ${78 + (i % 3) * 7}, ${x + 7} ${83 + (i % 3) * 7}`}
              stroke="#FF5722"
              strokeWidth="1"
              fill="none"
              opacity="0.75"
            />
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
  /** 대시보드용: 화면 전체 높이 대신 큰 임베드 영역 */
  embedded?: boolean;
}

function ClimbRaceTrackInner({
  mapId,
  players,
  emphasizePlayerId,
  timerSeconds,
  className,
  compact,
  embedded,
}: ClimbRaceTrackProps) {
  const theme = THEMES[mapId] ?? THEMES.forest;
  const pathD = trackPathD(CLIMB_TRACK_POINTS);
  const stable = [...players].sort((a, b) => a.id.localeCompare(b.id));
  const trailStones = [0.03, 0.09, 0.15, 0.21, 0.28, 0.35, 0.42, 0.49, 0.56, 0.63, 0.7, 0.77, 0.84, 0.91, 0.97];
  const checkpointT = [0, 0.2, 0.4, 0.62, 0.82, 1];

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-[28px] border shadow-2xl',
        'bg-slate-950',
        compact
          ? 'min-h-[240px]'
          : embedded
            ? 'min-h-[min(52vh,520px)] h-[min(52vh,520px)] w-full max-h-[88vh] lg:min-h-[min(58vh,600px)] lg:h-[min(58vh,600px)]'
            : 'min-h-[min(100vh,540px)] lg:min-h-screen lg:h-screen',
        className
      )}
      style={{
        borderColor: theme.accent,
        boxShadow: `0 24px 70px rgba(0,0,0,0.45), inset 0 0 0 2px rgba(255,255,255,0.18), 0 0 34px ${theme.accent}55`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 z-30 rounded-[28px]"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.02) 18%, rgba(0,0,0,0.18) 100%)',
        }}
      />

      <div
        className="pointer-events-none absolute inset-0 z-20 opacity-35"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.13) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.13) 1px, transparent 1px)',
          backgroundSize: '42px 42px',
          maskImage: 'linear-gradient(to bottom, black, transparent 72%)',
        }}
      />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <radialGradient id={`sun-${mapId}`} cx="50%" cy="15%" r="60%">
            <stop offset="0%" stopColor={theme.sky2} stopOpacity="0.75" />
            <stop offset="45%" stopColor={theme.sky1} stopOpacity="0.32" />
            <stop offset="100%" stopColor={theme.sky0} stopOpacity="0" />
          </radialGradient>

          <linearGradient id={`sky-${mapId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={theme.sky0} />
            <stop offset="52%" stopColor={theme.sky1} />
            <stop offset="100%" stopColor={theme.sky2} />
          </linearGradient>

          <linearGradient id={`slope-${mapId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.slope0} />
            <stop offset="55%" stopColor={theme.slope1} />
            <stop offset="100%" stopColor={theme.slope2} />
          </linearGradient>

          <filter id={`trailShadow-${mapId}`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="1.2" stdDeviation="1.1" floodColor="#000000" floodOpacity="0.45" />
          </filter>

          <filter id={`trailGlow-${mapId}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.6" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <pattern id={`trackDots-${mapId}`} width="4" height="4" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.45" fill="rgba(255,255,255,0.45)" />
          </pattern>
        </defs>

        <rect width="100" height="100" fill={`url(#sky-${mapId})`} />
        <rect width="100" height="100" fill={`url(#sun-${mapId})`} />

        <FloatingParticles mapId={mapId} />

        <path
          d="M0 58 C16 47 31 52 46 39 C63 24 78 44 100 32 L100 100 L0 100 Z"
          fill={`url(#slope-${mapId})`}
          opacity="0.45"
        />

        <MapScenery mapId={mapId} theme={theme} />

        <path
          d={pathD}
          fill="none"
          stroke="#1a0f08"
          strokeWidth="11.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.55"
        />
        <path
          d={pathD}
          fill="none"
          stroke="#5c4a3a"
          strokeWidth="9.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.42"
        />

        <g opacity="0.55">
          {trailStones.map((t, i) => {
            const pt = getPointOnPolyline(CLIMB_TRACK_POINTS, t);
            const jitter = ((i * 17) % 5) * 0.08 - 0.16;
            return (
              <ellipse
                key={i}
                cx={pt.x + jitter * 0.35}
                cy={pt.y + jitter * 0.22}
                rx={0.35 + (i % 3) * 0.06}
                ry={0.22 + (i % 2) * 0.05}
                fill="#2d2418"
                opacity={0.35 + (i % 4) * 0.06}
                transform={`rotate(${i * 31 + 12} ${pt.x} ${pt.y})`}
              />
            );
          })}
        </g>

        <path
          d={pathD}
          fill="none"
          stroke="#1f2937"
          strokeWidth="7.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.42"
          filter={`url(#trailShadow-${mapId})`}
        />

        <path
          d={pathD}
          fill="none"
          stroke={theme.trailStroke}
          strokeWidth="6.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.92"
          filter={`url(#trailShadow-${mapId})`}
        />

        <path
          d={pathD}
          fill="none"
          stroke={theme.trailFill}
          strokeWidth="4.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d={pathD}
          fill="none"
          stroke={theme.trailGlow}
          strokeWidth="1.15"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.85"
          filter={`url(#trailGlow-${mapId})`}
        />

        <path
          d={pathD}
          fill="none"
          stroke={`url(#trackDots-${mapId})`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.18"
        />

        <g filter={`url(#trailShadow-${mapId})`} opacity="0.95">
          {checkpointT.map((t, idx) => {
            const pt = getPointOnPolyline(CLIMB_TRACK_POINTS, t);
            const next = getPointOnPolyline(CLIMB_TRACK_POINTS, Math.min(1, t + 0.02));
            const ang =
              pt.x !== next.x ? (Math.atan2(next.y - pt.y, next.x - pt.x) * 180) / Math.PI - 90 : 0;
            const doneTint = '#22C55E';
            const lockTint = '#94A3B8';
            return (
              <g key={idx} transform={`translate(${pt.x}, ${pt.y}) rotate(${ang})`}>
                <line x1="0" y1="6" x2="0" y2="-10" stroke="#1f2937" strokeWidth="0.45" opacity="0.55" />
                <path
                  d="M -2.8 -14 L -2.8 -22 L 3.8 -21 L 6.2 -19 L 8.4 -21 L 8 -14 Z"
                  fill={idx <= 3 ? theme.trailGlow : idx === checkpointT.length - 1 ? theme.accent : lockTint}
                  stroke="#0f172a"
                  strokeWidth="0.35"
                  opacity={0.9}
                />
                <ellipse cx="-1.2" cy="-12" rx="0.9" ry="2.2" fill={theme.accent} opacity="0.35" />
                {idx === checkpointT.length - 1 ? (
                  <circle cx="-0.5" cy="-29" r="1.9" fill={doneTint} stroke="#14532d" strokeWidth="0.25" />
                ) : null}
              </g>
            );
          })}
        </g>

        <g transform="translate(72, 6)">
          <motion.g
            initial={false}
            animate={{ y: [0, -1.2, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path d="M-5 -10 H5 L4 4 H-4 Z" fill="#EF4444" stroke="#1F2937" strokeWidth="0.7" />
            <path d="M0 -16 L-7 -7 H7 Z" fill="#FDE047" stroke="#1F2937" strokeWidth="0.65" />
            <circle cx="0" cy="1.2" r="2" fill="#FFF7AD" stroke="#1F2937" strokeWidth="0.35" />
            <path d="M0 5 C-3 8 -2 11 0 13 C2 11 3 8 0 5 Z" fill="#FB923C" opacity="0.9" />
          </motion.g>
        </g>

        <rect x="1" y="1" width="98" height="98" rx="4" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.35" />
      </svg>

      <div className="pointer-events-none absolute left-4 top-4 z-40 rounded-2xl border border-white/20 bg-black/35 px-4 py-2 text-white shadow-xl backdrop-blur-md">
        <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/60">
          Climb Race
        </div>
        <div className="text-sm font-black drop-shadow">
          수학 등반 미션
        </div>
      </div>

      {timerSeconds != null && (
        <motion.div
          className="pointer-events-none absolute right-4 top-4 z-40 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/30 text-2xl font-black text-white shadow-2xl backdrop-blur-md"
          style={{
            background: `linear-gradient(135deg, ${theme.accent}DD, rgba(0,0,0,0.45))`,
            boxShadow: `0 0 26px ${theme.accent}88, inset 0 0 16px rgba(255,255,255,0.18)`,
          }}
          animate={{ scale: timerSeconds <= 5 ? [1, 1.08, 1] : 1 }}
          transition={{ duration: 0.55, repeat: timerSeconds <= 5 ? Infinity : 0 }}
        >
          {timerSeconds}
        </motion.div>
      )}

      <div className="pointer-events-none absolute inset-0 z-30">
        {stable.map((p, idx) => {
          const t = Math.min(1, Math.max(0, (p.position ?? 0) / 100));
          const base = getPointOnPolyline(CLIMB_TRACK_POINTS, t);
          const lane = idx - (stable.length - 1) / 2;
          const px = Math.min(94, Math.max(6, base.x + lane * 3.5));
          const py = Math.min(94, Math.max(6, base.y + Math.abs(lane) * 1.2));
          const isMe = emphasizePlayerId && p.id === emphasizePlayerId;
          const size = compact ? 38 : isMe ? 58 : 44;

          return (
            <motion.div
              key={p.id}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              initial={false}
              animate={{ left: `${px}%`, top: `${py}%` }}
              transition={{ type: 'spring', stiffness: 130, damping: 17 }}
            >
              <motion.div
                className={cn(
                  'mb-1 max-w-[86px] truncate rounded-full border px-2 py-0.5 text-center text-[10px] font-black shadow-lg backdrop-blur-md',
                  isMe
                    ? 'border-yellow-200 bg-yellow-300 text-yellow-950 ring-2 ring-yellow-100/70'
                    : 'border-white/30 bg-black/45 text-white'
                )}
                animate={isMe ? { y: [0, -2, 0] } : undefined}
                transition={isMe ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : undefined}
              >
                {isMe ? '★ ' : ''}
                {p.nickname}
              </motion.div>

              <div
                className={cn(
                  'relative drop-shadow-[0_8px_10px_rgba(0,0,0,0.5)]',
                  isMe && 'scale-110'
                )}
              >
                {isMe && (
                  <div
                    className="absolute -inset-2 -z-10 rounded-full blur-md"
                    style={{ backgroundColor: theme.accent, opacity: 0.6 }}
                  />
                )}
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

      <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-40">
        <div className="mx-auto flex max-w-xl items-center justify-center gap-2 rounded-2xl border border-white/20 bg-black/40 px-4 py-2 text-center text-xs font-bold text-white shadow-2xl backdrop-blur-md">
          <span
            className="inline-flex h-2 w-2 rounded-full"
            style={{
              backgroundColor: theme.accent,
              boxShadow: `0 0 14px ${theme.accent}`,
            }}
          />
          모두 제출해야 이번 문제에서의 등반 순위와 위치가 한꺼번에 업데이트돼요
        </div>
      </div>
    </div>
  );
}

export const ClimbRaceTrack = memo(ClimbRaceTrackInner);
