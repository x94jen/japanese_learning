import handouts from "./dialogue-handouts.json" with { type: "json" };
export const handoutLessons = handouts;
import data from "./dialogues.json" with { type: "json" };
export const dialogues = data;
export type Dialogue = (typeof data)[number];
export type DialogueProgress = {
  turn: number;
  seen: number[];
  choice: number | null;
  submitted: boolean;
  order?: number[];
};
export const dialogueIds = new Set(dialogues.map((d) => d.id));
export function validDialogueProgress(
  id: string,
  value: unknown,
): value is DialogueProgress {
  const d = dialogues.find((d) => d.id === id);
  if (!d || !value || typeof value !== "object") return false;
  const p = value as DialogueProgress;
  return (
    Number.isInteger(p.turn) &&
    p.turn >= 0 &&
    p.turn < d.turns.length &&
    Array.isArray(p.seen) &&
    p.seen.length <= d.turns.length &&
    new Set(p.seen).size === p.seen.length &&
    p.seen.every((i) => Number.isInteger(i) && i >= 0 && i < d.turns.length) &&
    (p.choice === null ||
      (Number.isInteger(p.choice) && p.choice >= 0 && p.choice < 4)) &&
    (p.order === undefined ||
      (Array.isArray(p.order) &&
        p.order.length === 4 &&
        [...p.order].sort().join(",") === "0,1,2,3")) &&
    typeof p.submitted === "boolean" &&
    (!p.submitted || p.choice !== null)
  );
}
export function dialogueCompletion(d: Dialogue, p?: DialogueProgress) {
  const count = (p?.seen.length || 0) + (p?.submitted ? 1 : 0);
  return {
    count,
    total: d.turns.length + 1,
    percent: Math.round((count / (d.turns.length + 1)) * 100),
  };
}
