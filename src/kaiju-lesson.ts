import timing from "./kaiju-timing.json";
import type { Song } from "./song-content";
import { withSongStudy } from "./song-study";
export const kaijuLessonId = "kaiju-official-mv";
export const kaijuLesson: Song = withSongStudy({
  timingVersion: "official-mv-v1",
  title: "怪獣の花唄",
  artist: "Vaundy",
  videoId: "UM9XNpgrqVk",
  source: "https://www.youtube.com/watch?v=UM9XNpgrqVk",
  provenance:
    "官方 MV 版 · 依影片字幕逐句校時，第一句 00:08。假名、中文沿用使用者提供的歌詞整理。",
  cues: timing.map((c, i) => ({
    ...c,
    end: timing[i + 1]?.start ?? 223,
    translation: "",
    note: "",
    words: [],
    grammar: [],
  })),
});
const normalized = (text: string) => text.replace(/[\s（）()。、！？!?]/g, "");
// Only migrate recognized sequences of this exact video; never alter another recording.
export function alignOfficialKaiju(song: Song): Song {
  if (
    song.videoId !== kaijuLesson.videoId ||
    !song.title.includes("怪獣の花唄")
  )
    return song;
  if (song.timingVersion === "official-mv-v1") return song;
  let cursor = 0;
  const matches = song.cues.map((c) => {
    const i = kaijuLesson.cues.findIndex(
      (known, i) =>
        i >= cursor && normalized(known.text) === normalized(c.text),
    );
    if (i < 0) return undefined;
    cursor = i + 1;
    return kaijuLesson.cues[i];
  });
  if (matches.some((c) => !c)) return song;
  return {
    ...song,
    offset: 0,
    timingVersion: "official-mv-v1",
    cues: song.cues.map((c, i) => ({
      ...c,
      start: matches[i]!.start,
      end: matches[i]!.end,
      timed: true,
    })),
  };
}
