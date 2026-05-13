'use client';

import { CharacterId } from '@/types/game';
import { cn } from '@/lib/utils';

interface CharacterSpriteProps {
  character: CharacterId;
  size?: number;
  running?: boolean;
  className?: string;
  color?: string;
}

const CHARACTERS: Record<CharacterId, { name: string; emoji: string; color: string; accent: string }> = {
  fox: { name: '여우', emoji: '🦊', color: '#FF6B35', accent: '#FFE0CC' },
  cat: { name: '고양이', emoji: '🐱', color: '#9B59B6', accent: '#E8D5F5' },
  rabbit: { name: '토끼', emoji: '🐰', color: '#EC407A', accent: '#FCE4EC' },
  bear: { name: '곰', emoji: '🐻', color: '#8D6E63', accent: '#D7CCC8' },
  penguin: { name: '펭귄', emoji: '🐧', color: '#1976D2', accent: '#BBDEFB' },
  dog: { name: '강아지', emoji: '🐶', color: '#F9A825', accent: '#FFF9C4' },
};

function FoxSVG({ size, running }: { size: number; running: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Body */}
      <ellipse cx="32" cy="40" rx="14" ry="12" fill="#FF6B35" />
      {/* Head */}
      <circle cx="32" cy="22" r="13" fill="#FF6B35" />
      {/* Ears */}
      <polygon points="19,13 14,3 24,10" fill="#FF6B35" />
      <polygon points="45,13 50,3 40,10" fill="#FF6B35" />
      <polygon points="20,12 16,5 23,10" fill="#FFB49A" />
      <polygon points="44,12 48,5 41,10" fill="#FFB49A" />
      {/* Face white */}
      <ellipse cx="32" cy="25" rx="8" ry="7" fill="#FFE0CC" />
      {/* Eyes */}
      <circle cx="28" cy="20" r="2.5" fill="#2C1810" />
      <circle cx="36" cy="20" r="2.5" fill="#2C1810" />
      <circle cx="28.8" cy="19.2" r="0.8" fill="white" />
      <circle cx="36.8" cy="19.2" r="0.8" fill="white" />
      {/* Nose */}
      <ellipse cx="32" cy="24" rx="1.5" ry="1" fill="#FF4466" />
      {/* Mouth */}
      <path d="M29 26 Q32 28 35 26" stroke="#2C1810" strokeWidth="1" fill="none" />
      {/* Tail */}
      <ellipse cx="46" cy="44" rx="8" ry="5" fill="#FF6B35" transform="rotate(-30 46 44)" />
      <ellipse cx="49" cy="40" rx="4" ry="3" fill="#FFE0CC" transform="rotate(-30 49 40)" />
      {/* Legs */}
      <rect x="21" y="48" width="7" height="10" rx="3" fill="#FF6B35"
        style={{ transformOrigin: '24px 48px', animation: running ? 'legFront 0.3s infinite alternate' : 'none' }} />
      <rect x="36" y="48" width="7" height="10" rx="3" fill="#CC4400"
        style={{ transformOrigin: '40px 48px', animation: running ? 'legBack 0.3s infinite alternate' : 'none' }} />
    </svg>
  );
}

function CatSVG({ size, running }: { size: number; running: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <ellipse cx="32" cy="42" rx="13" ry="11" fill="#9B59B6" />
      <circle cx="32" cy="22" r="13" fill="#9B59B6" />
      {/* Cat ears */}
      <polygon points="19,14 15,4 26,12" fill="#9B59B6" />
      <polygon points="45,14 49,4 38,12" fill="#9B59B6" />
      <polygon points="20,13 17,6 25,11" fill="#E8D5F5" />
      <polygon points="44,13 47,6 39,11" fill="#E8D5F5" />
      {/* Face */}
      <ellipse cx="32" cy="25" rx="8" ry="7" fill="#E8D5F5" />
      {/* Eyes */}
      <ellipse cx="28" cy="20" rx="2.5" ry="3" fill="#2C1810" />
      <ellipse cx="36" cy="20" rx="2.5" ry="3" fill="#2C1810" />
      <ellipse cx="28" cy="19" rx="0.8" ry="1.2" fill="white" />
      <ellipse cx="36" cy="19" rx="0.8" ry="1.2" fill="white" />
      {/* Nose */}
      <polygon points="32,23 30,25 34,25" fill="#FF69B4" />
      {/* Whiskers */}
      <line x1="24" y1="25" x2="16" y2="24" stroke="#7A3FA0" strokeWidth="0.8" />
      <line x1="24" y1="27" x2="16" y2="28" stroke="#7A3FA0" strokeWidth="0.8" />
      <line x1="40" y1="25" x2="48" y2="24" stroke="#7A3FA0" strokeWidth="0.8" />
      <line x1="40" y1="27" x2="48" y2="28" stroke="#7A3FA0" strokeWidth="0.8" />
      {/* Tail */}
      <path d="M45 50 Q55 40 50 32" stroke="#9B59B6" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* Legs */}
      <rect x="21" y="49" width="7" height="9" rx="3" fill="#9B59B6"
        style={{ transformOrigin: '24px 49px', animation: running ? 'legFront 0.3s infinite alternate' : 'none' }} />
      <rect x="36" y="49" width="7" height="9" rx="3" fill="#7A3FA0"
        style={{ transformOrigin: '40px 49px', animation: running ? 'legBack 0.3s infinite alternate' : 'none' }} />
    </svg>
  );
}

function RabbitSVG({ size, running }: { size: number; running: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Long ears */}
      <ellipse cx="25" cy="10" rx="5" ry="12" fill="#EC407A" />
      <ellipse cx="39" cy="10" rx="5" ry="12" fill="#EC407A" />
      <ellipse cx="25" cy="10" rx="3" ry="9" fill="#FCE4EC" />
      <ellipse cx="39" cy="10" rx="3" ry="9" fill="#FCE4EC" />
      {/* Body */}
      <ellipse cx="32" cy="43" rx="14" ry="12" fill="#EC407A" />
      {/* Head */}
      <circle cx="32" cy="24" r="13" fill="#EC407A" />
      {/* Face */}
      <ellipse cx="32" cy="27" rx="8" ry="6" fill="#FCE4EC" />
      {/* Eyes */}
      <circle cx="28" cy="22" r="2.5" fill="#2C1810" />
      <circle cx="36" cy="22" r="2.5" fill="#2C1810" />
      <circle cx="28.8" cy="21.2" r="0.8" fill="white" />
      <circle cx="36.8" cy="21.2" r="0.8" fill="white" />
      {/* Nose */}
      <ellipse cx="32" cy="26" rx="2" ry="1.5" fill="#FF6699" />
      {/* Mouth */}
      <path d="M30 28 Q32 30 34 28" stroke="#C2185B" strokeWidth="1" fill="none" />
      {/* Tail */}
      <circle cx="46" cy="47" r="5" fill="#FCE4EC" />
      {/* Legs */}
      <rect x="21" y="50" width="7" height="9" rx="3" fill="#EC407A"
        style={{ transformOrigin: '24px 50px', animation: running ? 'legFront 0.3s infinite alternate' : 'none' }} />
      <rect x="36" y="50" width="7" height="9" rx="3" fill="#C2185B"
        style={{ transformOrigin: '40px 50px', animation: running ? 'legBack 0.3s infinite alternate' : 'none' }} />
    </svg>
  );
}

function BearSVG({ size, running }: { size: number; running: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Ears */}
      <circle cx="21" cy="13" r="7" fill="#8D6E63" />
      <circle cx="43" cy="13" r="7" fill="#8D6E63" />
      <circle cx="21" cy="13" r="4" fill="#D7CCC8" />
      <circle cx="43" cy="13" r="4" fill="#D7CCC8" />
      {/* Body */}
      <ellipse cx="32" cy="43" rx="15" ry="13" fill="#8D6E63" />
      {/* Head */}
      <circle cx="32" cy="23" r="14" fill="#8D6E63" />
      {/* Muzzle */}
      <ellipse cx="32" cy="27" rx="9" ry="7" fill="#D7CCC8" />
      {/* Eyes */}
      <circle cx="27" cy="21" r="3" fill="#2C1810" />
      <circle cx="37" cy="21" r="3" fill="#2C1810" />
      <circle cx="27.8" cy="20.2" r="1" fill="white" />
      <circle cx="37.8" cy="20.2" r="1" fill="white" />
      {/* Nose */}
      <ellipse cx="32" cy="25" rx="2.5" ry="2" fill="#2C1810" />
      {/* Mouth */}
      <path d="M29 28 Q32 31 35 28" stroke="#2C1810" strokeWidth="1.2" fill="none" />
      {/* Belly */}
      <ellipse cx="32" cy="43" rx="9" ry="8" fill="#D7CCC8" />
      {/* Legs */}
      <rect x="20" y="50" width="8" height="10" rx="4" fill="#8D6E63"
        style={{ transformOrigin: '24px 50px', animation: running ? 'legFront 0.3s infinite alternate' : 'none' }} />
      <rect x="36" y="50" width="8" height="10" rx="4" fill="#6D4C41"
        style={{ transformOrigin: '40px 50px', animation: running ? 'legBack 0.3s infinite alternate' : 'none' }} />
    </svg>
  );
}

function PenguinSVG({ size, running }: { size: number; running: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Body */}
      <ellipse cx="32" cy="42" rx="15" ry="14" fill="#1976D2" />
      {/* Belly */}
      <ellipse cx="32" cy="44" rx="10" ry="11" fill="#BBDEFB" />
      {/* Head */}
      <circle cx="32" cy="21" r="13" fill="#1976D2" />
      {/* Face */}
      <ellipse cx="32" cy="23" rx="8" ry="7" fill="#BBDEFB" />
      {/* Eyes */}
      <circle cx="28" cy="19" r="2.5" fill="#0D1B2A" />
      <circle cx="36" cy="19" r="2.5" fill="#0D1B2A" />
      <circle cx="28.8" cy="18.2" r="0.8" fill="white" />
      <circle cx="36.8" cy="18.2" r="0.8" fill="white" />
      {/* Beak */}
      <polygon points="32,23 29,26 35,26" fill="#FF8F00" />
      {/* Wings */}
      <ellipse cx="16" cy="42" rx="5" ry="10" fill="#1565C0" transform="rotate(15 16 42)"
        style={{ transformOrigin: '16px 36px', animation: running ? 'wingFlap 0.3s infinite alternate' : 'none' }} />
      <ellipse cx="48" cy="42" rx="5" ry="10" fill="#1565C0" transform="rotate(-15 48 42)"
        style={{ transformOrigin: '48px 36px', animation: running ? 'wingFlap 0.3s infinite alternate' : 'none' }} />
      {/* Feet */}
      <ellipse cx="26" cy="56" rx="6" ry="3" fill="#FF8F00" />
      <ellipse cx="38" cy="56" rx="6" ry="3" fill="#FF8F00" />
    </svg>
  );
}

function DogSVG({ size, running }: { size: number; running: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Floppy ears */}
      <ellipse cx="19" cy="20" rx="7" ry="11" fill="#F9A825" />
      <ellipse cx="45" cy="20" rx="7" ry="11" fill="#F9A825" />
      {/* Body */}
      <ellipse cx="32" cy="43" rx="14" ry="12" fill="#F9A825" />
      {/* Head */}
      <circle cx="32" cy="23" r="13" fill="#F9A825" />
      {/* Face */}
      <ellipse cx="32" cy="27" rx="9" ry="7" fill="#FFF9C4" />
      {/* Eyes */}
      <circle cx="27" cy="21" r="3" fill="#3E2723" />
      <circle cx="37" cy="21" r="3" fill="#3E2723" />
      <circle cx="27.8" cy="20.2" r="1" fill="white" />
      <circle cx="37.8" cy="20.2" r="1" fill="white" />
      {/* Nose */}
      <ellipse cx="32" cy="25" rx="3" ry="2.5" fill="#3E2723" />
      {/* Mouth */}
      <path d="M29 28 Q32 31 35 28" stroke="#3E2723" strokeWidth="1.2" fill="none" />
      {/* Tongue */}
      <ellipse cx="32" cy="31" rx="3" ry="2" fill="#FF6B6B" />
      {/* Tail */}
      <path d="M46 44 Q58 36 54 28" stroke="#F9A825" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* Legs */}
      <rect x="21" y="50" width="7" height="9" rx="3" fill="#F9A825"
        style={{ transformOrigin: '24px 50px', animation: running ? 'legFront 0.3s infinite alternate' : 'none' }} />
      <rect x="36" y="50" width="7" height="9" rx="3" fill="#E65100"
        style={{ transformOrigin: '40px 50px', animation: running ? 'legBack 0.3s infinite alternate' : 'none' }} />
    </svg>
  );
}

const CHARACTER_COMPONENTS: Record<CharacterId, React.FC<{ size: number; running: boolean }>> = {
  fox: FoxSVG,
  cat: CatSVG,
  rabbit: RabbitSVG,
  bear: BearSVG,
  penguin: PenguinSVG,
  dog: DogSVG,
};

export function CharacterSprite({ character, size = 64, running = false, className }: CharacterSpriteProps) {
  const Component = CHARACTER_COMPONENTS[character];
  return (
    <div
      className={cn('relative inline-block', running && 'animate-bounce', className)}
      style={{ animationDuration: running ? '0.4s' : undefined }}
    >
      <style>{`
        @keyframes legFront { from { transform: rotate(-20deg); } to { transform: rotate(20deg); } }
        @keyframes legBack { from { transform: rotate(20deg); } to { transform: rotate(-20deg); } }
        @keyframes wingFlap { from { transform: rotate(15deg); } to { transform: rotate(-10deg); } }
      `}</style>
      <Component size={size} running={running} />
    </div>
  );
}

export function CharacterCard({
  character,
  selected,
  onClick,
}: {
  character: CharacterId;
  selected: boolean;
  onClick: () => void;
}) {
  const info = CHARACTERS[character];
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 p-4 rounded-2xl border-4 transition-all duration-200 cursor-pointer',
        'hover:scale-105 hover:shadow-xl',
        selected
          ? 'border-yellow-400 bg-yellow-50 shadow-lg shadow-yellow-200 scale-105'
          : 'border-gray-200 bg-white hover:border-gray-300'
      )}
    >
      <div className={cn('rounded-full p-3', selected ? 'bg-yellow-100' : 'bg-gray-50')}>
        <CharacterSprite character={character} size={72} running={selected} />
      </div>
      <span className="font-bold text-gray-700 text-sm">{info.name}</span>
      {selected && (
        <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-bold">선택됨!</span>
      )}
    </button>
  );
}

export { CHARACTERS };
