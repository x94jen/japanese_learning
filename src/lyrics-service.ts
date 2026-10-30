const client = "Hiyori v1.0 (https://github.com/x94jen/japanese_learning)";
const cooldowns = new Map<string, number>();
export async function requestLyrics(
  path: string,
  signal?: AbortSignal,
): Promise<unknown> {
  const remaining = (cooldowns.get(path) || 0) - Date.now();
  if (remaining > 0)
    throw Error(
      `歌詞服務需要稍候，請約 ${Math.ceil(remaining / 1000)} 秒後再試。`,
    );
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetch(`https://lrclib.net${path}`, {
      headers: { "Lrclib-Client": client },
      signal: signal || AbortSignal.timeout(15000),
    });
    if (response.ok) return response.json();
    if (response.status === 429 || response.status === 503) {
      const raw = response.headers.get("Retry-After");
      const parsed =
        raw && /^\d+(\.\d+)?$/.test(raw)
          ? Number(raw) * 1000
          : raw
            ? Date.parse(raw) - Date.now()
            : 60000;
      const wait = Math.max(1000, Number.isFinite(parsed) ? parsed : 1000);
      cooldowns.set(path, Date.now() + wait);
      if (response.status === 503 && attempt === 0 && wait <= 3000) {
        await new Promise((resolve) =>
          setTimeout(resolve, wait + Math.random() * 250),
        );
        continue;
      }
      throw Error(
        `歌詞服務暫時忙碌，請約 ${Math.ceil(wait / 1000)} 秒後再試；仍可先看影片與中文重點。`,
      );
    }
    throw Error(
      response.status === 404
        ? "找不到符合的歌曲版本。"
        : "歌詞服務暫時無法使用，請稍後重試。",
    );
  }
  throw Error("歌詞服務暫時無法使用。");
}
