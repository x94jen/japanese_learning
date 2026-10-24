import { readFileSync, writeFileSync } from "node:fs";
import { questions, vocab } from "../src/content";
const authored = new Map<string, string[]>();
for (const line of readFileSync(
  "scripts/content/question-option-notes.tsv",
  "utf8",
).split("\n")) {
  if (!line || line.startsWith("#")) continue;
  const [id, ...notes] = line.split("|");
  if (
    authored.has(id) ||
    notes.length !== 3 ||
    notes.some((n) => n.trim().length < 12)
  )
    throw Error(`Invalid authored notes: ${id}`);
  authored.set(id, notes);
}
const output: Record<string, { options: string[]; explanations: string[] }> =
  {};
for (const q of questions.filter((q) => !q.id.startsWith("qverb-"))) {
  let notes = authored.get(q.id);
  if (!notes) {
    if (!q.id.startsWith("qn3-") || q.type !== "漢字讀音")
      throw Error(`Missing notes: ${q.id}`);
    const target = vocab.find((v) => q.related.includes(v.id));
    if (!target) throw Error(`Missing target word: ${q.id}`);
    notes = q.options
      .filter((_, i) => i !== q.answer)
      .map((option) => {
        const words = vocab.filter((v) => v.reading === option);
        if (!words.length) throw Error(`Unmapped reading: ${q.id} ${option}`);
        return `「${option}」是${words
          .slice(0, 3)
          .map((v) => `「${v.word}」（${v.meaning}）`)
          .join(
            "、",
          )}的讀音，不是本題「${target.word}」的讀音。${target.word}應讀「${target.reading}」，不能因為選項本身是日文讀音就選它。`;
      });
  }
  let wrong = 0;
  output[q.id] = {
    options: q.options,
    explanations: q.options.map((_, i) =>
      i === q.answer ? q.explanation : notes![wrong++],
    ),
  };
}
if (authored.size !== 322 || Object.keys(output).length !== 370)
  throw Error(
    `Unexpected coverage: ${authored.size}, ${Object.keys(output).length}`,
  );
for (const id of authored.keys())
  if (!output[id]) throw Error(`Unused notes: ${id}`);
writeFileSync(
  "src/option-explanations.json",
  JSON.stringify(output, null, 2) + "\n",
);
console.log(
  `Compiled four-option explanations for ${Object.keys(output).length} content questions; verb questions use their actual conjugation table.`,
);
