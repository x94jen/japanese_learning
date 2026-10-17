import test from "node:test";
import assert from "node:assert/strict";
import expansion from "../src/n3Expansion.json" with { type: "json" };
import {
  units,
  n3UnitIds,
  grammar,
  vocab,
  questions,
  n3Reference,
} from "../src/content";
import { isEvent, courseProgress, reduceEvents, schedule } from "../src/engine";

test("N3 expansion contains real lesson sections and retains original material", () => {
  assert.equal(units.length, 30);
  assert.equal(grammar.filter((g) => n3UnitIds.has(g.unit)).length, 108);
  assert.equal(vocab.filter((v) => n3UnitIds.has(v.unit)).length, 148);
  assert.equal(questions.filter((q) => n3UnitIds.has(q.unit)).length, 272);
  assert.equal(questions.filter((q) => q.unit <= 6).length, 80);
  assert.equal(grammar.filter((g) => g.unit <= 6).length, 12);
  assert.equal(new Set(vocab.map((v) => v.word)).size, vocab.length);
  for (const u of expansion.units) {
    assert.ok(u.category && u.focus && u.foundations.length);
    assert.deepEqual(u.prerequisites, [u.id - 1]);
    assert.ok(u.prerequisites.every((id) => n3UnitIds.has(id) && id < u.id));
    const gs = grammar.filter((g) => g.unit === u.id),
      qs = questions.filter((q) => q.unit === u.id),
      vs = vocab.filter((v) => v.unit === u.id);
    assert.equal(gs.length, 4);
    assert.equal(vs.length, 2);
    assert.equal(qs.length, 8);
    assert.equal(qs.filter((q) => q.type === "文法選擇").length, 4);
    assert.equal(qs.filter((q) => q.type === "漢字讀音").length, 2);
    assert.equal(qs.filter((q) => q.passage).length, 1);
    assert.equal(qs.filter((q) => q.audio).length, 1);
    for (const g of gs) {
      assert.ok(
        g.connection &&
          g.note &&
          g.compare &&
          g.example &&
          g.translation &&
          g.source,
      );
      const q = qs.find(
        (q) => q.related.includes(g.id) && q.type === "文法選擇",
      )!;
      assert.ok(q.prompt.includes("（　）"));
      assert.ok(g.example.includes(q.options[q.answer]));
      assert.ok(!g.example.includes("〈"));
    }
    for (const q of qs) {
      assert.equal(new Set(q.options).size, 4);
      assert.ok(q.explanation && q.trap && q.translation && q.source);
    }
  }
  assert.equal(n3Reference.requestedReference.author, "時雨の町");
  assert.match(n3Reference.requestedReference.status, /未讀取或逐課核對/);
});
test("expanded lesson state survives event validation and keeps prior completion", () => {
  const u = units.at(-1)!,
    q = questions.find((q) => q.unit === u.id)!,
    v = vocab.find((v) => v.unit === u.id)!;
  const event = (key: string, value: unknown) => ({
    id: crypto.randomUUID(),
    key,
    value,
    at: new Date().toISOString(),
  });
  const events = [
    event("activeLesson", 30),
    event("lessonStep:30", 2),
    event(`favorite:${q.id}`, true),
    event(`review:${q.id}`, schedule(undefined, 0)),
    event(`answer:${q.id}`, {
      selected: 0,
      correct: true,
      at: new Date().toISOString(),
    }),
    event("completed:6", true),
    event("quizSession", {
      id: crypto.randomUUID(),
      ids: [q.id],
      index: 0,
      finished: false,
      choice: null,
      submitted: false,
      answers: 0,
      correct: 0,
      orders: [[0, 1, 2, 3]],
      timed: false,
      startedAt: Date.now(),
      limit: 600000,
    }),
    event("cardSession", {
      id: crypto.randomUUID(),
      ids: [v.id],
      index: 0,
      flipped: false,
      mode: "reading",
      finished: false,
      ratedIds: [],
    }),
  ];
  for (const e of events) assert.ok(isEvent(e), e.key);
  const state = reduceEvents(events);
  assert.equal(state.activeLesson, 30);
  assert.equal(state[`favorite:${q.id}`], true);
  assert.equal(courseProgress(6, state).percent, 100);
  assert.ok(courseProgress(30, state).percent > 0);
  assert.ok(courseProgress(30, state).percent < 100);
});
