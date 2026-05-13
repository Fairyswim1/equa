'use client';

import katex from 'katex';
import 'katex/dist/katex.min.css';
import { texifyMathPlain } from '@/lib/math/texify';
import { cn } from '@/lib/utils';

function renderTex(tex: string): string {
  try {
    return katex.renderToString(tex, { throwOnError: false, displayMode: false });
  } catch {
    return tex;
  }
}

export function MathText({ children, className, as: Tag = 'span' }: { children: string; className?: string; as?: 'span' | 'div' | 'p' }) {
  const raw = texifyMathPlain(children);
  const parts = raw.split(/(\$[^$]*\$)/g);
  return (
    <Tag className={cn('[&_.katex]:text-[1em]', className)}>
      {parts.map((part, i) => {
        if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
          const tex = part.slice(1, -1);
          return <span key={i} dangerouslySetInnerHTML={{ __html: renderTex(tex) }} />;
        }
        return <span key={i}>{part}</span>;
      })}
    </Tag>
  );
}
