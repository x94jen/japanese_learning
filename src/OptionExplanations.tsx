import { vocab, type Vocab } from "./content";
import type { Question } from "./content";
import { JP } from "./JapaneseText";
import { optionExplanations } from "./option-explanations";
import "./option-explanations.css";
export default function OptionExplanations({
  question: q,
  order = [0, 1, 2, 3],
  selected,
}: {
  question: Question;
  order?: number[];
  selected?: number;
}) {
  const explanations = optionExplanations(q);
  return (
    <section className="option-explanations" aria-label="四個選項逐項解析">
      <h3>四個選項，逐一看懂</h3>
      <ol>
        {order.map((index, position) => (
          <li
            key={index}
            data-option-index={index}
            className={
              index === q.answer ? "answer-correct" : "answer-distractor"
            }
          >
            <div className="option-explanation-heading">
              <span className="option-explanation-number">{position + 1}</span>
              <strong>
                <JP text={q.options[index]} />
              </strong>
              <span className="option-explanation-status">
                {index === q.answer ? "正確答案" : "不適合本題"}
                {selected === index ? " · 你的選擇" : ""}
              </span>
            </div>
            {q.optionTranslations?.[index] && (
              <p className="translation">{q.optionTranslations[index]}</p>
            )}
            <p className="option-reason">{explanations[index]}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function WordOptionExplanations({
  word,
  choices,
  selected,
}: {
  word: import("./content").Vocab;
  choices: import("./content").Vocab[];
  selected: number;
}) {
  return (
    <section className="option-explanations" aria-label="四個選項逐項解析">
      <h3>四個選項，逐一看懂</h3>
      <ol>
        {choices.map((v, i) => (
          <li
            key={v.id}
            data-option-index={i}
            className={
              v.id === word.id ? "answer-correct" : "answer-distractor"
            }
          >
            <div className="option-explanation-heading">
              <span className="option-explanation-number">{i + 1}</span>
              <strong>{v.meaning}</strong>
              <span className="option-explanation-status">
                {v.id === word.id ? "正確答案" : "不適合本題"}
                {selected === i ? " · 你的選擇" : ""}
              </span>
            </div>
            <p className="option-reason">
              {v.id === word.id
                ? `「${word.word}」（${word.reading}）在本句表示「${word.meaning}」。${word.confusion}`
                : `這個意思對應詞庫的「${v.word}」（${v.reading}，${v.pos}），常見搭配是「${v.collocation}」。本題問「${word.word}」（${word.reading}）在句中的意思，應為「${word.meaning}」，不能因另一個詞的中文意思熟悉就套入。`}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function WordMistakeExplanations({
  word,
  mistake,
}: {
  word: Vocab;
  mistake: unknown;
}) {
  const m = mistake as { optionIds?: string[]; selectedMeaning?: string };
  if (!m?.optionIds) return null;
  const choices = m.optionIds.map((id) => vocab.find((v) => v.id === id));
  if (choices.length !== 4 || choices.some((v) => !v)) return null;
  return (
    <WordOptionExplanations
      word={word}
      choices={choices as Vocab[]}
      selected={choices.findIndex((v) => v!.meaning === m.selectedMeaning)}
    />
  );
}
