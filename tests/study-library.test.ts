import test from "node:test";
import assert from "node:assert/strict";
import { vocab, grammar, units } from "../src/content";
import {
  wordEvidence,
  prioritySources,
  priorityRoutes,
  compareWords,
  materialLevel,
  compareGrammar,
} from "../src/study-priority";
import { isEvent, reduceEvents, mergeEvents, schedule } from "../src/engine";
test("online lookup evidence is explicit, traceable and does not invent unmatched ranks", () => {
  assert.equal(Object.keys(wordEvidence).length, vocab.length);
  assert.equal(Object.values(wordEvidence).filter((v) => v.rank).length, 149);
  assert.equal(prioritySources.frequency.corpus, "OpenSubtitles2018");
  assert.equal(prioritySources.frequency.license, "CC-BY-SA-4.0");
  assert.match(prioritySources.frequency.sha256, /^[a-f0-9]{64}$/);
  assert.ok(Object.values(wordEvidence).some((e) => !e.rank));
  const sorted = [...vocab].sort((a, b) => compareWords(a, b, "daily"));
  const ranks = sorted
    .filter((v) => wordEvidence[v.id].rank)
    .map((v) => wordEvidence[v.id].rank!);
  assert.deepEqual(
    ranks,
    [...ranks].sort((a, b) => a - b),
  );
  for (const v of vocab)
    assert.ok(["N3", "N4", "N5"].includes(materialLevel(v.unit)));
  for (const route of priorityRoutes)
    for (const id of route.units) assert.ok(units.some((u) => u.id === id));
  const original = [...grammar].sort((a, b) => compareGrammar(a, b, "course"));
  assert.equal(original.length, grammar.length);
  assert.equal(original[0].unit, 1);
});
test("grammar card sessions survive backup merge and reject vocabulary/quiz IDs", () => {
  const event = (key: string, value: unknown) => ({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    key,
    value,
  });
  const session = {
    id: crypto.randomUUID(),
    ids: ["g1", "gn3-16-1"],
    index: 1,
    flipped: true,
    finished: false,
    ratedIds: [],
    mode: "grammar",
  };
  const e = event("grammarSession", session);
  assert.ok(isEvent(e));
  assert.ok(isEvent(event("lastStudyRoute", "grammarCards")));
  assert.ok(!isEvent(event("lastStudyRoute", "outside")));
  for (const patch of [
    { ids: ["v001"] },
    { ids: ["q1"] },
    { mode: "meaning" },
    { ratedIds: ["g2"] },
    { index: 2 },
    { ids: [] },
  ])
    assert.ok(!isEvent(event("grammarSession", { ...session, ...patch })));
  const merged = reduceEvents(
    mergeEvents([e], [e, event("review:g1", schedule(undefined, 1))]),
  );
  assert.deepEqual(merged.grammarSession, session);
  assert.equal(merged["learned:g1"], undefined);
  assert.equal((merged["review:g1"] as any).interval, 1);
});
