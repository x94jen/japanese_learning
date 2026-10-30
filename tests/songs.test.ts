import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseSubtitles,
  validSong,
  youtubeId,
  cueAt,
  type Song,
} from "../src/song-content";
import { isEvent, mergeEvents, reduceEvents } from "../src/engine";
const raw =
  "1\n00:00:01,000 --> 00:00:03,500\n予定を確認します。\n\n2\n00:00:05,000 --> 00:00:08,000\n忘れないうちに、メモします。";
const song: Song = {
  title: "自編測試",
  artist: "本站",
  videoId: "abcdefghijk",
  source: "https://www.youtube.com/watch?v=abcdefghijk",
  cues: parseSubtitles(raw),
};
test("SRT and VTT retain cues and resolve only the active time interval", () => {
  assert.equal(song.cues.length, 2);
  assert.equal(song.cues[0].end, 3.5);
  assert.equal(cueAt(song.cues, 1), 0);
  assert.equal(cueAt(song.cues, 3.5), -1);
  assert.equal(cueAt(song.cues, 5), 1);
  assert.equal(
    parseSubtitles(
      "WEBVTT\n\n00:01.000 --> 00:03.000 align:start\n<b>予定</b>を確認します。",
    )[0].text,
    "予定を確認します。",
  );
  for (const bad of [
    "歌詞だけ",
    "1\n00:00:05,000 --> 00:00:02,000\nテスト",
    raw.replace("00:00:05,000", "00:00:02,000"),
  ])
    assert.throws(() => parseSubtitles(bad));
});
test("YouTube URLs are restricted to the supported HTTPS hosts and exact IDs", () => {
  assert.equal(youtubeId("https://youtu.be/abcdefghijk?si=abc"), "abcdefghijk");
  assert.equal(
    youtubeId("https://www.youtube.com/watch?v=abcdefghijk"),
    "abcdefghijk",
  );
  for (const bad of [
    "https://youtube.com.evil.test/watch?v=abcdefghijk",
    "javascript:alert(1)",
    "http://youtu.be/abcdefghijk",
    "https://www.youtube.com/watch?v=short",
  ])
    assert.equal(youtubeId(bad), "");
});
test("song data, notes, progress and favorites survive existing backup and event merging", () => {
  assert.ok(validSong(song));
  assert.ok(!validSong({ ...song, cues: [{ ...song.cues[0], text: "" }] }));
  const values = [
    ["song:test", song],
    ["songProgress:test", { cue: 1, time: 5 }],
    ["songFavorite:test:1", true],
  ] as const;
  const events = values.map(([key, value], i) => ({
    id: crypto.randomUUID(),
    key,
    value,
    at: new Date(1000 + i).toISOString(),
  }));
  assert.ok(events.every(isEvent));
  assert.equal(mergeEvents(events, events).length, 3);
  assert.deepEqual(
    reduceEvents(JSON.parse(JSON.stringify(events)))["song:test"],
    song,
  );
  assert.ok(!isEvent({ ...events[1], value: { cue: 1, time: -1 } }));
  assert.ok(!isEvent({ ...events[0], value: { ...song, videoId: "bad" } }));
});

test("untimed private lessons preserve readings and teaching without invented timestamps or video IDs", () => {
  const untimed = {
    ...song,
    videoId: "",
    source: "",
    provenance: "使用者提供",
    cues: [
      {
        ...song.cues[0],
        start: 0,
        end: 0,
        timed: false,
        reading: "よていをかくにんします。",
        marked: "[w:予定]を確認します。",
        terms: [{ word: "予定", reading: "よてい", meaning: "預定" }],
        patterns: [
          {
            pattern: "を",
            formation: "名詞＋を＋動詞",
            meaning: "動作的對象",
            warning: "不是主語",
          },
        ],
      },
    ],
  };
  assert.ok(validSong(untimed));
  assert.equal(cueAt(untimed.cues, 0), -1);
  assert.ok(!validSong({ ...untimed, cues: [{ ...untimed.cues[0], end: 1 }] }));
  assert.ok(
    !validSong({
      ...untimed,
      cues: [{ ...untimed.cues[0], marked: "[w:別の文字]" }],
    }),
  );
  const event = {
    id: crypto.randomUUID(),
    key: "song:private",
    at: new Date().toISOString(),
    value: untimed,
  };
  assert.ok(isEvent(JSON.parse(JSON.stringify(event))));
  const mixed = {
    ...untimed,
    cues: [
      { ...untimed.cues[0], start: 2, end: 4, timed: true },
      untimed.cues[0],
      { ...untimed.cues[0], start: 3, end: 5, timed: true },
    ],
  };
  assert.ok(!validSong(mixed));
});

test("LRC handles repeated timestamps, simultaneous cues and rejects malformed timelines", async () => {
  const { parseLrc } = await import("../src/song-content");
  const cues = parseLrc(
    "[ar:Example]\n[00:01.50][00:04.00]自編句子\n[00:01.50]第二行\n[00:07.00]結尾",
  );
  assert.equal(cues.length, 3);
  assert.equal(cues[0].start, 1.5);
  assert.equal(cues[0].end, 4);
  assert.equal(cues[0].text, "自編句子\n第二行");
  assert.throws(() => parseLrc("[00:99.00]無效"));
  assert.throws(() => parseLrc("[ar:No lyrics]"));
});
