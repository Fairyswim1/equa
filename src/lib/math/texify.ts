/** 한글 문장 속 수식 조각을 KaTeX 인라인($...$)으로 통일합니다. 이미 $...$가 있으면 그 밖만 처리합니다. */

export function texifyMathPlain(s: string): string {
  if (!s) return s;
  if (s.includes('$')) {
    return s
      .split(/(\$[^$]+\$)/g)
      .map((part) => (part.startsWith('$') && part.endsWith('$') && part.length > 2 ? part : texifyPlainSegment(part)))
      .join('');
  }
  return texifyPlainSegment(s);
}

function u2t(chunk: string): string {
  return chunk
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/⁴/g, '^4')
    .replace(/ⁿ/g, '^n')
    .replace(/⁰/g, '^0')
    .replace(/¹/g, '^1')
    .replace(/·/g, '\\cdot ');
}

function wrap(tex: string): string {
  return `$${tex}$`;
}

function texifyPlainSegment(t: string): string {
  if (!t) return t;
  let s = t;

  // 근의 공식 (통째로)
  s = s.replace(/\(-b±√\(b²-4ac\)\)\/\(2a\)/g, wrap(String.raw`\frac{-b\pm\sqrt{b^2-4ac}}{2a}`));

  s = s.replace(/z·z̄/g, wrap(String.raw`z\cdot\bar{z}`));

  // 판별식·근호 조각
  s = s.replace(/\bb²-4ac\b/g, wrap('b^2-4ac'));
  s = s.replace(/√\(b²-4ac\)/g, wrap(String.raw`\sqrt{b^2-4ac}`));

  // 이차방정식 …x²…=0
  s = s.replace(/([a-z]?\d*)x²([^=]+)=0/gi, (_, coef: string, rest: string) => {
    const c = coef || '';
    return wrap(`${c}x^2${u2t(rest)}=0`);
  });

  // x(x-3)=0
  s = s.replace(/\bx\(([^)]+)\)=0\b/g, (_, inner: string) => wrap(`x(${u2t(inner)})=0`));

  // (x-2)²=0
  s = s.replace(/\(([^)]+)\)²=0/g, (_, inner: string) => wrap(`(${u2t(inner)})^2=0`));

  // (분자)/(분모) — 분모가 괄호
  s = s.replace(/\(([^)\n]+)\)\s*\/\s*\(([^)\n]+)\)/g, (_, a: string, b: string) =>
    wrap(String.raw`\frac{${u2t(a)}}{${u2t(b)}}`)
  );

  // (분자)/숫자 — 한글·긴 문장 제외
  s = s.replace(/\(([^)]+)\)\/(\d+)/g, (full, num: string, den: string) => {
    if (/[가-힣]/.test(num) || num.length > 36) return full;
    return wrap(String.raw`\frac{${u2t(num)}}{${den}}`);
  });

  // a/b (정수 분수)
  s = s.replace(/\b(\d+)\/(\d+)\b/g, (_, n: string, d: string) => wrap(String.raw`\frac{${n}}{${d}}`));

  // 복소수 괄호 (정수 ± 정수 i)
  s = s.replace(/\((-?\d+)\+(\d*)i\)/g, (_, re: string, im: string) => {
    const imag = im === '' ? 'i' : `${im}i`;
    return wrap(`(${re}+${imag})`);
  });
  s = s.replace(/\((-?\d+)-(\d*)i\)/g, (_, re: string, im: string) => {
    const imag = im === '' ? 'i' : `${im}i`;
    return wrap(`(${re}-${imag})`);
  });

  // (-1±√3·i)/2 전체
  s = s.replace(/\((-?\d+±√\d+·i)\)\/(\d+)/g, (_, p: string, d: string) =>
    wrap(String.raw`\frac{${u2t(p)}}{${d}}`)
  );

  // 1±2i, ±2i, ±√2·i
  s = s.replace(/\((-?\d+)±√(\d+)·i\)\/(\d+)/g, (_, a: string, r: string, d: string) =>
    wrap(String.raw`\frac{${a}\pm\sqrt{${r}}\cdot i}{${d}}`)
  );
  s = s.replace(/(\d+)±(\d+)i\b/g, (_, a: string, b: string) => wrap(String.raw`${a}\pm ${b}i`));
  s = s.replace(/\b±√(\d+)·i\b/g, (_, r: string) => wrap(String.raw`\pm\sqrt{${r}}\cdot i`));
  s = s.replace(/\b±(\d+)i\b/g, (_, a: string) => wrap(String.raw`\pm ${a}i`));
  s = s.replace(/\b±(\d+)\b(?!i)/g, (_, a: string) => wrap(String.raw`\pm ${a}`));

  // (expr)² — 복소·다항
  s = s.replace(/\(([^)]+)\)²/g, (_, inner: string) => {
    if (/[가-힣]/.test(inner)) return `(${inner})²`;
    return wrap(`(${u2t(inner)})^2`);
  });

  // 제곱근
  s = s.replace(/√\(([^)]+)\)/g, (_, inner: string) => {
    if (/[가-힣]/.test(inner)) return `√(${inner})`;
    return wrap(String.raw`\sqrt{${u2t(inner)}}`);
  });
  s = s.replace(/√(-?\d+)/g, (_, n: string) => wrap(String.raw`\sqrt{${n}}`));

  // D>0 등
  s = s.replace(/\bD(>|=|<)0\b/g, (_, op: string) => wrap(`D${op}0`));

  // 근과 계수 관계 흔한 식
  s = s.replace(/\bα\+β\b/g, wrap(String.raw`\alpha+\beta`));
  s = s.replace(/\bαβ\b/g, wrap(String.raw`\alpha\beta`));
  s = s.replace(/\bα²\+β²\b/g, wrap(String.raw`\alpha^2+\beta^2`));
  s = s.replace(/\b1\/α\+1\/β\b/g, wrap(String.raw`\frac{1}{\alpha}+\frac{1}{\beta}`));

  s = s.replace(/\bi²⁰²⁵\b/g, wrap('i^{2025}'));
  s = s.replace(/\bi⁴\b/g, wrap('i^4'));
  s = s.replace(/\bi³\b/g, wrap('i^3'));
  s = s.replace(/\bi²\b/g, wrap('i^2'));
  s = s.replace(/\bi¹⁰\b/g, wrap('i^{10}'));
  s = s.replace(/\biⁿ\b/g, wrap('i^n'));
  s = s.replace(/\bα\b/g, wrap(String.raw`\alpha`));
  s = s.replace(/\bβ\b/g, wrap(String.raw`\beta`));
  s = s.replace(/\bω\b/g, wrap(String.raw`\omega`));
  s = s.replace(/z̄/g, wrap(String.raw`\bar{z}`));
  s = s.replace(/\b([a-z])²\b/gi, (_, a: string) => wrap(`${a}^2`));
  s = s.replace(/\b([a-z])³\b/gi, (_, a: string) => wrap(`${a}^3`));
  s = s.replace(/\b([a-z])⁴\b/gi, (_, a: string) => wrap(`${a}^4`));
  s = s.replace(/\bx²\b/g, wrap('x^2'));

  s = s.replace(/±/g, '$\\pm$');
  return s.replace(/\$\$+/g, '$');
}

export function texifyQuestionFields(text: string, options?: string[]): { text: string; options?: string[] } {
  return {
    text: texifyMathPlain(text),
    options: options?.map(texifyMathPlain),
  };
}

/** 세션에 넣기 직전: 정답·해설까지 동일 규칙 적용 */
export function texifyQuestionRecord<T extends { text: string; options?: string[]; answer: string; explanation?: string }>(
  q: T
): T {
  const { text, options } = texifyQuestionFields(q.text, q.options);
  return {
    ...q,
    text,
    options,
    answer: texifyMathPlain(String(q.answer)),
    explanation: q.explanation ? texifyMathPlain(q.explanation) : undefined,
  };
}
