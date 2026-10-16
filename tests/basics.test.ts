import { test } from "node:test";
import assert from "node:assert/strict";
import {
  verbs,
  verbForms,
  conjugate,
  kanaRows,
  voicedRows,
  contractedRows,
  derivedPatterns,
} from "../src/basics-content";
import { courseProgress, isEvent } from "../src/engine";
import { questions } from "../src/content";
const v = (id: string) => verbs.find((v) => v.id === id)!;
test("basic kana has all 46 unique modern characters in both scripts", () => {
  const cells = kanaRows.flatMap((r) => r.cells.filter((c) => c !== null));
  assert.equal(cells.length, 46);
  assert.equal(new Set(cells.map((c) => c!.hira)).size, 46);
  assert.equal(new Set(cells.map((c) => c!.kata)).size, 46);
  assert.equal(voicedRows.flatMap((r) => r.cells).length, 25);
  assert.equal(contractedRows.flatMap((r) => r.cells).length, 33);
  for (const c of cells) assert.ok(c!.romaji && c!.hira && c!.kata);
});
test("godan sound changes and exceptional iku te/ta are correct", () => {
  const cases = [
    ["kaku", "書いて", "書いた"],
    ["oyogu", "泳いで", "泳いだ"],
    ["hanasu", "話して", "話した"],
    ["matsu", "待って", "待った"],
    ["yomu", "読んで", "読んだ"],
    ["asobu", "遊んで", "遊んだ"],
    ["shinu", "死んで", "死んだ"],
    ["kau", "買って", "買った"],
    ["kaeru", "帰って", "帰った"],
    ["iku", "行って", "行った"],
  ];
  for (const [id, te, ta] of cases) {
    const f = conjugate(v(id));
    assert.equal(f.te.word, te, id);
    assert.equal(f.ta.word, ta, id);
  }
  assert.equal(conjugate(v("kau")).negative.word, "買わない");
  assert.equal(conjugate(v("kaeru")).polite.word, "帰ります");
});
test("potential, passive, causative and causative-passive stay distinct", () => {
  const f = conjugate(v("kaku"));
  assert.equal(f.potential.word, "書ける");
  assert.equal(f.passive.word, "書かれる");
  assert.equal(f.causative.word, "書かせる");
  assert.equal(f.causativePassive.word, "書かせられる");
  assert.equal(f.volitional.word, "書こう");
  assert.equal(f.imperative.word, "書け");
  assert.equal(f.ba.word, "書けば");
  assert.equal(f.negativeBa.word, "書かなければ");
  assert.equal(f.negativeTara.word, "書かなかったら");
});
test("ichidan and suru (including compounds) form correct forms", () => {
  const f = conjugate(v("taberu"));
  assert.equal(f.negative.word, "食べない");
  assert.equal(f.passive.word, "食べられる");
  assert.equal(f.causative.word, "食べさせる");
  assert.equal(f.imperative.word, "食べろ");
  const s = conjugate(v("suru"));
  assert.equal(s.potential.word, "できる");
  assert.equal(s.passive.word, "される");
  assert.equal(s.zu.word, "せず");
  assert.equal(conjugate(v("benkyou")).polite.word, "勉強します");
  assert.equal(conjugate(v("benkyou")).potential.reading, "べんきょうできる");
});
test("kuru preserves ki/ko/ku readings; aru has lexical exceptions", () => {
  const f = conjugate(v("kuru"));
  assert.equal(f.polite.reading, "きます");
  assert.equal(f.negative.reading, "こない");
  assert.equal(f.ta.reading, "きた");
  assert.equal(f.ba.reading, "くれば");
  assert.equal(f.potential.reading, "こられる");
  assert.equal(f.causativePassive.word, "来させられる");
  const a = conjugate(v("aru"));
  assert.equal(a.negative.word, "ない");
  assert.equal(a.negativePast.word, "なかった");
  assert.equal(a.zu.word, "あらず");
  assert.equal(a.potential.word, "—");
});
test("every listed form has rules, meaning and a translated example", () => {
  assert.equal(verbForms.length, 24);
  for (const f of verbForms) {
    assert.ok(
      f.meaning && f.rules.length && f.example && f.translation && f.note,
    );
    for (const v of verbs) {
      const value = conjugate(v)[f.id];
      assert.ok(value.word && value.reading);
      assert.equal(value.word.includes("undefined"), false);
    }
  }
  assert.equal(derivedPatterns.length, 18);
});
test("course progress reflects completed sections and answers, not just position", () => {
  const qs = questions.filter((q) => q.unit === 1);
  const total = qs.length + 6;
  assert.equal(courseProgress(1, {}).percent, 0);
  assert.equal(courseProgress(1, { "lessonStep:1": 5 }).percent, 0);
  assert.equal(courseProgress(1, { "seen:1:0": true }).done, 1);
  assert.equal(
    courseProgress(1, { ["answer:" + qs[0].id]: { correct: false } }).done,
    1,
  );
  assert.equal(courseProgress(1, { "completed:1": true }).percent, 100);
  assert.equal(courseProgress(1, {}).total, total);
  assert.deepEqual(courseProgress(103, { "seen:103:0": true }), {
    done: 1,
    total: 5,
    percent: 20,
  });
});
test("new and legacy card sessions and reference progress remain importable", () => {
  const event = (key: string, value: unknown) => ({
    id: crypto.randomUUID(),
    key,
    value,
    at: new Date().toISOString(),
  });
  const old = {
    id: "test",
    ids: ["v001", "v002"],
    index: 1,
    flipped: false,
    mode: "meaning",
    finished: false,
  };
  assert.equal(isEvent(event("cardSession", old)), true);
  assert.equal(
    isEvent(event("cardSession", { ...old, ratedIds: ["v002"] })),
    true,
  );
  assert.equal(
    isEvent(event("cardSession", { ...old, ratedIds: ["v003"] })),
    false,
  );
  assert.equal(
    isEvent(event("cardSession", { ...old, ratedIds: ["v001", "v001"] })),
    false,
  );
  assert.equal(isEvent(event("referenceSeen:kana-basic", true)), true);
});
