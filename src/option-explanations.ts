import authored from "./option-explanations.json";
import type { Question } from "./content";
import { verbPracticeQuestions } from "./verb-practice";
import { verbs, verbForms, conjugate, groupNames } from "./basics-content";
const bank = authored as Record<
  string,
  { options: string[]; explanations: string[] }
>;
const verbBank = new Map(verbPracticeQuestions.map((q) => [q.id, q]));
/** Canonical option order. Rendering must use the quiz's persisted shuffle order. */
export function optionExplanations(q: Question): string[] {
  const note = bank[q.id];
  if (note) {
    if (
      note.options.length !== q.options.length ||
      note.options.some((o, i) => o !== q.options[i])
    )
      throw Error(`選項解析需重新編譯：${q.id}`);
    return note.explanations;
  }
  const meta = verbBank.get(q.id);
  if (!meta) throw Error(`缺少逐項解析：${q.id}`);
  const verb = verbs.find((v) => v.id === meta.verbId)!,
    target = verbForms.find((f) => f.id === meta.formId)!,
    forms = conjugate(verb);
  return q.options.map((option, index) => {
    if (index === q.answer) return q.explanation;
    const matches = verbForms.filter((f) => forms[f.id].word === option);
    if (!matches.length) throw Error(`未辨識的動詞選項：${q.id} ${option}`);
    return `「${option}」（${forms[matches[0].id].reading}）對應${matches.map((f) => `「${f.title}」`).join("／")}。${matches.map((f) => `${f.title}的用途：${f.meaning}`).join("；")}。原形「${verb.word}」屬${groupNames[verb.group]}。本題${meta.practiceKind === "sentence" ? "依句子語意與接續要求" : "指定要變成"}「${target.title}」，應填「${forms[meta.formId].word}」，不能以其他形式代替。`;
  });
}
