import { validSong } from "./song-content";
import {
  vocab,
  grammar,
  questions,
  units,
  supplementalLessons,
} from "./content";
const vocabularyIds = new Set(vocab.map((v) => v.id));
const grammarIds = new Set(grammar.map((g) => g.id));
const questionIds = new Set(questions.map((q) => q.id));
const unitIds = new Set([
  ...units.map((u) => u.id),
  ...supplementalLessons.map((u) => u.unit),
]);
// Recover the course from persisted question IDs, including sessions created before this change.
export function quizReturnDestination(
  ids: string[],
): { route: "lesson"; unit: number } | { route: "basics" | "courses" } {
  const selected = ids.map((id) => questions.find((q) => q.id === id));
  if (!selected.length || selected.some((q) => !q)) return { route: "courses" };
  const idsOfUnits = new Set(selected.map((q) => q!.unit));
  if (idsOfUnits.size !== 1) return { route: "courses" };
  const unit = selected[0]!.unit;
  if (unit === 200) return { route: "basics" };
  return unitIds.has(unit) ? { route: "lesson", unit } : { route: "courses" };
}
export type Review = {
  due: string;
  interval: number;
  streak: number;
  reviews: number;
  lapses: number;
  lastRating: number;
};
export type StudyEvent = {
  id: string;
  key: string;
  value: unknown;
  at: string;
};
export type Snapshot = Record<string, unknown>;
export const DAY = 86400000;
export function schedule(
  previous: Review | undefined,
  rating: number,
  now = new Date(),
): Review {
  if (![0, 1, 2, 3].includes(rating)) throw new Error("Invalid rating");
  const interval =
    rating === 0
      ? 0
      : rating === 1
        ? 1
        : rating === 2
          ? previous
            ? Math.max(1, Math.round(previous.interval * 2.2))
            : 1
          : previous
            ? Math.max(4, Math.round(previous.interval * 2.8))
            : 4;
  return {
    due: new Date(
      now.getTime() + (rating === 0 ? 600000 : interval * DAY),
    ).toISOString(),
    interval,
    streak: rating === 0 ? 0 : (previous?.streak ?? 0) + 1,
    reviews: (previous?.reviews ?? 0) + 1,
    lapses: (previous?.lapses ?? 0) + (rating === 0 ? 1 : 0),
    lastRating: rating,
  };
}
export function mastered(r?: Review) {
  return !!r && r.streak >= 3 && r.interval >= 21;
}
export function reduceEvents(events: StudyEvent[]): Snapshot {
  const result: Snapshot = {};
  const sorted = [...events].sort(
    (a, b) => Date.parse(a.at) - Date.parse(b.at) || a.id.localeCompare(b.id),
  );
  for (const event of sorted) result[event.key] = event.value;
  return result;
}
export function mergeEvents(...lists: StudyEvent[][]) {
  const map = new Map<string, StudyEvent>();
  for (const list of lists) for (const e of list) map.set(e.id, e);
  return [...map.values()];
}
function number(v: unknown) {
  return typeof v === "number" && Number.isFinite(v) && v >= 0;
}
function boolean(v: unknown) {
  return typeof v === "boolean";
}
function validValue(key: string, value: unknown): boolean {
  if (/^song:[\w-]{1,80}$/.test(key)) return value === null || validSong(value);
  if (/^songProgress:[\w-]{1,80}$/.test(key)) {
    const p = value as { cue?: unknown; time?: unknown };
    return (
      !!p &&
      typeof p === "object" &&
      number(p.cue) &&
      Number.isInteger(p.cue) &&
      Number(p.cue) < 300 &&
      number(p.time) &&
      Number(p.time) <= 86400
    );
  }
  if (/^songFavorite:[\w-]{1,80}:\d{1,3}$/.test(key)) return boolean(value);

  if (
    /^(favorite|learned|foundation|completed|seen|referenceSeen):/.test(key) ||
    key === "setting:ruby"
  )
    return boolean(value);
  if (key === "setting:exam")
    return (
      typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      Number.isFinite(Date.parse(value))
    );
  if (key === "lastStudyRoute")
    return (
      typeof value === "string" &&
      ["lesson", "cards", "quiz", "grammarCards"].includes(value)
    );
  if (key === "activeLesson")
    return typeof value === "number" && unitIds.has(value);
  if (key.startsWith("lessonStep:"))
    return number(value) && Number.isInteger(value) && Number(value) <= 6;
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as Record<string, any>;
  if (key.startsWith("review:"))
    return (
      typeof v.due === "string" &&
      Number.isFinite(Date.parse(v.due)) &&
      ["interval", "streak", "reviews", "lapses", "lastRating"].every((k) =>
        number(v[k]),
      ) &&
      v.lastRating <= 3
    );
  if (key.startsWith("answer:"))
    return (
      number(v.selected) &&
      v.selected <= 3 &&
      boolean(v.correct) &&
      typeof v.at === "string" &&
      Number.isFinite(Date.parse(v.at))
    );
  if (key.startsWith("wordMistake:"))
    return (
      boolean(v.active) &&
      typeof v.selectedMeaning === "string" &&
      typeof v.at === "string" &&
      Number.isFinite(Date.parse(v.at))
    );
  if (key.startsWith("wordAnswer:"))
    return (
      boolean(v.correct) &&
      typeof v.at === "string" &&
      Number.isFinite(Date.parse(v.at))
    );
  if (key.startsWith("mistake:"))
    return (
      boolean(v.active) &&
      number(v.selected) &&
      v.selected <= 3 &&
      typeof v.at === "string" &&
      Number.isFinite(Date.parse(v.at))
    );
  if (
    key === "quizSession" ||
    key === "cardSession" ||
    key === "grammarSession"
  ) {
    const quiz = key === "quizSession",
      grammarCard = key === "grammarSession";
    if (
      typeof v.id !== "string" ||
      !Array.isArray(v.ids) ||
      !v.ids.length ||
      v.ids.length > 1000 ||
      !v.ids.every(
        (id: unknown) =>
          typeof id === "string" &&
          (quiz ? questionIds : grammarCard ? grammarIds : vocabularyIds).has(
            id,
          ),
      ) ||
      !number(v.index) ||
      !Number.isInteger(v.index) ||
      v.index > v.ids.length ||
      !boolean(v.finished)
    )
      return false;
    if (!v.finished && v.index >= v.ids.length) return false;
    if (!quiz)
      return (
        boolean(v.flipped) &&
        (grammarCard ? ["grammar"] : ["meaning", "reading", "audio"]).includes(
          v.mode,
        ) &&
        (v.ratedIds === undefined ||
          (Array.isArray(v.ratedIds) &&
            new Set(v.ratedIds).size === v.ratedIds.length &&
            v.ratedIds.every(
              (id: unknown) => typeof id === "string" && v.ids.includes(id),
            )))
      );
    return (
      (v.choice === null ||
        (number(v.choice) && Number.isInteger(v.choice) && v.choice <= 3)) &&
      (!v.submitted || v.choice !== null) &&
      boolean(v.submitted) &&
      number(v.answers) &&
      v.answers <= v.ids.length &&
      number(v.correct) &&
      v.correct <= v.answers &&
      boolean(v.timed) &&
      number(v.startedAt) &&
      number(v.limit) &&
      Array.isArray(v.orders) &&
      v.orders.length === v.ids.length &&
      v.orders.every(
        (o: unknown) =>
          Array.isArray(o) &&
          o.length === 4 &&
          [...o].sort().join(",") === "0,1,2,3",
      )
    );
  }
  return false;
}
export function isEvent(v: unknown): v is StudyEvent {
  if (!v || typeof v !== "object") return false;
  const e = v as StudyEvent;
  return (
    typeof e.id === "string" &&
    /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(e.id) &&
    typeof e.key === "string" &&
    e.key.length <= 200 &&
    typeof e.at === "string" &&
    Number.isFinite(Date.parse(e.at)) &&
    "value" in e &&
    validValue(e.key, e.value)
  );
}
export function examDays(target: string, now = new Date()) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return Math.max(
    0,
    Math.ceil(
      (Date.parse(target + "T00:00:00+08:00") -
        Date.parse(today + "T00:00:00+08:00")) /
        DAY,
    ),
  );
}
export function shuffled<T>(values: T[], random = Math.random): T[] {
  const a = [...values];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function normalizeAnswer(s: string) {
  return s.trim().replace(/[\s\u3000]/g, "");
}

export function courseProgress(id: number, data: Snapshot) {
  const sections = id >= 100 ? 2 : 5;
  const items = questions.filter((q) => q.unit === id);
  const total = sections + items.length + 1;
  const finished = !!data[`completed:${id}`];
  const done = finished
    ? total
    : Array.from(
        { length: sections },
        (_, i) => !!data[`seen:${id}:${i}`],
      ).filter(Boolean).length +
      items.filter((q) => !!data[`answer:${q.id}`]).length;
  return { done, total, percent: Math.round((done / total) * 100) };
}
