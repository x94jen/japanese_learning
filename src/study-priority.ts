import source from "./study-priority.json" with { type: "json" };
import {
  n3UnitIds,
  supplementalLessons,
  type Vocab,
  type Grammar,
} from "./content";
export type LibrarySort = "exam" | "daily" | "course";
export const prioritySources = source.metadata;
export const wordEvidence = source.words as Record<
  string,
  {
    n3Candidate?: boolean;
    rank?: number;
    count?: number;
    lookupStatus?: string;
  }
>;
export function materialLevel(unit: number) {
  if (unit === 201) return "會話";
  return n3UnitIds.has(unit)
    ? "N3"
    : supplementalLessons.find((l) => l.unit === unit)?.level || "基礎";
}
const examUnits = new Set([
  1, 2, 3, 4, 5, 6, 7, 10, 12, 14, 16, 17, 18, 19, 20, 21, 25, 26, 27,
]);
const dailyUnits = new Set([
  1, 2, 4, 5, 7, 13, 14, 15, 16, 17, 21, 25, 26, 27, 28, 29,
]);
export function grammarBand(g: Grammar, sort: LibrarySort = "exam") {
  return (sort === "daily" ? dailyUnits : examUnits).has(g.unit) ? 1 : 2;
}
export function wordBand(v: Vocab) {
  const evidence = wordEvidence[v.id];
  return materialLevel(v.unit) === "N3" &&
    (evidence?.n3Candidate || (evidence?.rank ?? Infinity) <= 3000)
    ? 1
    : 2;
}
export function compareWords(a: Vocab, b: Vocab, sort: LibrarySort) {
  if (sort === "course") return a.unit - b.unit || a.id.localeCompare(b.id);
  if (sort === "exam")
    return (
      wordBand(a) - wordBand(b) ||
      Number(!wordEvidence[a.id]?.n3Candidate) -
        Number(!wordEvidence[b.id]?.n3Candidate) ||
      (wordEvidence[a.id]?.rank ?? Infinity) -
        (wordEvidence[b.id]?.rank ?? Infinity) ||
      a.unit - b.unit ||
      a.id.localeCompare(b.id)
    );
  return (
    (wordEvidence[a.id]?.rank ?? Infinity) -
      (wordEvidence[b.id]?.rank ?? Infinity) ||
    a.unit - b.unit ||
    a.id.localeCompare(b.id)
  );
}
export function compareGrammar(a: Grammar, b: Grammar, sort: LibrarySort) {
  return (
    (sort === "course" ? 0 : grammarBand(a, sort) - grammarBand(b, sort)) ||
    a.unit - b.unit ||
    a.id.localeCompare(b.id)
  );
}
export const priorityRoutes = [
  {
    id: "exam" as const,
    title: "N3 衝刺先掌握",
    description: "先回想核心句型，再回到相關單元練習；本站編排建議。",
    units: [16, 17, 18, 7, 12, 20],
  },
  {
    id: "daily" as const,
    title: "日常開口先熟悉",
    description: "先練打算、請求、理由、推測與禮貌表達；本站編排建議。",
    units: [14, 15, 17, 21, 26, 27],
  },
];
