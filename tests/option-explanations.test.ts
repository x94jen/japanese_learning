import { test } from "node:test";
import assert from "node:assert/strict";
import { questions } from "../src/content";
import { optionExplanations } from "../src/option-explanations";
test("every question has four distinct explanations aligned with its canonical options", () => {
  assert.equal(questions.length, 797);
  for (const q of questions) {
    const notes = optionExplanations(q);
    assert.equal(notes.length, 4, q.id);
    assert.equal(new Set(notes).size, 4, q.id);
    assert.equal(notes[q.answer], q.explanation, q.id);
    for (let i = 0; i < notes.length; i++)
      assert.ok(notes[i].trim().length >= (i === q.answer ? 1 : 12), q.id);
  }
});
test("nonzero-answer sorting questions explain positions, not an assumed first answer", () => {
  const q = questions.find((q) => q.id === "q3")!,
    notes = optionExplanations(q);
  assert.equal(q.answer, 1);
  assert.match(notes[0], /第一格/);
  assert.match(notes[2], /第三格/);
  assert.match(notes[3], /第四格/);
});
test("real verb distractor forms are identified rather than called universally ungrammatical", () => {
  const q = questions.find((q) => q.id === "qverb-transform-iku-te")!,
    notes = optionExplanations(q);
  for (let i = 0; i < 4; i++)
    if (i !== q.answer) {
      assert.ok(notes[i].includes(q.options[i]));
      assert.match(notes[i], /用途/);
      assert.match(notes[i], /て形/);
    }
});
test("reading and listening distractors explain the actual conflicting evidence", () => {
  const q = questions.find((q) => q.id === "q4")!,
    notes = optionExplanations(q);
  assert.match(notes[1], /西口|東口/);
  assert.match(notes[2], /出發時間/);
  assert.match(notes[3], /電話/);
  const q29 = questions.find((q) => q.id === "q29")!,
    n29 = optionExplanations(q29);
  assert.match(n29[1], /週六上午/);
  assert.match(n29[2], /週日/);
});

test("word-practice distractor IDs remain backup compatible, while invalid IDs are rejected", async () => {
  const { isEvent } = await import("../src/engine");
  const at = new Date().toISOString(),
    id = crypto.randomUUID();
  assert.ok(
    isEvent({
      id,
      key: "wordMistake:v001",
      value: { active: true, selectedMeaning: "測試", at },
      at,
    }),
  );
  assert.ok(
    isEvent({
      id,
      key: "wordMistake:v001",
      value: {
        active: true,
        selectedMeaning: "測試",
        optionIds: ["v001", "v002", "v003", "v004"],
        at,
      },
      at,
    }),
  );
  assert.ok(
    !isEvent({
      id,
      key: "wordMistake:v001",
      value: {
        active: true,
        selectedMeaning: "測試",
        optionIds: ["v001", "v002", "v003", "fake-word"],
        at,
      },
      at,
    }),
  );
});
