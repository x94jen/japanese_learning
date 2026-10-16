export type VerbGroup = "godan" | "ichidan" | "suru" | "kuru";
export type Verb = {
  id: string;
  word: string;
  reading: string;
  meaning: string;
  group: VerbGroup;
};
export const verbs: Verb[] = [
  { id: "kaku", word: "書く", reading: "かく", meaning: "寫", group: "godan" },
  {
    id: "oyogu",
    word: "泳ぐ",
    reading: "およぐ",
    meaning: "游泳",
    group: "godan",
  },
  {
    id: "hanasu",
    word: "話す",
    reading: "はなす",
    meaning: "說話",
    group: "godan",
  },
  {
    id: "matsu",
    word: "待つ",
    reading: "まつ",
    meaning: "等待",
    group: "godan",
  },
  {
    id: "yomu",
    word: "読む",
    reading: "よむ",
    meaning: "閱讀",
    group: "godan",
  },
  {
    id: "asobu",
    word: "遊ぶ",
    reading: "あそぶ",
    meaning: "玩耍",
    group: "godan",
  },
  {
    id: "shinu",
    word: "死ぬ",
    reading: "しぬ",
    meaning: "死亡",
    group: "godan",
  },
  { id: "kau", word: "買う", reading: "かう", meaning: "買", group: "godan" },
  {
    id: "kaeru",
    word: "帰る",
    reading: "かえる",
    meaning: "回去",
    group: "godan",
  },
  { id: "iku", word: "行く", reading: "いく", meaning: "去", group: "godan" },
  {
    id: "aru",
    word: "ある",
    reading: "ある",
    meaning: "存在（物品等）",
    group: "godan",
  },
  {
    id: "taberu",
    word: "食べる",
    reading: "たべる",
    meaning: "吃",
    group: "ichidan",
  },
  {
    id: "miru",
    word: "見る",
    reading: "みる",
    meaning: "看",
    group: "ichidan",
  },
  {
    id: "okiru",
    word: "起きる",
    reading: "おきる",
    meaning: "起床",
    group: "ichidan",
  },
  { id: "suru", word: "する", reading: "する", meaning: "做", group: "suru" },
  {
    id: "benkyou",
    word: "勉強する",
    reading: "べんきょうする",
    meaning: "學習",
    group: "suru",
  },
  { id: "kuru", word: "来る", reading: "くる", meaning: "來", group: "kuru" },
];
export const groupNames: Record<VerbGroup, string> = {
  godan: "第一類・五段動詞",
  ichidan: "第二類・一段動詞",
  suru: "第三類・する系",
  kuru: "第三類・来る",
};
export type FormId =
  | "dictionary"
  | "stem"
  | "polite"
  | "politeNegative"
  | "politePast"
  | "politePastNegative"
  | "negative"
  | "negativePast"
  | "te"
  | "ta"
  | "negativeTe"
  | "negativeWithout"
  | "potential"
  | "passive"
  | "causative"
  | "causativePassive"
  | "volitional"
  | "imperative"
  | "prohibition"
  | "ba"
  | "negativeBa"
  | "tara"
  | "negativeTara"
  | "zu";
export type VerbForm = {
  id: FormId;
  title: string;
  meaning: string;
  rules: string[];
  example: string;
  translation: string;
  note: string;
};
export const verbForms: VerbForm[] = [
  {
    id: "dictionary",
    title: "辭書形／普通形現在肯定",
    meaning: "表非過去的動作、習慣或一般事實，也是許多句型的接續起點。",
    rules: [
      "使用字典列出的形式：書く、食べる、する、来る。",
      "動詞普通形還包含ない、た、なかった，不只辭書形。",
    ],
    example: "毎日、日本語の本を読む。",
    translation: "我每天讀日文書。",
    note: "普通形可以出現在禮貌句內，不能只看到普通形就認定失禮。",
  },
  {
    id: "stem",
    title: "ます語幹／連用形",
    meaning: "接ます、たい、ながら、すぎる等常見表達。",
    rules: [
      "五段：最後う段音改同列い段。",
      "一段：去掉る。",
      "する→し；来る→来（き）。",
    ],
    example: "音楽を聞きながら、料理をします。",
    translation: "我一邊聽音樂一邊做菜。",
    note: "連用形有更多語法用途；本表著重ます語幹，不等於所有音便形式。",
  },
  {
    id: "polite",
    title: "ます形",
    meaning: "禮貌地描述現在、未來或習慣。",
    rules: [
      "ます語幹＋ます：書きます、食べます。",
      "する→します；来る→来ます（きます）。",
    ],
    example: "明日、資料を送ります。",
    translation: "我明天會寄送資料。",
    note: "ます形是丁寧語，不能直接當作完整的尊敬語或謙讓語。",
  },
  {
    id: "politeNegative",
    title: "ません形",
    meaning: "禮貌地描述非過去否定。",
    rules: ["ます語幹＋ません。"],
    example: "今日はお酒を飲みません。",
    translation: "我今天不喝酒。",
    note: "ませんか也可形成邀請，要依整句判斷。",
  },
  {
    id: "politePast",
    title: "ました形",
    meaning: "禮貌地描述過去或已完成的事件。",
    rules: ["ます語幹＋ました。"],
    example: "昨日、先生に会いました。",
    translation: "我昨天見到了老師。",
    note: "不需先把辭書形變成た形，再加ました。",
  },
  {
    id: "politePastNegative",
    title: "ませんでした形",
    meaning: "禮貌地描述過去沒有發生的動作。",
    rules: ["ます語幹＋ませんでした。"],
    example: "昨日は外へ出かけませんでした。",
    translation: "我昨天沒有出門。",
    note: "不要寫成ますでした或ませんだった。",
  },
  {
    id: "negative",
    title: "ない形",
    meaning: "普通形否定，也是義務、否定請求等句型的基礎。",
    rules: [
      "五段：う段改あ段＋ない；う結尾要改わない。",
      "一段：去る＋ない。",
      "する→しない；来る→来ない（こない）。",
      "ある的否定是ない。",
    ],
    example: "今日は車を使わない。",
    translation: "今天不用車。",
    note: "買う→買わない，不是買あない；帰る是五段，帰らない。",
  },
  {
    id: "negativePast",
    title: "なかった形",
    meaning: "普通形的過去否定。",
    rules: [
      "ない形最後的ない改成なかった。",
      "しない→しなかった；来ない→来なかった。",
    ],
    example: "昨日は雨が降らなかった。",
    translation: "昨天沒有下雨。",
    note: "不要寫ないでした；禮貌說法可用ませんでした。",
  },
  {
    id: "te",
    title: "て形",
    meaning: "連接動作，也作為請求、進行、授受等句型的接續。",
    rules: [
      "五段う・つ・る→って；む・ぶ・ぬ→んで。",
      "五段く→いて、ぐ→いで、す→して；行く例外為行って。",
      "一段去る＋て；する→して；来る→来て（きて）。",
    ],
    example: "手を洗ってから、ご飯を食べます。",
    translation: "洗手之後再吃飯。",
    note: "て形本身不固定表示現在時態；整句時態通常由最後述語決定。",
  },
  {
    id: "ta",
    title: "た形",
    meaning: "普通形過去、完成，也接經驗、順序與條件等句型。",
    rules: [
      "將て形的て改た、で改だ：書いて→書いた、読んで→読んだ。",
      "行く→行った；する→した；来る→来た（きた）。",
    ],
    example: "日本へ行ったことがあります。",
    translation: "我曾經去過日本。",
    note: "た形在たほうがいい等句型中不必然表示動作已做完。",
  },
  {
    id: "negativeTe",
    title: "なくて",
    meaning: "連接否定狀態，常表原因或並列，也用於なくてもいい等句型。",
    rules: ["ない形最後ない改なくて。", "ある→なくて；する→しなくて。"],
    example: "時間がなくて、昼ご飯を食べられませんでした。",
    translation: "因為沒有時間，我沒能吃午餐。",
    note: "與ないで不是任何地方都能互換；なくてもいい表示不必做。",
  },
  {
    id: "negativeWithout",
    title: "ないで",
    meaning: "不做前項而做後項，也接ください形成否定請求。",
    rules: ["ない形＋で：書かないで、食べないで。"],
    example: "朝ご飯を食べないで、出かけました。",
    translation: "我沒吃早餐就出門了。",
    note: "描述不做某動作的方法或伴隨情況時常用ないで；不要和原因的なくて混用。",
  },
  {
    id: "potential",
    title: "可能形",
    meaning: "能做某事，或條件容許。",
    rules: [
      "五段：う段改え段＋る。",
      "一段：去る＋られる。",
      "する→できる；来る→来られる（こられる）。",
    ],
    example: "この漢字が読めますか。",
    translation: "你能讀這個漢字嗎？",
    note: "正式備考先用食べられる；食べれる是口語ら抜き。ある一般不用規則可能形。",
  },
  {
    id: "passive",
    title: "被動形／受身",
    meaning: "以受到動作影響的人或事物為主語；也有間接受害用法。",
    rules: [
      "五段：あ段＋れる；う結尾為われる。",
      "一段：去る＋られる。",
      "する→される；来る→来られる（こられる）。",
    ],
    example: "私は先生に褒められました。",
    translation: "我被老師稱讚了。",
    note: "一段與来る的可能、被動外形相同，要看主語、助詞及情境。",
  },
  {
    id: "causative",
    title: "使役形",
    meaning: "讓、叫或允許某人做某事。",
    rules: [
      "五段：あ段＋せる；う結尾為わせる。",
      "一段：去る＋させる。",
      "する→させる；来る→来させる（こさせる）。",
    ],
    example: "先生は学生に作文を書かせました。",
    translation: "老師讓學生寫作文。",
    note: "使役不一定強迫，也可表示允許；に、を的選擇需配合原動詞與句意。",
  },
  {
    id: "causativePassive",
    title: "使役被動形",
    meaning: "被要求或被迫做某事。",
    rules: [
      "五段：あ段＋せられる；一段：去る＋させられる。",
      "する→させられる；来る→来させられる（こさせられる）。",
      "部分五段有短形，如書かされる；す結尾不用同一短縮規則。",
    ],
    example: "私は長い時間待たせられました。",
    translation: "我被迫等了很長時間。",
    note: "本表先列完整形式。話させられる不能機械縮成話さされる。",
  },
  {
    id: "volitional",
    title: "意志形",
    meaning: "表自己的意向、提議或邀請；也接と思う。",
    rules: [
      "五段：う段改お段＋う。",
      "一段：去る＋よう。",
      "する→しよう；来る→来よう（こよう）。",
    ],
    example: "週末は図書館へ行こうと思います。",
    translation: "我打算週末去圖書館。",
    note: "並非只有邀請別人的用法；意志形＋と思っている可表已有的打算。",
  },
  {
    id: "imperative",
    title: "命令形",
    meaning: "強烈指示，常見於警告、標語或特定關係。",
    rules: [
      "五段：う段改え段。",
      "一段：去る＋ろ（書面也有よ）。",
      "する→しろ／せよ；来る→来い（こい）。",
    ],
    example: "危ない！止まれ！",
    translation: "危險！停下！",
    note: "不是日常工作請求的預設說法。使用場合比性別更重要。",
  },
  {
    id: "prohibition",
    title: "禁止：辭書形＋な",
    meaning: "強烈禁止對方做某事。",
    rules: ["所有類型都用辭書形＋な。"],
    example: "ここに入るな。",
    translation: "不准進入這裡。",
    note: "食べるな是禁止吃；食べなさい是命令吃，意思相反。",
  },
  {
    id: "ba",
    title: "ば形",
    meaning: "提出條件、一般關係，也接ばいい、ば…ほど。",
    rules: [
      "五段：う段改え段＋ば。",
      "一段：去る＋れば。",
      "する→すれば；来る→来れば（くれば）。",
    ],
    example: "時間があれば、図書館へ行きます。",
    translation: "如果有時間，我就去圖書館。",
    note: "後項限制需看語境與主體關係，不能只記「絕對不能接意志」。",
  },
  {
    id: "negativeBa",
    title: "なければ：否定條件",
    meaning: "如果不做；也可形成なければならない的義務表達。",
    rules: ["ない形最後ない改なければ。"],
    example: "早く出なければ、電車に間に合いません。",
    translation: "不早點出門的話，就趕不上電車。",
    note: "なければならない是必須做，不是禁止做；雙重否定要整組理解。",
  },
  {
    id: "tara",
    title: "たら形",
    meaning: "如果…，或完成前項後再做後項。",
    rules: ["た形＋ら：書いたら、読んだら、したら。"],
    example: "駅に着いたら、電話してください。",
    translation: "到車站後請打電話。",
    note: "並非只談過去；即使た形作基礎，也能說未來條件。",
  },
  {
    id: "negativeTara",
    title: "なかったら：否定條件",
    meaning: "如果沒有做／如果不是某種情況。",
    rules: ["なかった形＋ら。"],
    example: "明日雨が降らなかったら、散歩に行きます。",
    translation: "明天如果不下雨，我就去散步。",
    note: "未來假設也能使用，不要只看到なかった就判為過去。",
  },
  {
    id: "zu",
    title: "ず：書面否定接續",
    meaning: "不做…而…，常見ずに；語氣較書面。",
    rules: ["ない形去ない＋ず；する例外為せず。", "来る→来ず（こず）。"],
    example: "辞書を使わずに、読んでみます。",
    translation: "我試著不用字典讀看看。",
    note: "する不是しず；古語、方言及進階文語另屬其他範圍。",
  },
];
const u = "うくぐすつぬぶむる",
  a = "わかがさたなばまら",
  i = "いきぎしちにびみり",
  e = "えけげせてねべめれ",
  o = "おこごそとのぼもろ";
function formsFor(
  text: string,
  group: VerbGroup,
  verbId: string,
  isReading: boolean,
): Record<FormId, string> {
  let stem = "",
    negative = "",
    te = "",
    potential = "",
    passive = "",
    causative = "",
    cp = "",
    volitional = "",
    imperative = "",
    ba = "",
    zu = "";
  const base = text.slice(0, -1),
    last = text.slice(-1);
  if (group === "godan") {
    const index = u.indexOf(last);
    if (index < 0) throw Error("Unsupported verb ending");
    stem = base + i[index];
    negative = verbId === "aru" ? "ない" : base + a[index] + "ない";
    const suffix = ["う", "つ", "る"].includes(last)
      ? "って"
      : ["ぬ", "ぶ", "む"].includes(last)
        ? "んで"
        : last === "く"
          ? "いて"
          : last === "ぐ"
            ? "いで"
            : "して";
    te = verbId === "iku" ? base + "って" : base + suffix;
    potential = base + e[index] + "る";
    passive = base + a[index] + "れる";
    causative = base + a[index] + "せる";
    cp = base + a[index] + "せられる";
    volitional = base + o[index] + "う";
    imperative = base + e[index];
    ba = base + e[index] + "ば";
    zu = verbId === "aru" ? "あらず" : negative.slice(0, -2) + "ず";
    if (verbId === "aru") {
      potential = passive = causative = cp = imperative = "—";
    }
  } else if (group === "ichidan") {
    stem = base;
    negative = base + "ない";
    te = base + "て";
    potential = passive = base + "られる";
    causative = base + "させる";
    cp = base + "させられる";
    volitional = base + "よう";
    imperative = base + "ろ";
    ba = base + "れば";
    zu = base + "ず";
  } else if (group === "suru") {
    const prefix = text.slice(0, -2);
    stem = prefix + "し";
    negative = prefix + "しない";
    te = prefix + "して";
    potential = prefix + "できる";
    passive = prefix + "される";
    causative = prefix + "させる";
    cp = prefix + "させられる";
    volitional = prefix + "しよう";
    imperative = prefix + "しろ";
    ba = prefix + "すれば";
    zu = prefix + "せず";
  } else {
    stem = isReading ? "き" : "来";
    negative = isReading ? "こない" : "来ない";
    te = isReading ? "きて" : "来て";
    potential = passive = isReading ? "こられる" : "来られる";
    causative = isReading ? "こさせる" : "来させる";
    cp = isReading ? "こさせられる" : "来させられる";
    volitional = isReading ? "こよう" : "来よう";
    imperative = isReading ? "こい" : "来い";
    ba = isReading ? "くれば" : "来れば";
    zu = isReading ? "こず" : "来ず";
  }
  const ta = te.slice(0, -1) + (te.endsWith("で") ? "だ" : "た");
  const negBase = negative.slice(0, -2);
  return {
    dictionary: text,
    stem,
    polite: stem + "ます",
    politeNegative: stem + "ません",
    politePast: stem + "ました",
    politePastNegative: stem + "ませんでした",
    negative,
    negativePast: negBase + "なかった",
    te,
    ta,
    negativeTe: negBase + "なくて",
    negativeWithout: negative + "で",
    potential,
    passive,
    causative,
    causativePassive: cp,
    volitional,
    imperative,
    prohibition: text + "な",
    ba,
    negativeBa: negBase + "なければ",
    tara: ta + "ら",
    negativeTara: negBase + "なかったら",
    zu,
  };
}
export function conjugate(verb: Verb) {
  const words = formsFor(verb.word, verb.group, verb.id, false),
    readings = formsFor(verb.reading, verb.group, verb.id, true);
  return Object.fromEntries(
    verbForms.map((f) => [
      f.id,
      { word: words[f.id], reading: readings[f.id] },
    ]),
  ) as Record<FormId, { word: string; reading: string }>;
}
export const derivedPatterns = [
  {
    base: "ます語幹",
    pattern: "〜たい",
    meaning: "想做；後續依い形容詞活用",
    example: "日本へ行きたいです。",
    translation: "我想去日本。",
  },
  {
    base: "ます語幹",
    pattern: "〜ながら",
    meaning: "一邊…一邊…，主體通常相同",
    example: "音楽を聞きながら歩きます。",
    translation: "我一邊聽音樂一邊走路。",
  },
  {
    base: "ます語幹",
    pattern: "〜やすい／〜にくい",
    meaning: "容易／不容易做",
    example: "この本は読みやすいです。",
    translation: "這本書容易閱讀。",
  },
  {
    base: "ます語幹",
    pattern: "〜すぎる",
    meaning: "做得過度",
    example: "昨日は食べすぎました。",
    translation: "我昨天吃太多了。",
  },
  {
    base: "ます語幹",
    pattern: "〜なさい",
    meaning: "指導或命令，不是一般對客禮貌請求",
    example: "名前を書きなさい。",
    translation: "把名字寫下來。",
  },
  {
    base: "て形",
    pattern: "〜ている",
    meaning: "進行、結果狀態或習慣",
    example: "今、本を読んでいます。",
    translation: "我現在正在讀書。",
  },
  {
    base: "て形",
    pattern: "〜てある",
    meaning: "人為動作完成後留下的狀態",
    example: "ドアが開けてあります。",
    translation: "門事先被打開了，現在開著。",
  },
  {
    base: "て形",
    pattern: "〜ておく",
    meaning: "預作準備或保持狀態",
    example: "資料を読んでおきます。",
    translation: "我會先讀好資料。",
  },
  {
    base: "て形",
    pattern: "〜てみる",
    meaning: "嘗試做",
    example: "この方法を試してみます。",
    translation: "我試試這個方法。",
  },
  {
    base: "て形",
    pattern: "〜てしまう",
    meaning: "完成；也可帶遺憾",
    example: "財布を忘れてしまいました。",
    translation: "我不小心忘了帶錢包。",
  },
  {
    base: "て形",
    pattern: "〜てくれる／〜てもらう",
    meaning: "別人為我做／我接受別人幫忙",
    example: "友達に教えてもらいました。",
    translation: "我請朋友教我了。",
  },
  {
    base: "て形",
    pattern: "〜ていく／〜てくる",
    meaning: "動作方向或隨時間的變化",
    example: "だんだん寒くなってきました。",
    translation: "天氣漸漸變冷了。",
  },
  {
    base: "た形",
    pattern: "〜たことがある",
    meaning: "曾有某經驗",
    example: "京都へ行ったことがあります。",
    translation: "我曾去過京都。",
  },
  {
    base: "た形",
    pattern: "〜たり…〜たりする",
    meaning: "列舉代表行為，不保證順序",
    example: "本を読んだり、映画を見たりします。",
    translation: "我會讀書、看電影等。",
  },
  {
    base: "た形",
    pattern: "〜たほうがいい",
    meaning: "建議最好做；不表示已做完",
    example: "早く寝たほうがいいです。",
    translation: "最好早點睡。",
  },
  {
    base: "ない形",
    pattern: "〜ないでください",
    meaning: "請不要做",
    example: "ここで走らないでください。",
    translation: "請不要在這裡奔跑。",
  },
  {
    base: "ない形",
    pattern: "〜なくてもいい",
    meaning: "不必做，而非禁止",
    example: "今日は来なくてもいいです。",
    translation: "今天不來也可以。",
  },
  {
    base: "ない形",
    pattern: "〜なければならない",
    meaning: "必須做",
    example: "薬を飲まなければなりません。",
    translation: "我必須吃藥。",
  },
];
export const honorifics = [
  {
    normal: "行く・来る・いる",
    respect: "いらっしゃる",
    humble: "伺う／参る（去、來）；おる（在）",
    note: "いらっしゃる的ます形為いらっしゃいます，非一般五段規則。",
  },
  {
    normal: "言う",
    respect: "おっしゃる",
    humble: "申す／申し上げる",
    note: "ます形是おっしゃいます。",
  },
  {
    normal: "する",
    respect: "なさる",
    humble: "いたす",
    note: "ます形是なさいます。",
  },
  {
    normal: "食べる・飲む",
    respect: "召し上がる",
    humble: "いただく",
    note: "依動作是誰做、敬意朝向誰來選擇。",
  },
  {
    normal: "見る",
    respect: "ご覧になる",
    humble: "拝見する",
    note: "不能為抬高自己而把自己的動作用尊敬語。",
  },
  {
    normal: "くれる",
    respect: "くださる",
    humble: "—",
    note: "ます形是くださいます；收到用いただく等另行表達。",
  },
];
export type Kana = { hira: string; kata: string; romaji: string };
const row = (h: string, k: string, r: string): Kana[] =>
  h.split(" ").map((hira, i) => ({
    hira,
    kata: k.split(" ")[i],
    romaji: r.split(" ")[i],
  }));
export const kanaRows = [
  {
    label: "あ行",
    cells: row("あ い う え お", "ア イ ウ エ オ", "a i u e o"),
  },
  {
    label: "か行",
    cells: row("か き く け こ", "カ キ ク ケ コ", "ka ki ku ke ko"),
  },
  {
    label: "さ行",
    cells: row("さ し す せ そ", "サ シ ス セ ソ", "sa shi su se so"),
  },
  {
    label: "た行",
    cells: row("た ち つ て と", "タ チ ツ テ ト", "ta chi tsu te to"),
  },
  {
    label: "な行",
    cells: row("な に ぬ ね の", "ナ ニ ヌ ネ ノ", "na ni nu ne no"),
  },
  {
    label: "は行",
    cells: row("は ひ ふ へ ほ", "ハ ヒ フ ヘ ホ", "ha hi fu he ho"),
  },
  {
    label: "ま行",
    cells: row("ま み む め も", "マ ミ ム メ モ", "ma mi mu me mo"),
  },
  {
    label: "や行",
    cells: [
      row("や", "ヤ", "ya")[0],
      null,
      row("ゆ", "ユ", "yu")[0],
      null,
      row("よ", "ヨ", "yo")[0],
    ],
  },
  {
    label: "ら行",
    cells: row("ら り る れ ろ", "ラ リ ル レ ロ", "ra ri ru re ro"),
  },
  {
    label: "わ行",
    cells: [
      row("わ", "ワ", "wa")[0],
      null,
      null,
      null,
      { hira: "を", kata: "ヲ", romaji: "o / wo" },
    ],
  },
  { label: "撥音", cells: [row("ん", "ン", "n")[0], null, null, null, null] },
];
export const voicedRows = [
  {
    label: "が行",
    cells: row("が ぎ ぐ げ ご", "ガ ギ グ ゲ ゴ", "ga gi gu ge go"),
  },
  {
    label: "ざ行",
    cells: row("ざ じ ず ぜ ぞ", "ザ ジ ズ ゼ ゾ", "za ji zu ze zo"),
  },
  {
    label: "だ行",
    cells: row("だ ぢ づ で ど", "ダ ヂ ヅ デ ド", "da ji zu de do"),
  },
  {
    label: "ば行",
    cells: row("ば び ぶ べ ぼ", "バ ビ ブ ベ ボ", "ba bi bu be bo"),
  },
  {
    label: "ぱ行",
    cells: row("ぱ ぴ ぷ ぺ ぽ", "パ ピ プ ペ ポ", "pa pi pu pe po"),
  },
];
export const contractedRows = [
  {
    label: "きゃ行",
    cells: row("きゃ きゅ きょ", "キャ キュ キョ", "kya kyu kyo"),
  },
  {
    label: "しゃ行",
    cells: row("しゃ しゅ しょ", "シャ シュ ショ", "sha shu sho"),
  },
  {
    label: "ちゃ行",
    cells: row("ちゃ ちゅ ちょ", "チャ チュ チョ", "cha chu cho"),
  },
  {
    label: "にゃ行",
    cells: row("にゃ にゅ にょ", "ニャ ニュ ニョ", "nya nyu nyo"),
  },
  {
    label: "ひゃ行",
    cells: row("ひゃ ひゅ ひょ", "ヒャ ヒュ ヒョ", "hya hyu hyo"),
  },
  {
    label: "みゃ行",
    cells: row("みゃ みゅ みょ", "ミャ ミュ ミョ", "mya myu myo"),
  },
  {
    label: "りゃ行",
    cells: row("りゃ りゅ りょ", "リャ リュ リョ", "rya ryu ryo"),
  },
  {
    label: "ぎゃ行",
    cells: row("ぎゃ ぎゅ ぎょ", "ギャ ギュ ギョ", "gya gyu gyo"),
  },
  {
    label: "じゃ行",
    cells: row("じゃ じゅ じょ", "ジャ ジュ ジョ", "ja ju jo"),
  },
  {
    label: "びゃ行",
    cells: row("びゃ びゅ びょ", "ビャ ビュ ビョ", "bya byu byo"),
  },
  {
    label: "ぴゃ行",
    cells: row("ぴゃ ぴゅ ぴょ", "ピャ ピュ ピョ", "pya pyu pyo"),
  },
];
export const foreignSounds = row(
  "ふぁ ふぃ ふぇ ふぉ てぃ でぃ とぅ どぅ うぃ うぇ うぉ しぇ ちぇ じぇ",
  "ファ フィ フェ フォ ティ ディ トゥ ドゥ ウィ ウェ ウォ シェ チェ ジェ",
  "fa fi fe fo ti di tu du wi we wo she che je",
);
export const referenceSections = [
  "kana-basic",
  "kana-voiced",
  "kana-combo",
  "kana-sounds",
  "verb-groups",
  "verb-forms",
] as const;
