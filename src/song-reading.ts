import { readingMap } from "./JapaneseText";
const rows = [
  ["あいうえお", "a i u e o"],
  ["かきくけこ", "ka ki ku ke ko"],
  ["さしすせそ", "sa shi su se so"],
  ["たちつてと", "ta chi tsu te to"],
  ["なにぬねの", "na ni nu ne no"],
  ["はひふへほ", "ha hi fu he ho"],
  ["まみむめも", "ma mi mu me mo"],
  ["やゆよ", "ya yu yo"],
  ["らりるれろ", "ra ri ru re ro"],
  ["わをん", "wa wo n"],
  ["がぎぐげご", "ga gi gu ge go"],
  ["ざじずぜぞ", "za ji zu ze zo"],
  ["だぢづでど", "da ji zu de do"],
  ["ばびぶべぼ", "ba bi bu be bo"],
  ["ぱぴぷぺぽ", "pa pi pu pe po"],
  ["ぁぃぅぇぉゔ", "a i u e o vu"],
];
const table: Record<string, string> = {};
for (const [kana, latin] of rows)
  [...kana].forEach((c, i) => {
    table[c] = latin.split(" ")[i];
  });
export function songRomaji(text: string, reading?: string) {
  const kana = (
    reading ||
    readingMap[text]?.map((t) => t.reading || t.text).join("") ||
    text
  ).replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
  if (/[一-龯々]/.test(kana)) return "";
  let out = "";
  for (let i = 0; i < kana.length; i++) {
    const c = kana[i];
    if (c === "っ") {
      const next = table[kana[i + 1]];
      if (next && !/^[aeioun]/.test(next))
        out += next.startsWith("ch") ? "t" : next[0];
      continue;
    }
    if (c === "ー") {
      out += out.match(/[aeiou]$/)?.[0] || "";
      continue;
    }
    let value = table[c];
    if (value && "ゃゅょ".includes(kana[i + 1] || " ") && value.endsWith("i")) {
      const vowel = { ゃ: "a", ゅ: "u", ょ: "o" }[kana[++i]];
      value = /^(shi|chi|ji)$/.test(value)
        ? value.slice(0, -1) + vowel
        : value.slice(0, -1) + "y" + vowel;
    }
    if (c === "ん" && /^[あいうえおやゆよ]/.test(kana[i + 1] || " "))
      value = "n'";
    out += value || c;
  }
  return out;
}
