import { readingMap } from "./JapaneseText";
import type { Song } from "./song-content";
type Token = { surface_form: string; reading?: string };
type Tokenizer = { tokenize(text: string): Token[] };
declare global {
  interface Window {
    kuromoji?: {
      builder(options: { dicPath: string }): {
        build(done: (error: unknown, tokenizer: Tokenizer) => void): void;
      };
    };
  }
}
let pending: Promise<Tokenizer> | undefined;
function loadTokenizer() {
  if (pending) return pending;
  const base = `${(import.meta as unknown as { env: { BASE_URL: string } }).env.BASE_URL}song-reader/`;
  pending = new Promise<Tokenizer>((resolve, reject) => {
    const script = document.createElement("script");
    const timer = setTimeout(() => {
      pending = undefined;
      script.remove();
      reject(Error("假名字典載入逾時，可稍後重試。"));
    }, 60000);
    script.src = `${base}kuromoji.js`;
    script.onload = () =>
      window
        .kuromoji!.builder({ dicPath: `${base}dict/` })
        .build((error, tokenizer) => {
          clearTimeout(timer);
          if (error) {
            pending = undefined;
            reject(Error("無法載入假名字典，請檢查網路後重試。"));
          } else resolve(tokenizer);
        });
    script.onerror = () => {
      clearTimeout(timer);
      pending = undefined;
      script.remove();
      reject(Error("無法載入假名工具。"));
    };
    document.head.append(script);
  });
  return pending;
}
export async function addSongReadings(song: Song): Promise<Song> {
  const tokenizer = await loadTokenizer();
  return {
    ...song,
    cues: song.cues.map((c) => {
      const tokens = tokenizer.tokenize(c.text).map((t) => ({
        text: t.surface_form,
        ...(t.reading && /[一-龯々]/.test(t.surface_form)
          ? {
              reading: t.reading.replace(/[ァ-ヶ]/g, (ch) =>
                String.fromCharCode(ch.charCodeAt(0) - 96),
              ),
            }
          : {}),
      }));
      readingMap[c.text] = tokens;
      return {
        ...c,
        tokens,
        reading: c.reading || tokens.map((t) => t.reading || t.text).join(""),
      };
    }),
  };
}
