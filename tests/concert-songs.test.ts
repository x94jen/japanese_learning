import { test } from "node:test";
import assert from "node:assert/strict";
import {
  concertTracks,
  fetchConcertSong,
  alignConcertIntro,
} from "../src/concert-songs";
import { validSong } from "../src/song-content";
test("eight distinct concert lessons have official videos and original Chinese study guides", () => {
  assert.equal(concertTracks.length, 8);
  assert.equal(new Set(concertTracks.map((t) => t.videoId)).size, 8);
  for (const t of concertTracks) {
    assert.match(t.videoId, /^[\w-]{11}$/);
    assert.equal(t.words.length, 4);
    assert.equal(t.grammar.length, 2);
    assert.ok(
      t.summary &&
        t.focus &&
        t.grammar.every((g) => g.example && g.translation),
    );
  }
});
test("lyrics lookup validates data, selects the nearest recording and aligns only the known first vocal", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify([
          {
            trackName: "踊り子",
            artistName: "Vaundy",
            duration: 500,
            syncedLyrics: "broken",
          },
          {
            trackName: "踊り子",
            artistName: "Vaundy",
            duration: 245,
            syncedLyrics: "[00:03.00]自編練習\n[00:05.00]次の行",
          },
        ]),
      );
    const song = await fetchConcertSong(concertTracks[0]);
    assert.equal(song.cues[0].start, 18);
    assert.equal(song.cues[1].start, 20);
    assert.ok(validSong(song));
    assert.match(song.provenance || "", /其餘逐句時間仍需核對/);
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify([
          {
            trackName: "other",
            artistName: "Vaundy",
            duration: 245,
            syncedLyrics: "[00:00.00]wrong",
          },
        ]),
      );
    await assert.rejects(
      () => fetchConcertSong(concertTracks[0]),
      /找不到可用/,
    );
    globalThis.fetch = async () => new Response("unavailable", { status: 500 });
    await assert.rejects(
      () => fetchConcertSong(concertTracks[0]),
      /暫時無法使用/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("saved Shiwa lessons migrate to 35 seconds once and preserve study notes", () => {
  const track = concertTracks.find((t) => t.title === "しわあわせ")!;
  const old = {
    title: track.title,
    artist: "Vaundy",
    videoId: track.videoId,
    source: `https://www.youtube.com/watch?v=${track.videoId}`,
    offset: 4,
    cues: [
      {
        start: 12,
        end: 15,
        text: "自編例句",
        translation: "我的筆記",
        note: "",
        words: [],
        grammar: [],
      },
      {
        start: 16,
        end: 20,
        text: "練習",
        translation: "",
        note: "",
        words: [],
        grammar: [],
      },
    ],
  };
  const updated = alignConcertIntro(old);
  assert.equal(updated.cues[0].start, 35);
  assert.equal(updated.cues[1].start, 39);
  assert.equal(updated.cues[0].translation, "我的筆記");
  assert.equal(updated.offset, 0);
  const calibrated = { ...updated, offset: 1.5 };
  assert.equal(alignConcertIntro(calibrated), calibrated);
  const otherVideo = { ...old, videoId: "abcdefghijk" };
  assert.equal(alignConcertIntro(otherVideo), otherVideo);
});
test("Shiwa lookup matches audio duration rather than the MV outro", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify([
          {
            trackName: "しわあわせ",
            artistName: "Vaundy",
            duration: 338,
            syncedLyrics: "[00:02.00]自編甲\n[00:04.00]自編乙",
          },
          {
            trackName: "しわあわせ",
            artistName: "Vaundy",
            duration: 273,
            syncedLyrics: "[00:02.00]自編甲\n[00:08.00]自編乙",
          },
        ]),
      );
    const song = await fetchConcertSong(
      concertTracks.find((t) => t.title === "しわあわせ")!,
    );
    assert.equal(song.cues[0].start, 35);
    assert.equal(song.cues[1].start, 41);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
