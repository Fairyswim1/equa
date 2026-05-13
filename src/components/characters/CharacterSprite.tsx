'use client';

import type { FC } from 'react';
import { CharacterId } from '@/types/game';
import { cn } from '@/lib/utils';

interface CharacterSpriteProps {
  character: CharacterId;
  size?: number;
  running?: boolean;
  className?: string;
  color?: string;
  /** 트랙용: 테두리·배경 강조 */
  variant?: 'default' | 'mascot';
}

const CHARACTERS: Record<CharacterId, { name: string; emoji: string; color: string; accent: string }> = {
  fox:     { name: '여우',   emoji: '🦊', color: '#FF6B35', accent: '#FFE0CC' },
  cat:     { name: '고양이', emoji: '🐱', color: '#9B59B6', accent: '#E8D5F5' },
  rabbit:  { name: '토끼',   emoji: '🐰', color: '#EC407A', accent: '#FCE4EC' },
  bear:    { name: '곰',     emoji: '🐻', color: '#8D6E63', accent: '#D7CCC8' },
  penguin: { name: '펭귄',   emoji: '🐧', color: '#1976D2', accent: '#BBDEFB' },
  dog:     { name: '강아지', emoji: '🐶', color: '#F9A825', accent: '#FFF9C4' },
};

/* ─────────────────────────────── KEYFRAMES (shared) ─────────────────────────────── */
const KEYFRAMES = `
  @keyframes charLegFront  { from { transform: rotate(-20deg); } to { transform: rotate(20deg); } }
  @keyframes charLegBack   { from { transform: rotate(20deg);  } to { transform: rotate(-20deg); } }
  @keyframes charWingFlap  { from { transform: rotate(15deg);  } to { transform: rotate(-10deg); } }
  @keyframes charBounce    { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
  @keyframes charBob       { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
  @keyframes charWaddle    { 0%,100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
  @keyframes charTailWag   { 0%,100% { transform: rotate(-12deg); } 50% { transform: rotate(14deg); } }
  @keyframes charEarWig    { 0%,80%,100% { transform: rotate(0deg); } 88% { transform: rotate(-8deg); } 95% { transform: rotate(4deg); } }
  @keyframes charBlink     { 0%,87%,100% { transform: scaleY(1); } 93% { transform: scaleY(0.08); } }
  @keyframes charArmWave   { 0%,100% { transform: rotate(-10deg); } 50% { transform: rotate(16deg); } }
  @keyframes charPawPat    { 0%,100% { transform: rotate(5deg);  } 50% { transform: rotate(-18deg); } }
  @keyframes charHop       { 0%,100% { transform: translateY(0) scaleY(1); } 40% { transform: translateY(-8px) scaleY(1.05); } 80% { transform: translateY(1px) scaleY(0.96); } }
  @keyframes charBreathe   { 0%,100% { transform: scale(1); } 50% { transform: scale(1.025); } }
`;

/* ─────────────────────────────── FOX ─────────────────────────────── */
/* 날씬하고 긴 몸, 한 팔 흔들기, 뾰족한 귀 */
function FoxSVG({ running }: { running: boolean }) {
  const bobAnim  = running ? 'charLegFront 0.3s infinite alternate' : 'charBob 2.1s ease-in-out infinite';
  const tailAnim = 'charTailWag 1.1s ease-in-out infinite';
  const armAnim  = running ? 'charArmWave 0.3s ease-in-out infinite' : 'charArmWave 1.4s ease-in-out infinite';
  return (
    <svg width="88" height="148" viewBox="0 0 88 148" fill="none" style={{ filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.28))' }}>
      <defs>
        <radialGradient id="fox_body" cx="38%" cy="32%" r="62%">
          <stop offset="0%" stopColor="#ff9966" /><stop offset="100%" stopColor="#c03808" />
        </radialGradient>
        <radialGradient id="fox_face" cx="50%" cy="42%" r="55%">
          <stop offset="0%" stopColor="#ffe8d0" /><stop offset="100%" stopColor="#f0a880" />
        </radialGradient>
      </defs>

      {/* wrapper — bob or run bounce */}
      <g style={{ animation: bobAnim }}>
        {/* Tail */}
        <g style={{ transformOrigin: '64px 110px', animation: tailAnim }}>
          <path d="M62 110 Q82 95 78 78 Q74 65 66 70 Q60 74 65 82 Q70 90 62 95 Z" fill="#c03808" />
          <path d="M65 80 Q72 72 68 68 Q63 65 60 72 Q58 78 62 82 Z" fill="#ffe8d0" />
        </g>

        {/* Right arm — raised & waving */}
        <g style={{ transformOrigin: '62px 82px', animation: armAnim }}>
          <path d="M62 82 Q78 70 80 55 Q81 48 76 46" stroke="#c84010" strokeWidth="11" fill="none" strokeLinecap="round" />
          <path d="M62 82 Q78 70 80 55 Q81 48 76 46" stroke="#e06030" strokeWidth="7"  fill="none" strokeLinecap="round" />
          <circle cx="74" cy="43" r="8" fill="#e06030" />
          <ellipse cx="68" cy="38" rx="4" ry="5.5" fill="#e06030" transform="rotate(-20 68 38)" />
          <ellipse cx="76" cy="36" rx="3.5" ry="5" fill="#e06030" transform="rotate(-5 76 36)" />
          <ellipse cx="82" cy="38" rx="3.5" ry="4.5" fill="#e06030" transform="rotate(15 82 38)" />
          <ellipse cx="74" cy="43" rx="5" ry="4" fill="#ffe8d0" opacity="0.7" />
          <line x1="68" y1="38" x2="67" y2="33" stroke="#c84010" strokeWidth="0.9" strokeLinecap="round" />
          <line x1="76" y1="36" x2="76" y2="31" stroke="#c84010" strokeWidth="0.9" strokeLinecap="round" />
          <line x1="82" y1="38" x2="83" y2="33" stroke="#c84010" strokeWidth="0.9" strokeLinecap="round" />
        </g>

        {/* Left arm — relaxed */}
        <path d="M26 82 Q14 92 12 106" stroke="#c84010" strokeWidth="11" fill="none" strokeLinecap="round" />
        <path d="M26 82 Q14 92 12 106" stroke="#e06030" strokeWidth="7"  fill="none" strokeLinecap="round" />
        <circle cx="12" cy="108" r="7.5" fill="#e06030" />
        <ellipse cx="7"  cy="103" rx="3.5" ry="5" fill="#e06030" transform="rotate(-20 7 103)" />
        <ellipse cx="5"  cy="110" rx="3.5" ry="5" fill="#e06030" transform="rotate(-5 5 110)" />
        <ellipse cx="12" cy="108" rx="4.5" ry="3.5" fill="#ffe8d0" opacity="0.7" />

        {/* Legs */}
        <path d="M32 120 Q30 132 28 142 Q26 145 22 145" stroke="#c03808" strokeWidth="13" fill="none" strokeLinecap="round"
          style={{ transformOrigin: '32px 120px', animation: running ? 'charLegFront 0.3s infinite alternate' : 'none' }} />
        <path d="M52 120 Q54 132 56 142 Q58 145 62 145" stroke="#a02808" strokeWidth="13" fill="none" strokeLinecap="round"
          style={{ transformOrigin: '52px 120px', animation: running ? 'charLegBack 0.3s infinite alternate' : 'none' }} />
        <path d="M14 143 Q10 147 20 147 Q28 147 30 143" fill="#c03808" />
        <path d="M54 143 Q56 147 66 147 Q74 147 70 143" fill="#a02808" />

        {/* Body */}
        <path d="M20 118 Q14 100 18 82 Q22 66 44 64 Q66 62 70 80 Q74 98 68 118 Q60 128 44 128 Q28 128 20 118 Z" fill="url(#fox_body)" />
        <path d="M30 118 Q28 106 30 90 Q34 76 44 74 Q54 72 58 86 Q62 100 60 114 Q56 120 44 122 Q32 122 30 118 Z" fill="#ffe8d0" opacity="0.72" />

        {/* Neck */}
        <path d="M36 64 Q36 58 38 54 Q40 50 44 50 Q48 50 50 54 Q52 58 52 64" fill="#d05020" />

        {/* Head */}
        <path d="M18 44 Q16 28 28 20 Q36 14 44 14 Q52 14 60 20 Q72 28 70 44 Q68 58 60 64 Q52 70 44 70 Q36 70 28 64 Q20 58 18 44 Z" fill="url(#fox_body)" />

        {/* Ears */}
        <g style={{ transformOrigin: '26px 22px', animation: 'charEarWig 3.8s ease-in-out infinite' }}>
          <path d="M26 22 Q18 4 24 2 Q30 0 34 14 Z" fill="#c03808" />
          <path d="M26 22 Q20 8 24 6 Q28 4 32 16 Z" fill="#ffb49a" />
        </g>
        <g style={{ transformOrigin: '62px 22px', animation: 'charEarWig 3.8s ease-in-out infinite', animationDelay: '0.7s' }}>
          <path d="M62 22 Q70 4 64 2 Q58 0 54 14 Z" fill="#c03808" />
          <path d="M62 22 Q68 8 64 6 Q60 4 56 16 Z" fill="#ffb49a" />
        </g>

        {/* Face mask */}
        <path d="M30 52 Q30 42 44 40 Q58 42 58 52 Q58 62 44 64 Q30 62 30 52 Z" fill="url(#fox_face)" />

        {/* Eyes */}
        <g style={{ transformOrigin: '35px 46px', animation: 'charBlink 3.4s ease-in-out infinite' }}>
          <ellipse cx="35" cy="46" rx="5" ry="5.5" fill="#180800" />
          <ellipse cx="53" cy="46" rx="5" ry="5.5" fill="#180800" style={{ transformOrigin: '53px 46px' }} />
        </g>
        <circle cx="36.8" cy="43.5" r="2.2" fill="white" opacity="0.95" />
        <circle cx="54.8" cy="43.5" r="2.2" fill="white" opacity="0.95" />
        <circle cx="37.6" cy="48"   r="0.9" fill="white" opacity="0.45" />
        <circle cx="55.6" cy="48"   r="0.9" fill="white" opacity="0.45" />

        {/* Nose */}
        <ellipse cx="44" cy="52" rx="3.2" ry="2.3" fill="#ff3355" />
        <ellipse cx="42.5" cy="51" rx="1.4" ry="0.9" fill="#ff8899" opacity="0.6" />

        {/* Mouth */}
        <path d="M39 55 Q44 59 49 55" stroke="#8b2010" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <path d="M44 53.5 L44 55" stroke="#8b2010" strokeWidth="1" />

        {/* Blush */}
        <ellipse cx="28" cy="52" rx="5" ry="3" fill="#ff6040" opacity="0.22" />
        <ellipse cx="60" cy="52" rx="5" ry="3" fill="#ff6040" opacity="0.22" />
      </g>
    </svg>
  );
}

/* ─────────────────────────────── CAT ─────────────────────────────── */
/* 팔짱 낀 도도한 포즈, 머리 위로 말린 꼬리, 세로 동공 */
function CatSVG({ running }: { running: boolean }) {
  return (
    <svg width="86" height="148" viewBox="0 0 86 148" fill="none" style={{ filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.28))' }}>
      <defs>
        <radialGradient id="cat_body" cx="38%" cy="30%" r="62%">
          <stop offset="0%" stopColor="#c870e8" /><stop offset="100%" stopColor="#6018a8" />
        </radialGradient>
        <radialGradient id="cat_face" cx="50%" cy="42%" r="55%">
          <stop offset="0%" stopColor="#ecd8fa" /><stop offset="100%" stopColor="#c8a0e8" />
        </radialGradient>
      </defs>
      <g style={{ animation: running ? 'charBob 0.4s ease-in-out infinite' : 'charBob 2.7s ease-in-out infinite', animationDelay: '0.4s' }}>
        {/* Tail curling up */}
        <path d="M56 122 Q76 108 74 88 Q72 70 62 66 Q54 64 52 72" stroke="#7820b8" strokeWidth="10" fill="none" strokeLinecap="round" />
        <path d="M56 122 Q76 108 74 88 Q72 70 62 66 Q54 64 52 72" stroke="#b060d8" strokeWidth="6"  fill="none" strokeLinecap="round" />
        <circle cx="50" cy="74" r="9" fill="#b060d8" />
        <circle cx="50" cy="74" r="5.5" fill="#ecd8fa" />

        {/* Crossed arms */}
        <path d="M24 86 Q30 92 50 90 Q60 90 64 88" stroke="#7820b8" strokeWidth="12" fill="none" strokeLinecap="round" />
        <path d="M24 86 Q30 92 50 90 Q60 90 64 88" stroke="#a050c8" strokeWidth="8"  fill="none" strokeLinecap="round" />
        <path d="M62 90 Q56 98 36 96 Q26 95 22 93" stroke="#6010a0" strokeWidth="11" fill="none" strokeLinecap="round" />
        <path d="M62 90 Q56 98 36 96 Q26 95 22 93" stroke="#9040b8" strokeWidth="7"  fill="none" strokeLinecap="round" />
        {/* Left paw */}
        <circle cx="20" cy="94" r="9" fill="#a050c8" />
        <ellipse cx="14" cy="91" rx="3.5" ry="5"   fill="#a050c8" transform="rotate(-25 14 91)" />
        <ellipse cx="20" cy="88" rx="3.5" ry="4.5" fill="#a050c8" transform="rotate(-8 20 88)" />
        <ellipse cx="26" cy="90" rx="3.5" ry="4.5" fill="#a050c8" transform="rotate(12 26 90)" />
        <ellipse cx="20" cy="94" rx="5.5" ry="4"   fill="#ecd8fa" opacity="0.65" />
        {/* Right paw */}
        <circle cx="66" cy="87" r="9" fill="#8828b0" />
        <ellipse cx="60" cy="84" rx="3.5" ry="5"   fill="#8828b0" transform="rotate(-15 60 84)" />
        <ellipse cx="67" cy="81" rx="3.5" ry="4.5" fill="#8828b0" transform="rotate(5 67 81)" />
        <ellipse cx="73" cy="84" rx="3"   ry="4.5" fill="#8828b0" transform="rotate(20 73 84)" />
        <ellipse cx="66" cy="87" rx="5"   ry="4"   fill="#ecd8fa" opacity="0.6" />

        {/* Legs */}
        <path d="M30 122 Q28 134 26 144 Q24 147 20 147" stroke="#7820b8" strokeWidth="13" fill="none" strokeLinecap="round"
          style={{ transformOrigin: '30px 122px', animation: running ? 'charLegFront 0.3s infinite alternate' : 'none' }} />
        <path d="M56 122 Q58 134 60 144 Q62 147 66 147" stroke="#6010a0" strokeWidth="13" fill="none" strokeLinecap="round"
          style={{ transformOrigin: '56px 122px', animation: running ? 'charLegBack 0.3s infinite alternate' : 'none' }} />
        <path d="M12 144 Q8 148 20 148 Q28 148 30 144" fill="#7820b8" />
        <path d="M58 144 Q60 148 70 148 Q78 148 74 144" fill="#6010a0" />

        {/* Body */}
        <path d="M18 120 Q12 100 16 82 Q20 66 43 64 Q66 62 70 80 Q74 98 68 120 Q60 130 43 130 Q26 130 18 120 Z" fill="url(#cat_body)" />
        <path d="M28 118 Q26 102 28 88 Q32 76 43 74 Q54 72 58 84 Q62 98 60 114 Q56 122 43 124 Q30 122 28 118 Z" fill="#ecd8fa" opacity="0.6" />

        {/* Head */}
        <path d="M16 44 Q14 26 26 18 Q34 12 43 12 Q52 12 60 18 Q72 26 70 44 Q68 58 60 66 Q52 72 43 72 Q34 72 26 66 Q18 58 16 44 Z" fill="url(#cat_body)" />
        {/* Ears */}
        <path d="M22 28 Q14 6 22 4 Q30 2 32 20 Z" fill="#5810a0" />
        <path d="M22 28 Q16 10 22 8 Q28 6 30 22 Z" fill="#ddc0f0" />
        <path d="M64 28 Q72 6 64 4 Q56 2 54 20 Z" fill="#5810a0" />
        <path d="M64 28 Q70 10 64 8 Q58 6 56 22 Z" fill="#ddc0f0" />

        {/* Face */}
        <path d="M28 52 Q28 40 43 38 Q58 40 58 52 Q58 64 43 66 Q28 64 28 52 Z" fill="url(#cat_face)" />
        {/* Slit pupils */}
        <ellipse cx="34" cy="47" rx="5.5" ry="6"   fill="#140820" />
        <ellipse cx="52" cy="47" rx="5.5" ry="6"   fill="#140820" />
        <ellipse cx="34" cy="47" rx="1.8" ry="5.5" fill="#200c30" />
        <ellipse cx="52" cy="47" rx="1.8" ry="5.5" fill="#200c30" />
        <circle cx="35.8" cy="44.5" r="2"  fill="white" opacity="0.9" />
        <circle cx="53.8" cy="44.5" r="2"  fill="white" opacity="0.9" />
        {/* Nose */}
        <path d="M43 53 L40 56 L46 56 Z" fill="#ff88bb" />
        {/* Whiskers */}
        <line x1="28" y1="55" x2="10" y2="53" stroke="#9060d0" strokeWidth="0.9" opacity="0.75" />
        <line x1="28" y1="58" x2="10" y2="60" stroke="#9060d0" strokeWidth="0.9" opacity="0.75" />
        <line x1="58" y1="55" x2="76" y2="53" stroke="#9060d0" strokeWidth="0.9" opacity="0.75" />
        <line x1="58" y1="58" x2="76" y2="60" stroke="#9060d0" strokeWidth="0.9" opacity="0.75" />
        {/* Smug mouth */}
        <path d="M38 59 Q43 57 48 59" stroke="#8030b8" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/* ─────────────────────────────── RABBIT ─────────────────────────────── */
/* 엄청 긴 귀, 작은 둥근 몸, 양팔 벌려 균형 잡는 폴짝 */
function RabbitSVG({ running }: { running: boolean }) {
  return (
    <svg width="76" height="158" viewBox="0 0 76 158" fill="none" style={{ filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.28))' }}>
      <defs>
        <radialGradient id="rab_body" cx="38%" cy="30%" r="62%">
          <stop offset="0%" stopColor="#f878b8" /><stop offset="100%" stopColor="#aa2068" />
        </radialGradient>
        <radialGradient id="rab_face" cx="50%" cy="42%" r="55%">
          <stop offset="0%" stopColor="#fce4ec" /><stop offset="100%" stopColor="#f8b8d0" />
        </radialGradient>
      </defs>
      <g style={{ animation: running ? 'charHop 0.5s ease-in-out infinite' : 'charHop 1.6s ease-in-out infinite' }}>
        {/* Long ears */}
        <g style={{ transformOrigin: '30px 62px', animation: 'charEarWig 3.2s ease-in-out infinite' }}>
          <path d="M30 62 Q24 44 22 28 Q20 12 26 8 Q32 4 36 20 Q40 36 36 54 Z" fill="#d03080" />
          <path d="M30 62 Q25 46 23 30 Q21 16 26 12 Q31 8 34 22 Q37 36 34 54 Z" fill="#fce4ec" opacity="0.9" />
        </g>
        <g style={{ transformOrigin: '48px 62px', animation: 'charEarWig 3.2s ease-in-out infinite', animationDelay: '0.5s' }}>
          <path d="M48 62 Q52 44 54 28 Q56 12 50 8 Q44 4 40 20 Q36 36 40 54 Z" fill="#d03080" />
          <path d="M48 62 Q51 46 53 30 Q55 16 50 12 Q45 8 42 22 Q39 36 42 54 Z" fill="#fce4ec" opacity="0.9" />
        </g>

        {/* Arms out for balance */}
        <path d="M18 94 Q6 84 2 74" stroke="#c02870" strokeWidth="11" fill="none" strokeLinecap="round" />
        <path d="M18 94 Q6 84 2 74" stroke="#e060a0" strokeWidth="7"  fill="none" strokeLinecap="round" />
        <circle cx="2" cy="72" r="8.5" fill="#e060a0" />
        <ellipse cx="-4" cy="67" rx="3.5" ry="5"   fill="#e060a0" transform="rotate(-30 -4 67)" />
        <ellipse cx="2"  cy="64" rx="3.5" ry="5"   fill="#e060a0" transform="rotate(-10 2 64)" />
        <ellipse cx="8"  cy="66" rx="3.5" ry="4.5" fill="#e060a0" transform="rotate(10 8 66)" />
        <ellipse cx="2"  cy="72" rx="5"   ry="3.5" fill="#fce4ec" opacity="0.7" />

        <path d="M58 94 Q70 84 74 74" stroke="#aa2068" strokeWidth="11" fill="none" strokeLinecap="round" />
        <path d="M58 94 Q70 84 74 74" stroke="#d05090" strokeWidth="7"  fill="none" strokeLinecap="round" />
        <circle cx="74" cy="72" r="8.5" fill="#d05090" />
        <ellipse cx="68" cy="67" rx="3.5" ry="5"   fill="#d05090" transform="rotate(-10 68 67)" />
        <ellipse cx="74" cy="64" rx="3.5" ry="5"   fill="#d05090" transform="rotate(10 74 64)" />
        <ellipse cx="80" cy="67" rx="3.5" ry="4.5" fill="#d05090" transform="rotate(30 80 67)" />
        <ellipse cx="74" cy="72" rx="5"   ry="3.5" fill="#fce4ec" opacity="0.7" />

        {/* Legs */}
        <path d="M28 128 Q22 140 18 152 Q16 155 10 155" stroke="#c02870" strokeWidth="13" fill="none" strokeLinecap="round"
          style={{ transformOrigin: '28px 128px', animation: running ? 'charLegFront 0.3s infinite alternate' : 'none' }} />
        <path d="M48 128 Q54 140 58 152 Q60 155 66 155" stroke="#aa2068" strokeWidth="13" fill="none" strokeLinecap="round"
          style={{ transformOrigin: '48px 128px', animation: running ? 'charLegBack 0.3s infinite alternate' : 'none' }} />
        <path d="M2 153 Q-4 157 10 158 Q22 158 22 153" fill="#c02870" />
        <path d="M56 153 Q58 158 70 158 Q80 158 74 153" fill="#aa2068" />

        {/* Fluffy tail */}
        <circle cx="60" cy="118" r="9" fill="#fce4ec" />
        <circle cx="60" cy="118" r="6" fill="white" opacity="0.8" />

        {/* Body */}
        <path d="M16 126 Q10 106 14 88 Q18 72 38 70 Q58 68 62 86 Q66 104 60 126 Q52 138 38 138 Q24 138 16 126 Z" fill="url(#rab_body)" />
        <path d="M24 124 Q20 106 22 92 Q26 78 38 76 Q50 74 54 88 Q58 102 56 120 Q52 130 38 132 Q24 130 24 124 Z" fill="#fce4ec" opacity="0.68" />

        {/* Head */}
        <path d="M18 68 Q16 52 26 44 Q32 38 38 38 Q44 38 50 44 Q60 52 58 68 Q56 80 48 86 Q42 90 38 90 Q34 90 28 86 Q20 80 18 68 Z" fill="url(#rab_body)" />
        <path d="M24 72 Q24 62 38 60 Q52 62 52 72 Q52 82 38 84 Q24 82 24 72 Z" fill="url(#rab_face)" />

        {/* Eyes */}
        <circle cx="32" cy="66" r="6"   fill="#180808" />
        <circle cx="44" cy="66" r="6"   fill="#180808" />
        <circle cx="33.8" cy="63.5" r="2.6" fill="white" opacity="0.95" />
        <circle cx="45.8" cy="63.5" r="2.6" fill="white" opacity="0.95" />

        {/* Nose */}
        <ellipse cx="38" cy="72" rx="3" ry="2.2" fill="#ff5599" />
        <path d="M38 71 L38 74" stroke="#cc2266" strokeWidth="1" />
        {/* Mouth */}
        <path d="M34 75 Q38 79 42 75" stroke="#bb2060" strokeWidth="1.3" fill="none" strokeLinecap="round" />

        {/* Blush */}
        <ellipse cx="24" cy="71" rx="5.5" ry="3.2" fill="#ff3380" opacity="0.22" />
        <ellipse cx="52" cy="71" rx="5.5" ry="3.2" fill="#ff3380" opacity="0.22" />
      </g>
    </svg>
  );
}

/* ─────────────────────────────── BEAR ─────────────────────────────── */
/* 넓고 육중한 실루엣, 큰 발 발톱, 한팔 흔들기 */
function BearSVG({ running }: { running: boolean }) {
  return (
    <svg width="106" height="138" viewBox="0 0 106 138" fill="none" style={{ filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.28))' }}>
      <defs>
        <radialGradient id="bear_body" cx="38%" cy="28%" r="64%">
          <stop offset="0%" stopColor="#b09080" /><stop offset="100%" stopColor="#583028" />
        </radialGradient>
        <radialGradient id="bear_muz" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#dccbc0" /><stop offset="100%" stopColor="#b8a090" />
        </radialGradient>
      </defs>
      <g style={{ animation: running ? 'charBob 0.4s ease-in-out infinite' : 'charBreathe 2.8s ease-in-out infinite' }}>
        {/* Left arm — raised & waving */}
        <g style={{ transformOrigin: '76px 74px', animation: running ? 'charArmWave 0.3s ease-in-out infinite' : 'charArmWave 1.5s ease-in-out infinite' }}>
          <path d="M76 74 Q90 58 92 42" stroke="#6a4038" strokeWidth="18" fill="none" strokeLinecap="round" />
          <path d="M76 74 Q90 58 92 42" stroke="#8d6e63" strokeWidth="12" fill="none" strokeLinecap="round" />
          <circle cx="92" cy="38" r="13" fill="#8d6e63" />
          <ellipse cx="82" cy="30" rx="5.5" ry="7" fill="#8d6e63" transform="rotate(-25 82 30)" />
          <ellipse cx="91" cy="26" rx="5"   ry="7" fill="#8d6e63" transform="rotate(-5 91 26)" />
          <ellipse cx="100" cy="28" rx="5"  ry="7" fill="#8d6e63" transform="rotate(18 100 28)" />
          <ellipse cx="92" cy="38" rx="8" ry="6" fill="#d7ccc8" opacity="0.6" />
          <line x1="82"  y1="30" x2="78"  y2="23" stroke="#5a3028" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="91"  y1="26" x2="91"  y2="19" stroke="#5a3028" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="100" y1="28" x2="104" y2="22" stroke="#5a3028" strokeWidth="1.2" strokeLinecap="round" />
        </g>

        {/* Right arm — on hip */}
        <path d="M30 74 Q16 80 14 90" stroke="#6a4038" strokeWidth="18" fill="none" strokeLinecap="round" />
        <path d="M30 74 Q16 80 14 90" stroke="#8d6e63" strokeWidth="12" fill="none" strokeLinecap="round" />
        <circle cx="14" cy="93" r="12" fill="#8d6e63" />
        <ellipse cx="6"  cy="87" rx="5.5" ry="7" fill="#8d6e63" transform="rotate(-20 6 87)" />
        <ellipse cx="14" cy="84" rx="5.5" ry="7" fill="#8d6e63" />
        <ellipse cx="22" cy="87" rx="5"   ry="7" fill="#8d6e63" transform="rotate(20 22 87)" />
        <ellipse cx="14" cy="93" rx="7.5" ry="5.5" fill="#d7ccc8" opacity="0.6" />
        <line x1="6"  y1="87" x2="2"  y2="80" stroke="#5a3028" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="14" y1="84" x2="14" y2="77" stroke="#5a3028" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="22" y1="87" x2="26" y2="80" stroke="#5a3028" strokeWidth="1.2" strokeLinecap="round" />

        {/* Legs */}
        <path d="M36 116 Q34 126 32 134 Q30 137 24 137" stroke="#6a4038" strokeWidth="16" fill="none" strokeLinecap="round"
          style={{ transformOrigin: '36px 116px', animation: running ? 'charLegFront 0.3s infinite alternate' : 'none' }} />
        <path d="M70 116 Q72 126 74 134 Q76 137 82 137" stroke="#503028" strokeWidth="16" fill="none" strokeLinecap="round"
          style={{ transformOrigin: '70px 116px', animation: running ? 'charLegBack 0.3s infinite alternate' : 'none' }} />
        <path d="M13 135 Q8 138 24 138 Q36 138 36 134" fill="#6a4038" />
        <path d="M72 134 Q74 138 86 138 Q96 138 90 134" fill="#503028" />

        {/* Wide body */}
        <path d="M14 112 Q6 92 10 72 Q14 54 53 52 Q92 50 96 70 Q100 90 94 112 Q84 126 53 128 Q22 126 14 112 Z" fill="url(#bear_body)" />
        <path d="M26 110 Q20 94 22 76 Q26 60 53 58 Q80 56 84 72 Q88 88 84 108 Q78 120 53 122 Q28 120 26 110 Z" fill="#d7ccc8" opacity="0.65" />

        {/* Neck */}
        <path d="M40 52 Q38 44 40 38 Q43 34 53 34 Q63 34 66 38 Q68 44 66 52" fill="#8d6e63" />

        {/* Wide head */}
        <path d="M14 36 Q10 16 26 8 Q36 2 53 2 Q70 2 80 8 Q96 16 92 36 Q88 52 76 60 Q64 68 53 68 Q42 68 30 60 Q18 52 14 36 Z" fill="url(#bear_body)" />

        {/* Round ears */}
        <circle cx="20" cy="14" r="14" fill="#6a4038" />
        <circle cx="86" cy="14" r="14" fill="#6a4038" />
        <circle cx="20" cy="14" r="9"  fill="#c8a898" />
        <circle cx="86" cy="14" r="9"  fill="#c8a898" />

        {/* Muzzle */}
        <path d="M32 50 Q32 38 53 36 Q74 38 74 50 Q74 62 53 64 Q32 62 32 50 Z" fill="url(#bear_muz)" />

        {/* Eyes */}
        <circle cx="40" cy="32" r="6.5" fill="#150808" />
        <circle cx="66" cy="32" r="6.5" fill="#150808" />
        <circle cx="42.2" cy="29.5" r="2.8" fill="white" opacity="0.92" />
        <circle cx="68.2" cy="29.5" r="2.8" fill="white" opacity="0.92" />

        {/* Nose */}
        <ellipse cx="53" cy="44" rx="7"   ry="5.5" fill="#2a1010" />
        <ellipse cx="50.5" cy="42" rx="2.8" ry="2" fill="#6a3030" opacity="0.6" />

        {/* Mouth */}
        <path d="M45 50 Q53 56 61 50" stroke="#3a1818" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <line x1="53" y1="48" x2="53" y2="50" stroke="#3a1818" strokeWidth="1.3" />
      </g>
    </svg>
  );
}

/* ─────────────────────────────── PENGUIN ─────────────────────────────── */
/* 달걀형 몸통, 목 없음, 뒤뚱 애니, 나비넥타이, 지느러미 팔 */
function PenguinSVG({ running }: { running: boolean }) {
  return (
    <svg width="88" height="118" viewBox="0 0 88 118" fill="none" style={{ filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.28))' }}>
      <defs>
        <radialGradient id="pen_body" cx="38%" cy="25%" r="66%">
          <stop offset="0%" stopColor="#4aa8fc" /><stop offset="100%" stopColor="#0c40a0" />
        </radialGradient>
        <radialGradient id="pen_belly" cx="50%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#e8f4ff" /><stop offset="100%" stopColor="#bcd8f8" />
        </radialGradient>
      </defs>
      <g style={{ animation: running ? 'charWaddle 0.3s ease-in-out infinite' : 'charWaddle 1.3s ease-in-out infinite' }}>
        {/* Left flipper */}
        <path d="M16 62 Q2 54 -2 38 Q-4 28 2 26" stroke="#0c40a0" strokeWidth="14" fill="none" strokeLinecap="round"
          style={{ animation: running ? 'charWingFlap 0.3s infinite alternate' : 'none', transformOrigin: '16px 62px' }} />
        <path d="M16 62 Q2 54 -2 38 Q-4 28 2 26" stroke="#2060c8" strokeWidth="9" fill="none" strokeLinecap="round" />
        <path d="M2 26 Q-2 20 4 18 Q10 16 14 22 Q18 28 14 32 Z" fill="#2060c8" />

        {/* Right flipper */}
        <path d="M72 62 Q86 54 90 38 Q92 28 86 26" stroke="#0a3888" strokeWidth="14" fill="none" strokeLinecap="round"
          style={{ animation: running ? 'charWingFlap 0.3s infinite alternate' : 'none', transformOrigin: '72px 62px' }} />
        <path d="M72 62 Q86 54 90 38 Q92 28 86 26" stroke="#1848a8" strokeWidth="9" fill="none" strokeLinecap="round" />
        <path d="M86 26 Q90 20 84 18 Q78 16 74 22 Q70 28 74 32 Z" fill="#1848a8" />

        {/* Feet */}
        <path d="M24 110 Q14 116 28 117 Q40 118 42 112" fill="#ff8800" />
        <path d="M64 110 Q74 116 60 117 Q48 118 46 112" fill="#e07000" />
        <line x1="18" y1="114" x2="16" y2="118" stroke="#cc5500" strokeWidth="2" strokeLinecap="round" />
        <line x1="28" y1="116" x2="28" y2="118" stroke="#cc5500" strokeWidth="2" strokeLinecap="round" />
        <line x1="38" y1="114" x2="40" y2="118" stroke="#cc5500" strokeWidth="2" strokeLinecap="round" />
        <line x1="50" y1="114" x2="48" y2="118" stroke="#cc5500" strokeWidth="2" strokeLinecap="round" />
        <line x1="60" y1="116" x2="60" y2="118" stroke="#cc5500" strokeWidth="2" strokeLinecap="round" />
        <line x1="70" y1="114" x2="72" y2="118" stroke="#cc5500" strokeWidth="2" strokeLinecap="round" />

        {/* Egg body */}
        <path d="M12 80 Q8 60 12 42 Q18 22 44 20 Q70 18 76 40 Q82 60 78 80 Q72 100 44 106 Q16 104 12 80 Z" fill="url(#pen_body)" />
        <path d="M22 80 Q18 64 20 48 Q24 32 44 30 Q64 28 68 46 Q72 62 70 78 Q66 94 44 98 Q22 96 22 80 Z" fill="url(#pen_belly)" />

        {/* Head (no neck) */}
        <path d="M20 36 Q18 20 28 12 Q34 6 44 6 Q54 6 60 12 Q70 20 68 36 Q66 50 56 56 Q50 60 44 60 Q38 60 32 56 Q22 50 20 36 Z" fill="url(#pen_body)" />
        <path d="M26 38 Q26 26 44 24 Q62 26 62 38 Q62 52 44 54 Q26 52 26 38 Z" fill="url(#pen_belly)" />

        {/* Eyes */}
        <circle cx="36" cy="32" r="6"  fill="#050c18" />
        <circle cx="52" cy="32" r="6"  fill="#050c18" />
        <circle cx="37.8" cy="29.5" r="2.5" fill="white" opacity="0.95" />
        <circle cx="53.8" cy="29.5" r="2.5" fill="white" opacity="0.95" />

        {/* Beak */}
        <path d="M44 37 Q38 42 38 46 Q38 50 44 50 Q50 50 50 46 Q50 42 44 37 Z" fill="#ff8800" />
        <path d="M44 37 Q38 42 38 43 Q38 45 44 45 Q50 45 50 43 Q50 42 44 37 Z" fill="#ffaa00" opacity="0.7" />

        {/* Bowtie */}
        <path d="M34 68 Q44 72 54 68 Q44 76 34 68 Z" fill="#e83030" />
        <path d="M34 68 Q44 64 54 68 Q44 72 34 68 Z" fill="#c02020" />
        <circle cx="44" cy="68" r="4" fill="#d02828" />
        <circle cx="44" cy="68" r="2" fill="#e84040" />
      </g>
    </svg>
  );
}

/* ─────────────────────────────── DOG ─────────────────────────────── */
/* 축 늘어진 귀, 혀 내밀기, 한 발 들어 반갑게 인사 */
function DogSVG({ running }: { running: boolean }) {
  return (
    <svg width="92" height="142" viewBox="0 0 92 142" fill="none" style={{ filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.28))' }}>
      <defs>
        <radialGradient id="dog_body" cx="38%" cy="30%" r="62%">
          <stop offset="0%" stopColor="#ffcc60" /><stop offset="100%" stopColor="#c07800" />
        </radialGradient>
        <radialGradient id="dog_face" cx="50%" cy="42%" r="55%">
          <stop offset="0%" stopColor="#fffde0" /><stop offset="100%" stopColor="#fff0a0" />
        </radialGradient>
      </defs>
      <g style={{ animation: running ? 'charBob 0.4s ease-in-out infinite' : 'charBob 1.6s ease-in-out infinite', animationDelay: '0.6s' }}>
        {/* Wagging tail */}
        <g style={{ transformOrigin: '68px 94px', animation: running ? 'charTailWag 0.3s ease-in-out infinite' : 'charTailWag 0.9s ease-in-out infinite' }}>
          <path d="M68 94 Q84 78 80 60 Q78 50 72 52" stroke="#c07800" strokeWidth="12" fill="none" strokeLinecap="round" />
          <path d="M68 94 Q84 78 80 60 Q78 50 72 52" stroke="#e09820" strokeWidth="8"  fill="none" strokeLinecap="round" />
          <circle cx="72" cy="51" r="7" fill="#e09820" />
        </g>

        {/* Right paw raised — greeting */}
        <g style={{ transformOrigin: '68px 88px', animation: running ? 'charLegFront 0.3s infinite alternate' : 'charPawPat 1.2s ease-in-out infinite' }}>
          <path d="M68 88 Q80 76 82 60" stroke="#c07800" strokeWidth="13" fill="none" strokeLinecap="round" />
          <path d="M68 88 Q80 76 82 60" stroke="#e09820" strokeWidth="9"  fill="none" strokeLinecap="round" />
          <circle cx="82" cy="57" r="11" fill="#e09820" />
          <ellipse cx="74" cy="50" rx="4.5" ry="6" fill="#e09820" transform="rotate(-20 74 50)" />
          <ellipse cx="82" cy="47" rx="4.5" ry="6" fill="#e09820" transform="rotate(-2 82 47)" />
          <ellipse cx="90" cy="50" rx="4"   ry="5.5" fill="#e09820" transform="rotate(18 90 50)" />
          <ellipse cx="82" cy="57" rx="7" ry="5" fill="#fffde0" opacity="0.65" />
          <line x1="74" y1="50" x2="72" y2="44" stroke="#a06010" strokeWidth="1.1" strokeLinecap="round" />
          <line x1="82" y1="47" x2="82" y2="41" stroke="#a06010" strokeWidth="1.1" strokeLinecap="round" />
          <line x1="90" y1="50" x2="92" y2="44" stroke="#a06010" strokeWidth="1.1" strokeLinecap="round" />
        </g>

        {/* Left arm down */}
        <path d="M24 88 Q10 96 8 110" stroke="#c07800" strokeWidth="13" fill="none" strokeLinecap="round" />
        <path d="M24 88 Q10 96 8 110" stroke="#e09820" strokeWidth="9"  fill="none" strokeLinecap="round" />
        <circle cx="8" cy="113" r="10" fill="#e09820" />
        <ellipse cx="0"  cy="108" rx="4" ry="5.5" fill="#e09820" transform="rotate(-20 0 108)" />
        <ellipse cx="8"  cy="105" rx="4" ry="5.5" fill="#e09820" />
        <ellipse cx="16" cy="108" rx="4" ry="5.5" fill="#e09820" transform="rotate(20 16 108)" />
        <ellipse cx="8" cy="113" rx="6.5" ry="5" fill="#fffde0" opacity="0.65" />

        {/* Legs */}
        <path d="M30 120 Q28 130 26 138 Q24 141 18 141" stroke="#c07800" strokeWidth="13" fill="none" strokeLinecap="round"
          style={{ transformOrigin: '30px 120px', animation: running ? 'charLegFront 0.3s infinite alternate' : 'none' }} />
        <path d="M62 120 Q64 130 66 138 Q68 141 74 141" stroke="#a06000" strokeWidth="13" fill="none" strokeLinecap="round"
          style={{ transformOrigin: '62px 120px', animation: running ? 'charLegBack 0.3s infinite alternate' : 'none' }} />
        <path d="M8  139 Q4  142 18 142 Q28 142 30 138" fill="#c07800" />
        <path d="M64 138 Q66 142 78 142 Q86 142 80 138" fill="#a06000" />

        {/* Body */}
        <path d="M18 118 Q12 98 16 78 Q20 60 46 58 Q72 56 76 76 Q80 96 74 118 Q66 130 46 132 Q26 130 18 118 Z" fill="url(#dog_body)" />
        <path d="M28 116 Q22 98 24 82 Q28 66 46 64 Q64 62 68 78 Q72 94 68 112 Q62 124 46 126 Q30 124 28 116 Z" fill="#fffde0" opacity="0.62" />

        {/* Floppy ears hanging down */}
        <path d="M18 48 Q8 40 6 56 Q4 70 12 78 Q18 84 24 78 Q28 72 26 60 Q24 50 18 48 Z" fill="#e09020" />
        <path d="M18 48 Q12 42 10 56 Q8 68 14 76 Q18 80 22 76 Q24 70 22 60 Q20 52 18 48 Z" fill="#f0a830" opacity="0.7" />
        <path d="M74 48 Q84 40 86 56 Q88 70 80 78 Q74 84 68 78 Q64 72 66 60 Q68 50 74 48 Z" fill="#d08010" />
        <path d="M74 48 Q80 42 82 56 Q84 68 78 76 Q74 80 70 76 Q68 70 70 60 Q72 52 74 48 Z" fill="#e09820" opacity="0.7" />

        {/* Head */}
        <path d="M16 52 Q14 34 26 24 Q34 16 46 16 Q58 16 66 24 Q78 34 76 52 Q74 66 64 74 Q56 80 46 80 Q36 80 26 74 Q18 66 16 52 Z" fill="url(#dog_body)" />

        {/* Muzzle */}
        <path d="M28 62 Q28 50 46 48 Q64 50 64 62 Q64 74 46 76 Q28 74 28 62 Z" fill="url(#dog_face)" />

        {/* Eyes */}
        <circle cx="36" cy="46" r="6.5" fill="#240e00" />
        <circle cx="56" cy="46" r="6.5" fill="#240e00" />
        <circle cx="38"   cy="43.5" r="2.8" fill="white" opacity="0.95" />
        <circle cx="58"   cy="43.5" r="2.8" fill="white" opacity="0.95" />
        <circle cx="38.8" cy="48"   r="1.1" fill="white" opacity="0.45" />
        <circle cx="58.8" cy="48"   r="1.1" fill="white" opacity="0.45" />

        {/* Expressive brows */}
        <path d="M30 39 Q36 36 42 38" stroke="#b07010" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M50 38 Q56 36 62 39" stroke="#b07010" strokeWidth="1.8" fill="none" strokeLinecap="round" />

        {/* Nose */}
        <ellipse cx="46" cy="56" rx="6.5" ry="5" fill="#240e00" />
        <ellipse cx="43.5" cy="54" rx="2.6" ry="1.8" fill="#604020" opacity="0.6" />

        {/* Tongue */}
        <path d="M38 68 Q46 66 54 68 Q56 72 54 76 Q52 80 50 82 Q48 84 46 84 Q44 84 42 82 Q40 80 38 76 Q36 72 38 68 Z" fill="#ff6060" />
        <path d="M38 68 Q46 66 54 68 Q54 72 52 74 Q50 76 46 76 Q42 76 40 74 Q38 72 38 68 Z" fill="#ff9090" opacity="0.6" />
        <line x1="46" y1="67" x2="46" y2="83" stroke="#e04040" strokeWidth="1.4" />

        {/* Blush */}
        <ellipse cx="28" cy="62" rx="6" ry="3.5" fill="#ffaa44" opacity="0.25" />
        <ellipse cx="64" cy="62" rx="6" ry="3.5" fill="#ffaa44" opacity="0.25" />
      </g>
    </svg>
  );
}

/* ────────────────────────── COMPONENT MAP ────────────────────────── */
const CHARACTER_COMPONENTS: Record<CharacterId, FC<{ running: boolean }>> = {
  fox:     ({ running }) => <FoxSVG running={running} />,
  cat:     ({ running }) => <CatSVG running={running} />,
  rabbit:  ({ running }) => <RabbitSVG running={running} />,
  bear:    ({ running }) => <BearSVG running={running} />,
  penguin: ({ running }) => <PenguinSVG running={running} />,
  dog:     ({ running }) => <DogSVG running={running} />,
};

/* ────────────────────────── CharacterSprite ────────────────────────── */
export function CharacterSprite({
  character,
  size = 64,
  running = false,
  className,
  variant = 'default',
}: CharacterSpriteProps) {
  const Component = CHARACTER_COMPONENTS[character];

  const baseHeight =
    character === 'bear' ? 138
    : character === 'penguin' ? 118
    : character === 'rabbit' ? 158
    : character === 'dog' ? 142
    : character === 'fox' || character === 'cat' ? 148
    : 148;
  const scale = size / baseHeight;

  return (
    <div
      className={cn(
        'relative inline-block',
        variant === 'mascot' && [
          'rounded-full',
          'bg-gradient-to-b from-white/50 to-white/10',
          'p-0.5',
          'ring-[2.5px] ring-[#3d2917]',
          'shadow-[0_3px_0_#2d1f12]',
        ],
        className
      )}
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        width: size,
        height: size,
        overflow: 'visible',
      }}
    >
      <style>{KEYFRAMES}</style>
      <Component running={running} />
    </div>
  );
}

/* ────────────────────────── CharacterCard ────────────────────────── */
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
      type="button"
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
