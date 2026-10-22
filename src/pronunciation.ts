/** Context-specific editorial readings. Keep these separate from generated
 * Kuromoji suggestions so rebuilding the map cannot restore a known mistake.
 * 「開く」 also has legitimate ひらく uses; never replace it globally.
 */
export type ReadingToken = { text: string; reading?: string };
const openingContexts = [
  "ドアが",
  "窓が",
  "窓（　）",
  "図書館が",
  "夜遅くまで",
];
export const pronunciationCorrections = [
  ...openingContexts.flatMap((context) => [
    { context: context + "開く", surface: "開く", reading: "あく" },
    { context: context + "開き", surface: "開き", reading: "あき" },
    { context: context + "開い", surface: "開い", reading: "あい" },
  ]),
  { context: "開いている時間に図書館", surface: "開い", reading: "あい" },
];
function correctionSpans(text: string) {
  const spans: { start: number; end: number; reading: string }[] = [];
  for (const rule of pronunciationCorrections) {
    let from = 0,
      index: number;
    while ((index = text.indexOf(rule.context, from)) !== -1) {
      const start = index + rule.context.indexOf(rule.surface);
      spans.push({
        start,
        end: start + rule.surface.length,
        reading: rule.reading,
      });
      from = index + rule.context.length;
    }
  }
  return spans.sort((a, b) => a.start - b.start);
}
export function correctFurigana(
  text: string,
  tokens: ReadingToken[],
): ReadingToken[] {
  const spans = correctionSpans(text);
  let offset = 0;
  return tokens.map((token) => {
    const start = offset;
    offset += token.text.length;
    const correction = spans.find((s) => s.start === start && s.end === offset);
    return correction ? { ...token, reading: correction.reading } : token;
  });
}
export function pronunciationText(text: string) {
  let result = text;
  for (const span of correctionSpans(text).reverse())
    result =
      result.slice(0, span.start) + span.reading + result.slice(span.end);
  return result;
}
