// Generates editable reading suggestions using Kuromoji/IPADIC; not a claim of human proofreading.
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import {
  vocab,
  grammar,
  foundations,
  questions,
  units,
  n3UnitIds,
  supplementalLessons,
} from "../src/content";
import { verbForms, derivedPatterns } from "../src/basics-content";
import { correctFurigana } from "../src/pronunciation";
import { grammarExampleTexts } from "../src/grammar-guides";
const require = createRequire(import.meta.url);
const kuromoji = require("kuromoji");
const strings = new Set<string>();
function collect(v: unknown) {
  if (typeof v === "string" && /[一-龯々]/.test(v)) strings.add(v);
  else if (Array.isArray(v)) v.forEach(collect);
  else if (v && typeof v === "object") Object.values(v).forEach(collect);
}
// Only Japanese text displayed with furigana needs tokenization. Avoid producing
// Japanese readings for Traditional Chinese explanations and source metadata.
collect(grammarExampleTexts());
collect(verbForms.map((f) => f.example));
collect(derivedPatterns.map((p) => p.example));
collect(vocab.map((v) => [v.word, v.sentence, v.collocation]));
collect(
  grammar.filter((g) => n3UnitIds.has(g.unit)).map((g) => [g.title, g.example]),
);
collect(foundations.map((f) => f.example));
collect(questions.map((q) => [q.prompt, q.options, q.passage, q.audio]));
collect(supplementalLessons.flatMap((l) => l.examples.map((e) => e.ja)));
kuromoji
  .builder({ dicPath: "node_modules/kuromoji/dict" })
  .build((error: Error, t: any) => {
    if (error) throw error;
    const map: Record<string, unknown> = {};
    for (const s of strings) {
      map[s] = correctFurigana(
        s,
        t.tokenize(s).map((p: any) => ({
          text: p.surface_form,
          ...(/[一-龯々]/.test(p.surface_form) && p.reading
            ? {
                reading: p.reading.replace(/[ァ-ヶ]/g, (c: string) =>
                  String.fromCharCode(c.charCodeAt(0) - 0x60),
                ),
              }
            : {}),
        })),
      );
    }
    for (const v of vocab) map[v.word] = [{ text: v.word, reading: v.reading }];
    writeFileSync("src/readings.json", JSON.stringify(map));
    console.log(`Generated reading suggestions for ${strings.size} strings.`);
  });
