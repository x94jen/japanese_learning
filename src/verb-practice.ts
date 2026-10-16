import {
  verbs,
  verbForms,
  conjugate,
  groupNames,
  type FormId,
} from "./basics-content";
import type { Question } from "./content";
export type VerbQuestion = Question & {
  verbId: string;
  formId: FormId;
  practiceKind: "transform" | "sentence";
};
const make = (
  verbId: string,
  formId: FormId,
  kind: "transform" | "sentence",
  index: number,
  passage?: string,
  translation?: string,
): VerbQuestion | null => {
  const verb = verbs.find((v) => v.id === verbId)!;
  const form = verbForms.find((f) => f.id === formId)!;
  const forms = conjugate(verb);
  const target = forms[formId];
  if (target.word === "—") return null;
  const distractors = [
    ...new Set(verbForms.map((f) => forms[f.id].word)),
  ].filter((w) => w !== target.word && w !== "—");
  const offset = index % distractors.length;
  const wrong = Array.from(
    { length: 3 },
    (_, i) => distractors[(offset + i) % distractors.length],
  );
  return {
    id: `qverb-${kind}-${verbId}-${formId}`,
    unit: 200,
    type: kind === "transform" ? "動詞形式變化" : "動詞句子填空",
    verbId,
    formId,
    practiceKind: kind,
    prompt:
      kind === "transform"
        ? `請將「${verb.word}（${verb.reading}，${verb.meaning}）」改成「${form.title}」。`
        : `${translation}\n依語意與句型接續，選出空格應填入的完整動詞形式。`,
    passage,
    translation: translation ?? `${verb.meaning}：${form.meaning}`,
    options: [target.word, ...wrong],
    answer: 0,
    explanation: `${verb.word}（${verb.reading}，${verb.meaning}）是${groupNames[verb.group]}。${form.title}：${target.word}（${target.reading}）。\n變化規則：${form.rules.join("；")}\n用途：${form.meaning}`,
    trap: form.note,
    related: [],
  };
};
// 本站自編練習；形式轉換由同一份基礎變化規則產生，不宣稱官方試題。
const transformations = verbs.flatMap((v, vi) =>
  verbForms.flatMap((f, fi) => {
    const q = make(v.id, f.id, "transform", vi + fi);
    return q ? [q] : [];
  }),
);
const contexts: [string, FormId, string, string][] = [
  [
    "kaku",
    "dictionary",
    "毎日、日記を＿＿。",
    "每天寫日記。（使用普通體非過去肯定）",
  ],
  ["yomu", "stem", "この本は＿＿やすいです。", "這本書容易閱讀。"],
  [
    "matsu",
    "polite",
    "ここで友達を＿＿。",
    "我在這裡等朋友。（使用禮貌體非過去肯定）",
  ],
  [
    "iku",
    "politeNegative",
    "今日は学校へ＿＿。",
    "今天不去學校。（使用禮貌體非過去否定）",
  ],
  [
    "kau",
    "politePast",
    "昨日、新しい靴を＿＿。",
    "昨天買了新鞋。（使用禮貌體過去肯定）",
  ],
  [
    "benkyou",
    "politePastNegative",
    "昨日は日本語を＿＿。",
    "昨天沒有學日文。（使用禮貌體過去否定）",
  ],
  [
    "aru",
    "negative",
    "今日は時間が＿＿。",
    "今天沒有時間。（使用普通體非過去否定）",
  ],
  [
    "kuru",
    "negativePast",
    "昨日、田中さんは＿＿。",
    "昨天田中先生沒有來。（使用普通體過去否定）",
  ],
  ["iku", "te", "駅へ＿＿ください。", "請去車站。"],
  ["taberu", "ta", "朝ご飯を＿＿後で、出かけます。", "吃完早餐後出門。"],
  [
    "yomu",
    "negativeTe",
    "説明を＿＿、困りました。",
    "因為沒有讀說明，所以不知所措。（用なくて表示原因）",
  ],
  [
    "taberu",
    "negativeWithout",
    "朝ご飯を＿＿学校へ行きました。",
    "沒吃早餐就去學校了。（使用ないで）",
  ],
  [
    "hanasu",
    "potential",
    "私は日本語が＿＿。",
    "我能說日文。（使用普通體可能形）",
  ],
  [
    "kaku",
    "passive",
    "この手紙は先生によって＿＿。",
    "這封信由老師書寫。（以被動非過去形式描述）",
  ],
  [
    "taberu",
    "causative",
    "母は子供に野菜を＿＿。",
    "母親讓孩子吃蔬菜。（使用普通體使役形）",
  ],
  [
    "matsu",
    "causativePassive",
    "私はいつもここで長く＿＿。",
    "我總是被迫在這裡等很久。（使用完整使役被動形）",
  ],
  [
    "suru",
    "volitional",
    "よし、今から宿題を＿＿。",
    "好，現在開始做作業吧。（使用普通體意志形）",
  ],
  [
    "kuru",
    "imperative",
    "「早くここへ＿＿！」",
    "「快到這裡來！」（使用直接命令形，語氣強烈）",
  ],
  [
    "iku",
    "prohibition",
    "「危ない！そちらへ＿＿！」",
    "「危險！不准往那裡去！」（使用な禁止形）",
  ],
  [
    "yomu",
    "ba",
    "この本を＿＿、理由が分かります。",
    "如果讀這本書，就會明白原因。（使用ば條件形）",
  ],
  [
    "benkyou",
    "negativeBa",
    "もっと＿＿、合格は難しいです。",
    "如果不再多讀點書，就很難及格。（使用否定ば形）",
  ],
  [
    "kaeru",
    "tara",
    "家に＿＿、電話してください。",
    "回到家後，請打電話。（使用たら條件形）",
  ],
  [
    "kuru",
    "negativeTara",
    "明日、田中さんが＿＿、私たちだけで始めましょう。",
    "明天如果田中先生沒來，我們就自己開始吧。（使用否定たら形）",
  ],
  [
    "suru",
    "zu",
    "何も＿＿に寝てしまいました。",
    "什麼都沒做就睡著了。（ずに前只填ず形）",
  ],
];
export const verbPracticeQuestions: VerbQuestion[] = [
  ...transformations,
  ...contexts.map(([v, f, p, t], i) => make(v, f, "sentence", i, p, t)!),
];
