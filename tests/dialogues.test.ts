import { test } from "node:test";
import assert from "node:assert/strict";
import {
  dialogues,
  dialogueCompletion,
  validDialogueProgress,
} from "../src/dialogue-content";
import { grammar } from "../src/content";
import { parseMarked } from "../src/grammar-guides";
import { isEvent, mergeEvents, reduceEvents, schedule } from "../src/engine";
test("18 original dialogue scenarios have complete turns, readings, translations, notes and four-option explanations", () => {
  assert.equal(dialogues.length, 18);
  assert.equal(new Set(dialogues.map((d) => d.id)).size, 18);
  assert.deepEqual(
    new Set(dialogues.map((d) => d.category)),
    new Set(["生活", "旅遊", "台日交流工作"]),
  );
  for (const d of dialogues) {
    assert.equal(d.turns.length, 6);
    for (const t of d.turns) {
      assert.equal(parseMarked(t.marked).text, t.text);
      assert.ok(t.reading && t.translation && t.note);
      assert.ok(!/[一-龯]/.test(t.reading), d.id);
    }
    assert.equal(d.question.options.length, 4);
    assert.equal(new Set(d.question.options).size, 4);
    assert.equal(new Set(d.question.explanations).size, 4);
    assert.ok(d.question.explanations.every((e) => e.length > 12));
    for (const id of d.grammar)
      assert.ok(
        grammar.some((g) => g.id === id),
        id,
      );
    assert.ok(d.source.includes("自編"));
    assert.ok(d.variation);
  }
});
test("browsing is not completion; progress, favorites and review remain valid through backup and merges", () => {
  const progress = {
    turn: 2,
    seen: [0],
    choice: 2,
    submitted: false,
    order: [2, 0, 3, 1],
  };
  assert.ok(validDialogueProgress("materials", progress));
  assert.equal(
    dialogueCompletion(
      dialogues.find((d) => d.id === "materials")!,
      progress,
    ).count,
    1,
  );
  for (const bad of [
    { ...progress, turn: 6 },
    { ...progress, seen: [0, 0] },
    { ...progress, submitted: true, choice: null },
    { ...progress, order: [0, 0, 1, 2] },
  ])
    assert.ok(!validDialogueProgress("materials", bad));
  const at = new Date().toISOString();
  const events = [
    { id: crypto.randomUUID(), key: "dialogue:materials", value: progress, at },
    {
      id: crypto.randomUUID(),
      key: "dialogueFavorite:materials",
      value: true,
      at,
    },
    {
      id: crypto.randomUUID(),
      key: "dialogueReview:materials",
      value: schedule(undefined, 0),
      at,
    },
  ];
  assert.ok(events.every(isEvent));
  assert.equal(mergeEvents(events, events).length, 3);
  assert.deepEqual(
    reduceEvents(JSON.parse(JSON.stringify(events)))["dialogue:materials"],
    progress,
  );
  assert.ok(!isEvent({ ...events[0], key: "dialogue:unknown" }));
});
