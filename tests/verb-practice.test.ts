import test from "node:test";
import assert from "node:assert/strict";
import { verbPracticeQuestions } from "../src/verb-practice";
import { verbForms, verbs, conjugate } from "../src/basics-content";
import { isEvent } from "../src/engine";
test("verb bank covers every form, all groups, and valid distinct choices", () => {
  assert.equal(verbPracticeQuestions.length, 427);
  assert.equal(new Set(verbPracticeQuestions.map((q) => q.id)).size, 427);
  for (const f of verbForms)
    for (const kind of ["transform", "sentence"])
      assert.ok(
        verbPracticeQuestions.some(
          (q) => q.formId === f.id && q.practiceKind === kind,
        ),
        `${f.id} ${kind}`,
      );
  for (const q of verbPracticeQuestions) {
    assert.equal(new Set(q.options).size, 4);
    assert.ok(!q.options.includes("—"));
    assert.equal(
      q.options[q.answer],
      conjugate(verbs.find((v) => v.id === q.verbId)!)[q.formId].word,
    );
    assert.ok(q.explanation.includes("變化規則"));
    assert.ok(q.trap && q.translation);
    if (q.practiceKind === "sentence") {
      assert.ok(q.passage?.includes("＿＿"));
      assert.ok(q.prompt.includes(q.translation!));
    }
  }
});
test("new quiz IDs persist as answer, mistake and review records", () => {
  const q = verbPracticeQuestions.find(
    (q) => q.verbId === "iku" && q.formId === "te",
  )!;
  assert.equal(q.options[q.answer], "行って");
  for (const [key, value] of [
    [
      `answer:${q.id}`,
      { selected: 1, correct: false, at: new Date().toISOString() },
    ],
    [
      `mistake:${q.id}`,
      { active: true, selected: 1, at: new Date().toISOString() },
    ],
  ] as const)
    assert.ok(
      isEvent({
        id: crypto.randomUUID(),
        key,
        value,
        at: new Date().toISOString(),
      }),
    );
});
