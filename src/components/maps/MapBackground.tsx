'use client';

import { MapId } from '@/types/game';
import { cn } from '@/lib/utils';

interface MapBackgroundProps {
  map: MapId;
  className?: string;
  children?: React.ReactNode;
}

const MAP_CONFIGS: Record<MapId, { name: string; emoji: string; gradient: string; track: string }> = {
  forest: {
    name: '🌲 신비한 숲속',
    emoji: '🌲',
    gradient: 'from-green-900 via-green-700 to-emerald-500',
    track: 'bg-amber-800',
  },
  ocean: {
    name: '🌊 깊은 바닷속',
    emoji: '🐠',
    gradient: 'from-blue-900 via-blue-600 to-cyan-400',
    track: 'bg-blue-300',
  },
  space: {
    name: '🚀 우주 탐험',
    emoji: '⭐',
    gradient: 'from-gray-950 via-purple-900 to-indigo-800',
    track: 'bg-purple-400',
  },
  sky: {
    name: '☁️ 하늘 위',
    emoji: '☁️',
    gradient: 'from-sky-400 via-blue-300 to-cyan-200',
    track: 'bg-white',
  },
  volcano: {
    name: '🌋 화산 지대',
    emoji: '🔥',
    gradient: 'from-red-900 via-orange-700 to-yellow-500',
    track: 'bg-gray-700',
  },
};

function ForestDecorations() {
  return (
    <>
      {/* Trees */}
      {[5, 15, 25, 35, 45, 55, 65, 75, 85, 95].map((x) => (
        <g key={x} transform={`translate(${x}%, 0)`}>
          <rect x="0" y="55" width="3" height="20" fill="#5D4037" />
          <polygon points="1.5,10 -8,60 11,60" fill="#2E7D32" />
          <polygon points="1.5,25 -6,55 9,55" fill="#388E3C" />
        </g>
      ))}
      {/* Ground flowers */}
      {[10, 30, 50, 70, 90].map((x) => (
        <text key={x} x={`${x}%`} y="78%" fontSize="16" textAnchor="middle">🌸</text>
      ))}
      {/* Clouds */}
      <text x="20%" y="15%" fontSize="30">☁️</text>
      <text x="60%" y="10%" fontSize="24">⛅</text>
      <text x="80%" y="18%" fontSize="20">☁️</text>
    </>
  );
}

function OceanDecorations() {
  return (
    <>
      {/* Waves and bubbles */}
      {[10, 30, 50, 70, 90].map((x) => (
        <text key={x} x={`${x}%`} y="20%" fontSize="24" textAnchor="middle">🫧</text>
      ))}
      {/* Fish */}
      <text x="15%" y="40%" fontSize="28">🐠</text>
      <text x="40%" y="60%" fontSize="24">🐟</text>
      <text x="70%" y="35%" fontSize="26">🦑</text>
      <text x="85%" y="55%" fontSize="20">🐡</text>
      {/* Seaweed */}
      {[5, 20, 40, 60, 80, 95].map((x) => (
        <text key={x} x={`${x}%`} y="80%" fontSize="28" textAnchor="middle">🌿</text>
      ))}
      {/* Coral */}
      <text x="25%" y="75%" fontSize="22">🪸</text>
      <text x="55%" y="72%" fontSize="18">🪸</text>
    </>
  );
}

function SpaceDecorations() {
  return (
    <>
      {/* Stars */}
      {[5, 12, 22, 30, 42, 53, 64, 73, 82, 91].map((x, i) => (
        <text key={x} x={`${x}%`} y={`${10 + (i % 3) * 15}%`} fontSize="14" textAnchor="middle">⭐</text>
      ))}
      {/* Planets */}
      <text x="15%" y="25%" fontSize="36">🪐</text>
      <text x="75%" y="20%" fontSize="28">🌙</text>
      <text x="45%" y="15%" fontSize="20">💫</text>
      {/* Rockets and aliens */}
      <text x="30%" y="55%" fontSize="26">🚀</text>
      <text x="65%" y="45%" fontSize="22">👾</text>
      <text x="88%" y="35%" fontSize="24">🛸</text>
      {/* Meteors */}
      <text x="10%" y="50%" fontSize="18">☄️</text>
      <text x="55%" y="65%" fontSize="16">✨</text>
    </>
  );
}

function SkyDecorations() {
  return (
    <>
      {/* Clouds */}
      {[10, 35, 60, 85].map((x) => (
        <text key={x} x={`${x}%`} y="20%" fontSize="40" textAnchor="middle">☁️</text>
      ))}
      {/* Birds */}
      <text x="25%" y="35%" fontSize="22">🦅</text>
      <text x="55%" y="28%" fontSize="18">🐦</text>
      <text x="80%" y="40%" fontSize="20">🦋</text>
      {/* Rainbow */}
      <text x="50%" y="15%" fontSize="36" textAnchor="middle">🌈</text>
      {/* Hot air balloons */}
      <text x="15%" y="55%" fontSize="28">🎈</text>
      <text x="70%" y="60%" fontSize="24">🎈</text>
    </>
  );
}

function VolcanoDecorations() {
  return (
    <>
      {/* Volcanic rocks */}
      {[5, 20, 40, 60, 80, 95].map((x) => (
        <text key={x} x={`${x}%`} y="75%" fontSize="24" textAnchor="middle">🪨</text>
      ))}
      {/* Fire */}
      {[15, 35, 55, 75].map((x) => (
        <text key={x} x={`${x}%`} y="65%" fontSize="22" textAnchor="middle">🔥</text>
      ))}
      {/* Volcano */}
      <text x="50%" y="25%" fontSize="48" textAnchor="middle">🌋</text>
      {/* Lava drops */}
      <text x="25%" y="40%" fontSize="16">🌡️</text>
      <text x="75%" y="35%" fontSize="18">💥</text>
      {/* Dinosaurs */}
      <text x="10%" y="50%" fontSize="28">🦕</text>
      <text x="85%" y="55%" fontSize="22">🦴</text>
    </>
  );
}

const MAP_DECORATIONS: Record<MapId, React.FC> = {
  forest: ForestDecorations,
  ocean: OceanDecorations,
  space: SpaceDecorations,
  sky: SkyDecorations,
  volcano: VolcanoDecorations,
};

export function MapBackground({ map, className, children }: MapBackgroundProps) {
  const config = MAP_CONFIGS[map];
  const Decorations = MAP_DECORATIONS[map];

  return (
    <div className={cn('relative w-full overflow-hidden', className)}>
      {/* Gradient background */}
      <div className={cn('absolute inset-0 bg-gradient-to-b', config.gradient)} />
      {/* SVG Decorations */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <Decorations />
      </svg>
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function MapCard({
  map,
  selected,
  onClick,
}: {
  map: MapId;
  selected: boolean;
  onClick: () => void;
}) {
  const config = MAP_CONFIGS[map];
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-2xl border-4 transition-all duration-200 cursor-pointer h-32',
        'hover:scale-105 hover:shadow-xl',
        selected
          ? 'border-yellow-400 shadow-lg shadow-yellow-200 scale-105'
          : 'border-gray-200 hover:border-gray-300'
      )}
    >
      <div className={cn('absolute inset-0 bg-gradient-to-b opacity-90', config.gradient)} />
      <div className="relative z-10 flex flex-col items-center justify-center h-full">
        <span className="text-3xl mb-1">{config.emoji}</span>
        <span className="text-white font-bold text-sm drop-shadow">{config.name}</span>
        {selected && (
          <span className="mt-1 text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-bold">선택됨!</span>
        )}
      </div>
    </button>
  );
}

export { MAP_CONFIGS };
