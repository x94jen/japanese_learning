import { requestLyrics } from "./lyrics-service";
import { parseLrc, validSong, type Song } from "./song-content";
export type ConcertTrack = {
  id: string;
  title: string;
  videoId: string;
  duration: number;
  lyricDuration?: number;
  firstVocal?: number;
  referenceUrl: string;
  summary: string;
  focus: string;
  words: { word: string; reading: string; meaning: string }[];
  grammar: {
    pattern: string;
    meaning: string;
    example: string;
    translation: string;
  }[];
};
export const concertTracks: ConcertTrack[] = [
  {
    id: "odoriko",
    referenceUrl: "https://www.marumaru-x.com/japanese-song/play-v7n3k7x7ok",
    title: "踊り子",
    videoId: "7HgJIAUtICU",
    duration: 245,
    firstVocal: 18,
    summary:
      "練習描述回憶、關係的變化與反覆發生的動作。讀歌詞時，留意主詞省略與比喻，不必把每個意象都理解成具體事件。",
    focus: "回憶與反覆動作",
    words: [
      { word: "踊る", reading: "おどる", meaning: "跳舞" },
      { word: "思い出", reading: "おもいで", meaning: "回憶" },
      { word: "回る", reading: "まわる", meaning: "轉動；繞行" },
      { word: "置く", reading: "おく", meaning: "放置；留下" },
    ],
    grammar: [
      {
        pattern: "〜ような",
        meaning: "像……一樣的；後接名詞。",
        example: "夢のような時間でした。",
        translation: "那是一段如夢一般的時光。",
      },
      {
        pattern: "〜ている",
        meaning: "可以表示正在進行，也可表示動作結果持續。",
        example: "あの時のことを覚えています。",
        translation: "我還記得那時候的事。",
      },
    ],
  },
  {
    id: "tokyo-flash",
    referenceUrl: "https://www.marumaru-x.com/japanese-song/play-vxn5w73jn9",
    title: "東京フラッシュ",
    videoId: "SIuF37EWaLU",
    duration: 262,
    summary:
      "從都市夜晚與人際距離切入，練習分辨直接表達、試探與含蓄的語氣。注意說話者與對象未必每句都會明說。",
    focus: "都會情境與含蓄語氣",
    words: [
      { word: "都会", reading: "とかい", meaning: "都市" },
      { word: "距離", reading: "きょり", meaning: "距離" },
      { word: "曖昧", reading: "あいまい", meaning: "模糊；不明確" },
      { word: "誘う", reading: "さそう", meaning: "邀請；引誘" },
    ],
    grammar: [
      {
        pattern: "〜てもいい",
        meaning: "可以……；詢問許可。",
        example: "少し隣に座ってもいいですか。",
        translation: "我可以在旁邊坐一下嗎？",
      },
      {
        pattern: "〜なくても",
        meaning: "即使不……也……。",
        example: "急がなくても大丈夫です。",
        translation: "不用急也沒關係。",
      },
    ],
  },
  {
    id: "fukakoryoku",
    referenceUrl: "https://www.marumaru-x.com/japanese-song/play-94oglmkpr0",
    title: "不可幸力",
    videoId: "Gbz2C2gQREI",
    duration: 201,
    summary:
      "曲名將一般詞彙「不可抗力」換成「幸」，可作為思考幸福與無法控制之力量的入口。學習時分清楚既有詞彙與作品創造的用字。",
    focus: "造詞、抽象概念與語氣",
    words: [
      {
        word: "不可抗力",
        reading: "ふかこうりょく",
        meaning: "非人力所能控制的力量",
      },
      { word: "幸福", reading: "こうふく", meaning: "幸福" },
      { word: "世界", reading: "せかい", meaning: "世界" },
      { word: "求める", reading: "もとめる", meaning: "尋求；要求" },
    ],
    grammar: [
      {
        pattern: "〜てしまう",
        meaning: "完成某動作，或帶有不由自主、遺憾等語氣。",
        example: "考えすぎて疲れてしまいました。",
        translation: "想得太多，結果累壞了。",
      },
      {
        pattern: "〜のに",
        meaning: "明明……卻……；表示與預期相反。",
        example: "休んだのに、まだ眠いです。",
        translation: "明明休息過了，卻還是很睏。",
      },
    ],
  },
  {
    id: "hadaka-no-yusha",
    referenceUrl: "https://www.marumaru-x.com/japanese-song/play-72r9mye9oz",
    title: "裸の勇者",
    videoId: "FT0GKCuSaW0",
    duration: 200,
    firstVocal: 0,
    summary:
      "以勇氣、傷痛與保護他人為學習主題。注意「裸」在作品語境中也可能讓人聯想到沒有防備、卸下偽裝，而非只指身體狀態。",
    focus: "勇氣、決心與保護",
    words: [
      { word: "勇者", reading: "ゆうしゃ", meaning: "勇者" },
      { word: "守る", reading: "まもる", meaning: "守護；遵守" },
      { word: "涙", reading: "なみだ", meaning: "眼淚" },
      { word: "悪意", reading: "あくい", meaning: "惡意" },
    ],
    grammar: [
      {
        pattern: "〜ために",
        meaning: "為了某個目的。",
        example: "大切な人を守るために、強くなりたいです。",
        translation: "為了保護重要的人，我想變得更強。",
      },
      {
        pattern: "〜ても",
        meaning: "即使……也……。",
        example: "怖くても、一歩進みます。",
        translation: "即使害怕，我也要向前一步。",
      },
    ],
  },
  {
    id: "shiwaawase",
    firstVocal: 35,
    lyricDuration: 273,
    referenceUrl: "https://www.marumaru-x.com/japanese-song/play-lkrz50g0re",
    title: "しわあわせ",
    videoId: "JwmGruvGt_I",
    duration: 338,
    summary:
      "曲名可讓人聯想到「しわ」（皺紋）、「合わせる」（使相合）與「幸せ」（幸福）的聲音關係。先練習用自己的日文描述陪伴、時間與共同經歷。",
    focus: "陪伴、時間與詞語聯想",
    words: [
      { word: "皺", reading: "しわ", meaning: "皺紋；摺痕" },
      { word: "幸せ", reading: "しあわせ", meaning: "幸福" },
      { word: "重ねる", reading: "かさねる", meaning: "重疊；累積" },
      { word: "一緒", reading: "いっしょ", meaning: "一起" },
    ],
    grammar: [
      {
        pattern: "〜ていく",
        meaning: "從現在往後持續，或逐漸變化。",
        example: "これからも一緒に歩いていきたいです。",
        translation: "今後也想一起走下去。",
      },
      {
        pattern: "〜ながら",
        meaning: "一邊……一邊……。",
        example: "昔の写真を見ながら話しました。",
        translation: "我們一邊看以前的照片一邊聊天。",
      },
    ],
  },
  {
    id: "hanauranai",
    referenceUrl: "https://www.marumaru-x.com/japanese-song/play-g9r050egnv",
    title: "花占い",
    videoId: "onhBN0qkUcE",
    duration: 236,
    summary:
      "以花占卜的意象，練習描述期待、猶豫與想確認對方心意的感受。以下為自編學習例句。",
    focus: "心意、期待與不確定",
    words: [
      { word: "占い", reading: "うらない", meaning: "占卜" },
      { word: "恋", reading: "こい", meaning: "戀愛；愛慕" },
      { word: "願う", reading: "ねがう", meaning: "盼望；祈願" },
      { word: "気持ち", reading: "きもち", meaning: "心情；心意" },
    ],
    grammar: [
      {
        pattern: "〜かもしれない",
        meaning: "也許……；保留可能性。",
        example: "明日はいいことがあるかもしれません。",
        translation: "明天也許會有好事發生。",
      },
      {
        pattern: "〜てほしい",
        meaning: "希望對方做某件事。",
        example: "私の気持ちを知ってほしいです。",
        translation: "希望你能知道我的心意。",
      },
    ],
  },
  {
    id: "tokimeki",
    referenceUrl: "https://www.marumaru-x.com/japanese-song/play-wdr6qvyvn3",
    title: "Tokimeki",
    videoId: "-_PKhPMXMDY",
    duration: 232,
    summary:
      "練習表達心動、期待新事物與日常中的驚喜。將身體感受到的悸動與情緒用語一起記住。以下例句為自編。",
    focus: "心動、驚喜與感受",
    words: [
      { word: "ときめく", reading: "ときめく", meaning: "心跳加速；心動" },
      { word: "胸", reading: "むね", meaning: "胸口；內心" },
      { word: "楽しみ", reading: "たのしみ", meaning: "期待；樂趣" },
      { word: "出会う", reading: "であう", meaning: "相遇" },
    ],
    grammar: [
      {
        pattern: "〜たびに",
        meaning: "每當……就……。",
        example: "この曲を聞くたびに、元気になります。",
        translation: "每次聽到這首歌，我都會有精神。",
      },
      {
        pattern: "〜そう",
        meaning: "看起來……；從外觀推測。",
        example: "楽しそうな声が聞こえます。",
        translation: "聽得見開心的聲音。",
      },
    ],
  },
  {
    id: "tobu-toki",
    referenceUrl: "https://www.marumaru-x.com/japanese-song/play-y8rj9kg3n9",
    title: "飛ぶ時",
    videoId: "ARj1adoUoEU",
    duration: 254,
    firstVocal: 19,
    summary:
      "從飛翔與向前邁進的意象，練習描述決心、方向與克服不安。機器假名須配合原唱核對，以下中文例句為自編。",
    focus: "飛翔、方向與決心",
    words: [
      { word: "飛ぶ", reading: "とぶ", meaning: "飛翔；跳躍" },
      { word: "翼", reading: "つばさ", meaning: "翅膀" },
      { word: "向かう", reading: "むかう", meaning: "前往；面向" },
      { word: "怖い", reading: "こわい", meaning: "害怕；可怕" },
    ],
    grammar: [
      {
        pattern: "〜ようとする",
        meaning: "試著……；正要……。",
        example: "新しい一歩を踏み出そうとしています。",
        translation: "我正試著踏出新的一步。",
      },
      {
        pattern: "〜前に",
        meaning: "在……之前。",
        example: "出発する前に、空を見上げました。",
        translation: "出發之前，我抬頭望了天空。",
      },
    ],
  },
];
export async function fetchConcertSong(
  track: ConcertTrack,
  signal?: AbortSignal,
): Promise<Song> {
  const params = new URLSearchParams({
    track_name: track.title,
    artist_name: "Vaundy",
  });
  const records = await requestLyrics(`/api/search?${params}`, signal);
  if (!Array.isArray(records)) throw Error("歌詞回傳格式不正確。");
  const candidates = records
    .filter(
      (r) =>
        r &&
        typeof r.syncedLyrics === "string" &&
        r.syncedLyrics.length <= 250000 &&
        typeof r.duration === "number" &&
        r.trackName === track.title &&
        /vaundy/i.test(r.artistName || ""),
    )
    .sort(
      (a, b) =>
        Math.abs(a.duration - (track.lyricDuration ?? track.duration)) -
        Math.abs(b.duration - (track.lyricDuration ?? track.duration)),
    );
  let cues: Song["cues"] | undefined;
  for (const record of candidates) {
    try {
      cues = parseLrc(record.syncedLyrics);
      break;
    } catch {
      /* try another timeline */
    }
  }
  if (!cues)
    throw Error(
      "目前找不到可用的逐句歌詞；可先開啟官方影片，或匯入自己的字幕。",
    );
  // An authored first-vocal anchor checks the intro only, not the rest of the timeline.
  const shift =
    track.firstVocal === undefined ? 0 : track.firstVocal - cues[0].start;
  const song: Song = {
    timingVersion: `concert-${track.videoId}-intro-v2`,
    title: track.title,
    artist: "Vaundy",
    videoId: track.videoId,
    source: `https://www.youtube.com/watch?v=${track.videoId}`,
    cues: cues.map((c) => ({
      ...c,
      start: c.start + shift,
      end: c.end + shift,
    })),
    provenance: `官方 MV · 逐句歌詞由 LRCLIB 即時取得。${track.firstVocal === undefined ? "MV 全曲時間尚待逐句校對，請以校時工具調整。" : "已依影片的字幕／段落標記對齊第一句；其餘逐句時間仍需核對。"}假名為機器分析；中文學習例句為自編，並非歌詞翻譯。`,
  };
  if (!validSong(song))
    throw Error("這份歌詞與影片時間無法對齊，請選用其他字幕版本。");
  return song;
}

export function alignConcertIntro(song: Song): Song {
  const track = concertTracks.find(
    (t) => t.videoId === song.videoId && t.title === song.title,
  );
  if (
    !track ||
    track.firstVocal === undefined ||
    song.cues.some((c) => c.timed === false)
  )
    return song;
  const version = `concert-${track.videoId}-intro-v2`;
  if (song.timingVersion === version) return song;
  const delta = track.firstVocal - song.cues[0].start;
  const next: Song = {
    ...song,
    offset: 0,
    timingVersion: version,
    cues: song.cues.map((c) => ({
      ...c,
      start: c.start + delta,
      end: c.end + delta,
    })),
    provenance: `${song.provenance || ""} 第一行已更新至影片 ${track.firstVocal} 秒；其餘逐句仍須核對。`,
  };
  return validSong(next) ? next : song;
}
