import { test } from "node:test";
import assert from "node:assert/strict";
import {
  schedule,
  mastered,
  reduceEvents,
  mergeEvents,
  isEvent,
  examDays,
  shuffled,
} from "../src/engine";
import { vocab, grammar, units, questions, foundations } from "../src/content";
const now = new Date("2026-10-16T00:00:00Z");
test("forgotten cards return in ten minutes and lose mastery", () => {
  let r = schedule(undefined, 3, now);
  r = schedule(r, 3, now);
  r = schedule(r, 3, now);
  assert.ok(mastered(r));
  const forgotten = schedule(r, 0, now);
  assert.equal(Date.parse(forgotten.due) - now.getTime(), 600000);
  assert.equal(forgotten.streak, 0);
  assert.equal(forgotten.lapses, 1);
  assert.equal(mastered(forgotten), false);
});
test("flipping or favoriting cannot imply learned or mastered", () => {
  const r = schedule(undefined, 2, now);
  assert.equal(mastered(r), false);
  assert.equal(r.interval, 1);
  assert.equal(schedule(r, 1, now).interval, 1);
  assert.throws(() => schedule(r, 99));
  const data = reduceEvents([
    { id: "a", at: now.toISOString(), key: "favorite:v001", value: true },
  ]);
  assert.equal(data["learned:v001"], undefined);
});
test("device event merges are idempotent and order independent", () => {
  const a = {
      id: "a",
      key: "favorite:v001",
      value: true,
      at: "2026-10-15T00:00:00Z",
    },
    b = {
      id: "b",
      key: "favorite:v001",
      value: false,
      at: "2026-10-16T00:00:00Z",
    },
    c = { id: "c", key: "lessonStep:1", value: 3, at: "2026-10-16T01:00:00Z" };
  const merged = mergeEvents([a, b], [a, c]);
  assert.equal(merged.length, 3);
  assert.deepEqual(reduceEvents(merged), reduceEvents([c, b, a]));
  assert.equal(reduceEvents(merged)["favorite:v001"], false);
});
test("equal-time events converge using UUID as deterministic tie breaker", () => {
  const a = { id: "a", key: "x", value: 1, at: now.toISOString() },
    b = { ...a, id: "b", value: 2 };
  assert.deepEqual(reduceEvents([b, a]), reduceEvents([a, b]));
});
test("exam countdown follows Taipei date rather than host date", () => {
  assert.equal(examDays("2026-12-05", new Date("2026-12-04T15:59:00Z")), 1);
  assert.equal(examDays("2026-12-05", new Date("2026-12-04T16:01:00Z")), 0);
});
test("content has stable unique identifiers, complete questions and valid prerequisites", () => {
  assert.equal(vocab.filter((v) => v.unit <= 6).length, 100);
  assert.equal(vocab.length, 196);
  assert.equal(grammar.filter((g) => g.unit <= 6).length, 12);
  assert.equal(grammar.length, 61);
  assert.equal(questions.filter((q) => q.unit <= 6).length, 80);
  assert.equal(questions.length, 178);
  const ids = [
    ...vocab.map((v) => v.id),
    ...grammar.map((g) => g.id),
    ...questions.map((q) => q.id),
  ];
  assert.equal(new Set(ids).size, ids.length);
  for (const q of questions) {
    assert.equal(q.options.length, 4);
    assert.equal(new Set(q.options).size, 4);
    assert.ok(q.answer >= 0 && q.answer < 4);
    assert.ok(q.explanation && q.trap && q.translation);
    q.related.forEach((id) =>
      assert.ok(ids.includes(id), `${q.id}: missing ${id}`),
    );
  }
  for (const u of units) {
    assert.ok(questions.filter((q) => q.unit === u.id).length >= 13);
    assert.equal(grammar.filter((g) => g.unit === u.id).length, 2);
    u.foundations.forEach((id) =>
      assert.ok(foundations.find((f) => f.id === id)),
    );
  }
  for (const v of vocab)
    assert.ok(
      v.reading && v.sentence && v.translation && v.collocation && v.source,
    );
  assert.equal(questions.filter((q) => q.audio).length, 6);
  assert.equal(
    questions.filter((q) => q.passage && q.type.startsWith("閱讀")).length,
    8,
  );
});
test("shuffling preserves options and correct option identity", () => {
  const values = shuffled([0, 1, 2, 3], () => 0.15);
  assert.deepEqual([...values].sort(), [0, 1, 2, 3]);
  assert.notDeepEqual(values, [0, 1, 2, 3]);
});
test("reject invalid imported events", () => {
  assert.equal(isEvent(null), false);
  assert.equal(
    isEvent({ id: "bad", key: "x", value: 0, at: "yesterday" }),
    false,
  );
});
