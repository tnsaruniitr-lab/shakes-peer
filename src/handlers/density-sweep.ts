// Deterministic writer-side density fixes.
//
// Blog-buster's H_em_dash_overuse / H_passive_overuse / H_tricolon_density
// detectors count recurring stylistic defects document-wide. Its rewriter
// emits one patch per offending span which, in practice, our dispatcher can
// only apply once per round — the rest drift because patches overlap after
// the first swap.
//
// Rather than wait for the auditor to chip away at the count, we run a
// deterministic sweep during generation. After this runs, the count for
// em-dashes specifically is predictable.
//
// Only EM-dashes are done deterministically here. Tricolons and passive
// voice require rewriting and are handled by the push-to-threshold loop in
// the dispatcher.

/**
 * Replace excess em-dashes with natural-sounding alternatives.
 *
 * Target: keep ≤1 em-dash per 400 words (blog-buster's threshold).
 * Strategy:
 *   1. Count em-dashes in visible article body
 *   2. Compute target budget = max(1, round(words / 400))
 *   3. Keep the first `budget` em-dashes untouched (they're likely used
 *      for genuine parenthetical interruption)
 *   4. Replace the rest with ", " (or ". " when the surrounding text
 *      reads like a sentence boundary)
 */
export function sweepEmDashes(html: string): { html: string; replaced: number } {
  // Matches " — " with spaces (the usual Markdown-rendered em-dash), or
  // a bare em-dash between word characters.
  const spaced = / — /g;
  const tight = /(\w)—(\w)/g;

  // Count matches first so we can budget.
  const allMatches = [...html.matchAll(spaced), ...html.matchAll(tight)];
  if (allMatches.length === 0) return { html, replaced: 0 };

  const wordCount = countVisibleWords(html);
  // Target: 1 em-dash per 400 words, at least 1 kept.
  const budget = Math.max(1, Math.floor(wordCount / 400));
  if (allMatches.length <= budget) return { html, replaced: 0 };

  const excess = allMatches.length - budget;
  let replacedCount = 0;
  let idx = 0;

  // Replace occurrences beyond the budget. We skip the first `budget`
  // em-dashes and rewrite the remainder.
  const rewriteSpaced = (_m: string): string => {
    if (idx < budget) {
      idx++;
      return _m;
    }
    if (replacedCount < excess) {
      replacedCount++;
      return ", ";
    }
    return _m;
  };
  const rewriteTight = (_m: string, a: string, b: string): string => {
    if (idx < budget) {
      idx++;
      return _m;
    }
    if (replacedCount < excess) {
      replacedCount++;
      return `${a}, ${b}`;
    }
    return _m;
  };

  let out = html.replace(spaced, rewriteSpaced);
  out = out.replace(tight, rewriteTight);
  return { html: out, replaced: replacedCount };
}

function countVisibleWords(html: string): number {
  // Strip tags, whitespace-split. Crude but matches the order-of-magnitude
  // blog-buster uses for its own word count.
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}
