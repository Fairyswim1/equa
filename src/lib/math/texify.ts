/** 한글 문장 속 Unicode 수식을 KaTeX 조각($...$)으로 감싼 문자열로 변환 (이미 $...$가 있으면 구간 밖만 처리) */
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

function texifyPlainSegment(t: string): string {
  if (!t) return t;
  let s = t;
  s = s.replace(/\(([^)]+)\)²/g, (_, inner) => `$(${inner})^2$`);
  s = s.replace(/√\(([^)]+)\)/g, (_, a) => `$\\sqrt{${a}}$`);
  s = s.replace(/√(\d+)/g, (_, a) => `$\\sqrt{${a}}$`);
  s = s.replace(/i²⁰²⁵/g, '$i^{2025}$');
  s = s.replace(/\bi⁴\b/g, '$i^4$');
  s = s.replace(/\bi³\b/g, '$i^3$');
  s = s.replace(/\bi²\b/g, '$i^2$');
  s = s.replace(/\bi¹⁰\b/g, '$i^{10}$');
  s = s.replace(/\biⁿ\b/g, '$i^n$');
  s = s.replace(/\bα\b/g, '$\\alpha$');
  s = s.replace(/\bβ\b/g, '$\\beta$');
  s = s.replace(/\bω\b/g, '$\\omega$');
  s = s.replace(/z̄/g, '$\\bar{z}$');
  s = s.replace(/\b([a-z])²\b/gi, (_, a) => `$${a}^2$`);
  s = s.replace(/\b([a-z])³\b/gi, (_, a) => `$${a}^3$`);
  s = s.replace(/\b([a-z])⁴\b/gi, (_, a) => `$${a}^4$`);
  s = s.replace(/±/g, '$\\pm$');
  return s;
}

export function texifyQuestionFields(text: string, options?: string[]): { text: string; options?: string[] } {
  return {
    text: texifyMathPlain(text),
    options: options?.map(texifyMathPlain),
  };
}
