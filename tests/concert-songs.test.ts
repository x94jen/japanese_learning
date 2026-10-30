import { test } from "node:test";
import assert from "node:assert/strict";
import { concertTracks, fetchConcertSong } from "../src/concert-songs";
import { validSong } from "../src/song-content";
test("five distinct concert lessons have official videos and original Chinese study guides", () => {
  assert.equal(concertTracks.length, 5);
  assert.equal(new Set(concertTracks.map((t) => t.videoId)).size, 5);
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
