import { test } from "node:test";
import assert from "node:assert/strict";
import { questions, supplementalLessons } from "../src/content";
import { quizReturnDestination } from "../src/engine";
test("quiz returns to its own N3 or supplemental lesson independently of another active lesson", () => {
  for (const unit of [1, 4, 30, supplementalLessons[0].unit]) {
    const ids = questions.filter((q) => q.unit === unit).map((q) => q.id);
    assert.ok(ids.length);
    assert.deepEqual(quizReturnDestination(ids), { route: "lesson", unit });
    assert.deepEqual(quizReturnDestination([ids[0]]), {
      route: "lesson",
      unit,
    });
  }
});
test("verb drills return to foundations; mixed or invalid sessions fall back to catalog", () => {
  const verb = questions.find((q) => q.unit === 200)!,
    one = questions.find((q) => q.unit === 1)!,
    two = questions.find((q) => q.unit === 2)!;
  assert.deepEqual(quizReturnDestination([verb.id]), { route: "basics" });
  for (const ids of [[], ["missing"], [one.id, two.id], [verb.id, one.id]])
    assert.deepEqual(quizReturnDestination(ids), { route: "courses" });
});
