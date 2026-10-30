import notes from "./song-study-notes.json";
import type { Song } from "./song-content";
export type SongStudy = {
  translation: string;
  reading: string;
  tokens: { text: string; reading?: string }[];
};
export function songStudy(text: string): SongStudy | undefined {
  const key = text.replace(/^[（(]|[）)]$/g, "").trim();
  const entry = (notes as Record<string, SongStudy>)[key];
  if (!entry || key === text) return entry;
  return {
    ...entry,
    tokens: [
      ...(text.startsWith("(") || text.startsWith("（")
        ? [{ text: text[0] }]
        : []),
      ...entry.tokens,
      ...(text.endsWith(")") || text.endsWith("）")
        ? [{ text: text.at(-1)! }]
        : []),
    ],
  };
}
export function withSongStudy(song: Song): Song {
  if (!song.title.includes("怪獣の花唄") || !/vaundy/i.test(song.artist))
    return song;
  return {
    ...song,
    cues: song.cues.map((c) => {
      const entry = songStudy(c.text);
      return entry
        ? {
            ...c,
            translation: c.translation || entry.translation,
            reading: c.reading || entry.reading,
          }
        : c;
    }),
  };
}
