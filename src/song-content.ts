export type SongCue = {
  timed?: boolean;
  reading?: string;
  tokens?: { text: string; reading?: string }[];
  marked?: string;
  terms?: { word: string; reading: string; meaning: string }[];
  patterns?: {
    pattern: string;
    formation: string;
    meaning: string;
    warning: string;
  }[];
  start: number;
  end: number;
  text: string;
  translation: string;
  note: string;
  words: string[];
  grammar: string[];
};
export type Song = {
  title: string;
  artist: string;
  videoId: string;
  source: string;
  cues: SongCue[];
  provenance?: string;
  offset?: number;
  timingVersion?: string;
};
const finite = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 86400;
const str = (v: unknown, max: number) =>
  typeof v === "string" && v.length <= max;
export function validSong(value: unknown): value is Song {
  if (!value || typeof value !== "object") return false;
  const s = value as Song;
  return (
    (s.offset === undefined ||
      (typeof s.offset === "number" &&
        Number.isFinite(s.offset) &&
        Math.abs(s.offset) <= 600)) &&
    (s.timingVersion === undefined || str(s.timingVersion, 80)) &&
    str(s.title, 160) &&
    !!s.title.trim() &&
    str(s.artist, 100) &&
    ((s.videoId === "" && s.source === "") ||
      (/^[\w-]{11}$/.test(s.videoId) &&
        str(s.source, 500) &&
        youtubeId(s.source) === s.videoId)) &&
    (s.provenance === undefined || str(s.provenance, 2000)) &&
    Array.isArray(s.cues) &&
    s.cues.length > 0 &&
    s.cues.length <= 300 &&
    s.cues.every(
      (c, i) =>
        c &&
        finite(c.start) &&
        finite(c.end) &&
        (c.timed === undefined || typeof c.timed === "boolean") &&
        (c.timed === false
          ? c.start === 0 && c.end === 0
          : c.end > c.start &&
            s.cues
              .slice(0, i)
              .filter((p) => p.timed !== false)
              .every((p) => c.start >= p.end)) &&
        (c.reading === undefined || str(c.reading, 1600)) &&
        (c.tokens === undefined ||
          (Array.isArray(c.tokens) &&
            c.tokens.length <= 800 &&
            c.tokens.every(
              (t) =>
                t &&
                str(t.text, 800) &&
                (t.reading === undefined || str(t.reading, 1600)),
            ) &&
            c.tokens.map((t) => t.text).join("") === c.text)) &&
        (c.marked === undefined ||
          (str(c.marked, 3000) &&
            c.marked.replace(/\[(g|f|w):([^\]]+)\]/g, "$2") === c.text)) &&
        (c.terms === undefined ||
          (Array.isArray(c.terms) &&
            c.terms.length <= 30 &&
            c.terms.every(
              (t) =>
                t &&
                str(t.word, 100) &&
                str(t.reading, 200) &&
                str(t.meaning, 600),
            ))) &&
        (c.patterns === undefined ||
          (Array.isArray(c.patterns) &&
            c.patterns.length <= 15 &&
            c.patterns.every(
              (p) =>
                p &&
                ["pattern", "formation", "meaning", "warning"].every((k) =>
                  str(p[k as keyof typeof p], 1000),
                ),
            ))) &&
        str(c.text, 800) &&
        !!c.text.trim() &&
        str(c.translation, 1500) &&
        str(c.note, 2000) &&
        ["words", "grammar"].every(
          (k) =>
            Array.isArray(c[k as "words"]) &&
            c[k as "words"].length <= 30 &&
            c[k as "words"].every(
              (id) => typeof id === "string" && /^[\w-]{1,80}$/.test(id),
            ),
        ),
    )
  );
}
export function youtubeId(input: string) {
  try {
    const u = new URL(input);
    if (u.protocol !== "https:") return "";
    const host = u.hostname.toLowerCase();
    const id =
      host === "youtu.be"
        ? u.pathname.slice(1)
        : [
              "youtube.com",
              "www.youtube.com",
              "m.youtube.com",
              "www.youtube-nocookie.com",
            ].includes(host)
          ? u.pathname.startsWith("/embed/") ||
            u.pathname.startsWith("/shorts/")
            ? u.pathname.split("/")[2]
            : u.searchParams.get("v") || ""
          : "";
    return /^[\w-]{11}$/.test(id) ? id : "";
  } catch {
    return "";
  }
}
function seconds(s: string) {
  const a = s.replace(",", ".").split(":").map(Number);
  if (
    a.length < 2 ||
    a.length > 3 ||
    a.some((n) => !Number.isFinite(n) || n < 0) ||
    a.at(-1)! >= 60 ||
    (a.length === 3 && a[1] >= 60)
  )
    throw Error("字幕時間格式不正確");
  return a.reduce((n, v) => n * 60 + v, 0);
}
export function parseSubtitles(raw: string): SongCue[] {
  if (raw.length > 250000) throw Error("字幕檔過大，請限制在 250 KB 文字內");
  const blocks = raw
    .replace(/^\uFEFF/, "")
    .replace(/\r/g, "")
    .split(/\n\s*\n/);
  const cues: SongCue[] = [];
  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (!block.trim() || /^(WEBVTT|NOTE|STYLE|REGION)(\s|$)/.test(lines[0]))
      continue;
    const index = lines.findIndex((l) => l.includes("-->"));
    if (index < 0) throw Error("請使用含時間軸的 SRT 或 VTT 字幕");
    const match = lines[index].match(
      /^(\d{1,2}:\d{2}(?::\d{2})?[.,]\d{3})\s*-->\s*(\d{1,2}:\d{2}(?::\d{2})?[.,]\d{3})(?:\s.*)?$/,
    );
    if (!match) throw Error("字幕時間格式不正確");
    const text = lines
      .slice(index + 1)
      .join("\n")
      .replace(/<[^>]*>/g, "")
      .trim();
    cues.push({
      start: seconds(match[1]),
      end: seconds(match[2]),
      text,
      translation: "",
      note: "",
      words: [],
      grammar: [],
    });
  }
  const dummy: Song = {
    title: "字幕",
    artist: "",
    videoId: "abcdefghijk",
    source: "https://www.youtube.com/watch?v=abcdefghijk",
    cues,
  };
  if (!validSong(dummy))
    throw Error(
      "字幕需有 1～300 句、時間不得重疊，且每句結束時間必須晚於開始時間",
    );
  return cues;
}
export function cueAt(cues: SongCue[], time: number) {
  return cues.findIndex(
    (c) => c.timed !== false && time >= c.start && time < c.end,
  );
}
export function formatTime(t: number) {
  return `${Math.floor(t / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(t % 60)
    .toString()
    .padStart(2, "0")}`;
}
export const songCollections = [
  {
    name: "代表歌曲 · 建議先學",
    titles: ["怪獣の花唄", "踊り子", "不可幸力", "東京フラッシュ"],
  },
  {
    name: "動畫／戲劇歌曲參考",
    titles: [
      "裸の勇者",
      "CHAINSAW BLOOD",
      "タイムパラドックス",
      "そんなbitterな話",
      "恋風邪にのせて",
    ],
  },
  {
    name: "使用者提供的近期巡演參考",
    titles: [
      "泣き地蔵",
      "ホムンクルス",
      "風神",
      "しわあわせ",
      "再会",
      "花占い",
      "replica",
      "呼び声",
      "soramimi",
      "Tokimeki",
    ],
  },
];

// LRCLIB uses LRC timestamps; retain repeated lines and combine simultaneous entries.
export function parseLrc(raw: string): SongCue[] {
  if (raw.length > 250000) throw Error("字幕檔過大");
  const lines: { start: number; text: string }[] = [];
  for (const line of raw.replace(/\r/g, "").split("\n")) {
    const stamps = [
      ...line.matchAll(/\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g),
    ];
    const text = line.replace(/\[[^\]]*\]/g, "").trim();
    if (!text) continue;
    for (const stamp of stamps) {
      if (+stamp[2] >= 60) throw Error("字幕時間格式不正確");
      lines.push({
        start: +stamp[1] * 60 + +stamp[2] + Number(`0.${stamp[3] || "0"}`),
        text,
      });
    }
  }
  lines.sort((a, b) => a.start - b.start);
  const merged: typeof lines = [];
  for (const line of lines) {
    if (merged.at(-1)?.start === line.start)
      merged[merged.length - 1].text += `\n${line.text}`;
    else merged.push({ ...line });
  }
  const cues = merged.map((line, i) => ({
    ...line,
    end: merged[i + 1]?.start ?? line.start + 5,
    translation: "",
    note: "",
    words: [],
    grammar: [],
  }));
  if (!validSong({ title: "LRC", artist: "", videoId: "", source: "", cues }))
    throw Error("找不到有效時間軸，字幕需為 1～300 句");
  return cues;
}
