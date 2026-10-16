import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { supplementalLessons, vocab, grammar, questions } from "../src/content";
import { isEvent, schedule, reduceEvents } from "../src/engine";
test("all 49 supplied files have a traceable lesson, without inventing missing GL02", () => {
  const manifest = JSON.parse(
    readFileSync("docs/HANDOUT_SOURCES.json", "utf8"),
  );
  assert.equal(manifest.fileCount, 49);
  assert.equal(manifest.totalPages, 780);
  assert.equal(supplementalLessons.length, 49);
  assert.deepEqual(manifest.missingGLUnits, [2]);
  assert.equal(
    supplementalLessons.some((l) => l.code === "GL02"),
    false,
  );
  assert.equal(
    supplementalLessons.filter((l) => l.code.startsWith("GL")).length,
    48,
  );
  assert.equal(supplementalLessons.filter((l) => l.code === "K01").length, 1);
  for (const l of supplementalLessons) {
    assert.ok(l.source.file.endsWith(".pdf"));
    assert.match(l.source.sha256, /^[a-f0-9]{64}$/);
    assert.ok(
      manifest.files.find(
        (f: any) => f.code === l.code && f.file === l.source.file,
      ),
    );
    assert.ok(l.meaning && l.connection && l.note && l.compare);
    assert.equal(l.examples.length, 2);
    l.examples.forEach((e) => assert.ok(e.ja && e.zh));
    assert.equal(l.questionIds.length, 2);
    l.questionIds.forEach((id) =>
      assert.equal(questions.find((q) => q.id === id)?.unit, l.unit),
    );
    l.vocabIds.forEach((id) => assert.ok(vocab.find((v) => v.id === id)));
    assert.equal(grammar.find((g) => g.id === l.grammarId)?.unit, l.unit);
  }
});
test("prerequisite graph is valid and has no cycles; N3 bridge links reference actual units", () => {
  const done = new Set<number>(),
    active = new Set<number>();
  function visit(unit: number) {
    if (done.has(unit)) return;
    assert.equal(active.has(unit), false, `cycle at ${unit}`);
    const lesson = supplementalLessons.find((l) => l.unit === unit);
    assert.ok(lesson, `missing prerequisite ${unit}`);
    active.add(unit);
    lesson.prerequisites.forEach(visit);
    active.delete(unit);
    done.add(unit);
    lesson.n3Units.forEach((id) => assert.ok(id >= 1 && id <= 6));
  }
  supplementalLessons.forEach((l) => visit(l.unit));
  assert.equal(done.size, 49);
});
test("new and existing sessions survive backup validation and event merging", () => {
  const e = (key: string, value: unknown) => ({
    id: crypto.randomUUID(),
    key,
    value,
    at: new Date().toISOString(),
  });
  const last = supplementalLessons.at(-1)!;
  const events = [
    e("activeLesson", last.unit),
    e(`lessonStep:${last.unit}`, 2),
    e(`completed:${last.unit}`, true),
    e(`review:${last.grammarId}`, schedule(undefined, 2)),
    e("cardSession", {
      id: crypto.randomUUID(),
      ids: [vocab.at(-1)!.id],
      index: 0,
      flipped: true,
      finished: false,
      mode: "reading",
    }),
    e("quizSession", {
      id: crypto.randomUUID(),
      ids: last.questionIds,
      index: 0,
      choice: 0,
      submitted: true,
      answers: 1,
      correct: 0,
      finished: false,
      orders: [
        [0, 1, 2, 3],
        [0, 1, 2, 3],
      ],
      timed: false,
      startedAt: Date.now(),
      limit: 600000,
    }),
  ];
  events.forEach((event) =>
    assert.equal(isEvent(event), true, `rejected ${event.key}`),
  );
  assert.equal(reduceEvents(events)[`completed:${last.unit}`], true);
  assert.equal(isEvent(e("activeLesson", 102)), false);
  assert.equal(
    isEvent(
      e("cardSession", {
        id: "x",
        ids: ["v9999"],
        index: 0,
        flipped: false,
        finished: false,
        mode: "meaning",
      }),
    ),
    false,
  );
});
