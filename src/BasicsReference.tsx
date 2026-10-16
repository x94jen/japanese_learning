import { useState, type ComponentType, type CSSProperties } from "react";
import type { StudyStore } from "./store";
import {
  kanaRows,
  voicedRows,
  contractedRows,
  foreignSounds,
  verbs,
  verbForms,
  conjugate,
  groupNames,
  derivedPatterns,
  honorifics,
  referenceSections,
  type Kana,
  type Verb,
  type FormId,
} from "./basics-content";
type Props = {
  store: StudyStore;
  Audio: ComponentType<{ text: string; translation?: string }>;
  Japanese: ComponentType<{ text: string }>;
};
export default function BasicsReference({ store, Audio, Japanese }: Props) {
  const [tab, setTab] = useState("kana"),
    [kanaMode, setKanaMode] = useState("both"),
    [romaji, setRomaji] = useState(true),
    [selectedKana, setSelectedKana] = useState<Kana>({
      hira: "あ",
      kata: "ア",
      romaji: "a",
    }),
    [verbId, setVerbId] = useState("kaku"),
    [formId, setFormId] = useState<FormId>("te"),
    [showReadings, setShowReadings] = useState(true),
    [search, setSearch] = useState("");
  const verb = verbs.find((v) => v.id === verbId)!;
  const forms = conjugate(verb);
  const form = verbForms.find((f) => f.id === formId)!;
  const studied = referenceSections.filter(
    (id) => store.data[`referenceSeen:${id}`],
  ).length;
  function mark(id: string) {
    store.put(`referenceSeen:${id}`, true);
  }
  function Mark({ id }: { id: string }) {
    return (
      <button className="button outline small" onClick={() => mark(id)}>
        {store.data[`referenceSeen:${id}`]
          ? "這節已讀，可隨時回顧"
          : "完成這節閱讀"}
      </button>
    );
  }
  function KanaTable({
    rows,
    columns = 5,
  }: {
    rows: { label: string; cells: (Kana | null)[] }[];
    columns?: number;
  }) {
    return (
      <div
        className="kana-grid"
        style={{ "--kana-columns": columns } as CSSProperties}
      >
        <div className="kana-label">行</div>
        {(columns === 5
          ? romaji
            ? ["a", "i", "u", "e", "o"]
            : kanaMode === "kata"
              ? ["ア", "イ", "ウ", "エ", "オ"]
              : ["あ", "い", "う", "え", "お"]
          : romaji
            ? ["ya", "yu", "yo"]
            : ["ゃ", "ゅ", "ょ"]
        ).map((c) => (
          <div className="kana-column" key={c}>
            {c}
          </div>
        ))}
        {rows.map((row) => (
          <div className="kana-grid-row" key={row.label}>
            <div className="kana-label">{row.label}</div>
            {row.cells.map((cell, i) =>
              cell ? (
                <button
                  key={i}
                  aria-label={`選取 ${cell.hira} ${cell.kata}`}
                  className={selectedKana.hira === cell.hira ? "selected" : ""}
                  onClick={() => setSelectedKana(cell)}
                >
                  {kanaMode !== "kata" && (
                    <strong lang="ja">{cell.hira}</strong>
                  )}
                  {kanaMode !== "hira" && <span lang="ja">{cell.kata}</span>}
                  {romaji && <small>{cell.romaji}</small>}
                </button>
              ) : (
                <div className="kana-gap" key={i}>
                  —
                </div>
              ),
            )}
          </div>
        ))}
      </div>
    );
  }
  function FormWord({ v, id }: { v: Verb; id: FormId }) {
    const f = conjugate(v)[id];
    return (
      <span lang="ja" className="form-word">
        {showReadings && f.word !== f.reading && f.word !== "—" ? (
          <ruby>
            {f.word}
            <rt>{f.reading}</rt>
          </ruby>
        ) : (
          f.word
        )}
      </span>
    );
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">FOUNDATIONS · REFERENCE</div>
          <h1>五十音與動詞變化，一次查清楚。</h1>
          <p>
            從讀音到句型接續，先理解規則，再用例句確認。可隨時回到 N3 課程。
          </p>
        </div>
      </div>
      <section className="reference-progress">
        <div>
          <strong>基礎工具閱讀進度</strong>
          <span>
            {studied}/{referenceSections.length} 節 ·{" "}
            {Math.round((studied / referenceSections.length) * 100)}%
          </span>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-label="基礎工具閱讀進度"
          aria-valuemin={0}
          aria-valuemax={referenceSections.length}
          aria-valuenow={studied}
        >
          <i
            style={{ width: `${(studied / referenceSections.length) * 100}%` }}
          />
        </div>
        <p className="helper">
          按「完成這節閱讀」才記錄；閱讀進度不等於熟悉程度。
        </p>
      </section>
      <div className="tabs">
        {[
          ["kana", "五十音與發音"],
          ["verbs", "動詞變化詳解"],
          ["summary", "動詞統整表"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "kana" && (
        <>
          <section className="panel">
            <h2>平假名・片假名對照</h2>
            <p>
              平假名常用於詞尾與一般日文，片假名常用於外來語等。同一格是同一個音的兩種寫法。現代基本假名共
              46 個；「五十音」是傳統表格名稱，空格不補造不存在的字。
            </p>
            <div className="form-row">
              <label>
                顯示方式
                <select
                  value={kanaMode}
                  onChange={(e) => setKanaMode(e.target.value)}
                >
                  <option value="both">平假名＋片假名</option>
                  <option value="hira">只看平假名</option>
                  <option value="kata">只看片假名</option>
                </select>
              </label>
              <label className="inline-check">
                <input
                  type="checkbox"
                  checked={romaji}
                  onChange={(e) => setRomaji(e.target.checked)}
                />
                顯示羅馬字輔助
              </label>
            </div>
            <KanaTable rows={kanaRows} />
            <div className="kana-player">
              <h3>
                <span lang="ja">
                  {selectedKana.hira} ／ {selectedKana.kata}
                </span>
                {romaji && <small> {selectedKana.romaji}</small>}
              </h3>
              <Audio
                key={selectedKana.hira}
                text={
                  kanaMode === "kata" ? selectedKana.kata : selectedKana.hira
                }
              />
            </div>
            <p className="helper">
              先點字格，再按播放。羅馬字不能完整表示日語音色；單音合成語音也可能與實際詞中發音不同。
            </p>
            <Mark id="kana-basic" />
          </section>
          <section className="panel">
            <h2>濁音與半濁音</h2>
            <p>
              加「゛」形成濁音，は行加「゜」形成ぱ行。じ／ぢ、ず／づ在標準語常同音，但拼寫依詞而定，例如「つづく」。
            </p>
            <KanaTable rows={voicedRows} />
            <Mark id="kana-voiced" />
          </section>
          <section className="panel">
            <h2>拗音與外來語音</h2>
            <p>
              い段假名加小ゃ／ゅ／ょ形成拗音，整組通常算一拍。「きゃ」一拍，「きや」兩拍；大小不同，讀法也不同。
            </p>
            <KanaTable rows={contractedRows} columns={3} />
            <h3 className="subheading">常見外來語組合</h3>
            <div className="foreign-kana">
              {foreignSounds.map((k) => (
                <button
                  key={k.kata}
                  onClick={() => {
                    setSelectedKana(k);
                    document
                      .querySelector(".kana-player")
                      ?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                >
                  <strong lang="ja">{k.kata}</strong>
                  <small>{romaji ? k.romaji : k.hira}</small>
                </button>
              ))}
            </div>
            <Mark id="kana-combo" />
          </section>
          <section className="panel">
            <h2>促音、長音、撥音與易混字</h2>
            <div
              className="table-scroll"
              tabIndex={0}
              aria-label="發音重點統整表"
            >
              <table className="reference-table">
                <thead>
                  <tr>
                    <th>重點</th>
                    <th>例子</th>
                    <th>如何理解</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th>促音</th>
                    <td lang="ja">きて／きって；ベッド</td>
                    <td>小っ／ッ占一拍，延長閉鎖或摩擦，不讀成完整つ。</td>
                  </tr>
                  <tr>
                    <th>長音</th>
                    <td lang="ja">おばさん／おばあさん；コーヒー</td>
                    <td>
                      長音再占一拍；片假名常用ー。お段＋う、え段＋い常讀長音，但有詞彙與語境差異。
                    </td>
                  </tr>
                  <tr>
                    <th>撥音</th>
                    <td lang="ja">ほん、しんぶん</td>
                    <td>ん算一拍，實際發音會受後面音影響。</td>
                  </tr>
                  <tr>
                    <th>助詞讀音</th>
                    <td lang="ja">は→わ、へ→え、を→お</td>
                    <td>這是助詞用法的讀音，不適用所有含該假名的單字。</td>
                  </tr>
                  <tr>
                    <th>易混片假名</th>
                    <td lang="ja">シ／ツ；ソ／ン；ク／ケ；ス／ヌ</td>
                    <td>比較筆畫方向與位置，搭配單字記憶，不只看輪廓。</td>
                  </tr>
                  <tr>
                    <th>小字</th>
                    <td lang="ja">
                      ぁぃぅぇぉ／ァィゥェォ、ゃゅょ／ャュョ、っ／ッ
                    </td>
                    <td>小字通常與前後音組合，不當作一般大字逐個讀。</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <Audio
              text="きて。きって。おばさん。おばあさん。びょういん。びよういん。"
              translation="來（て形）。郵票。阿姨。奶奶。醫院。美容院。"
            />
            <p>
              母音う不是完全等同中文「烏」，ふ、ら行也不能完全靠中文近似音替代。先比較拍數，再配合可靠的日語音訊練習；本站使用裝置合成語音。
            </p>
            <Mark id="kana-sounds" />
          </section>
        </>
      )}
      {tab === "verbs" && (
        <>
          <section className="panel">
            <h2>先分類，再變化</h2>
            <div className="table-scroll" tabIndex={0} aria-label="動詞分類表">
              <table className="reference-table">
                <thead>
                  <tr>
                    <th>類別</th>
                    <th>辨認與例子</th>
                    <th>易錯處</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th>五段／第一類</th>
                    <td lang="ja">書く、読む、買う、帰る</td>
                    <td>
                      歸類不能只靠「る」結尾；帰る、入る、走る、切る、知る等是五段。
                    </td>
                  </tr>
                  <tr>
                    <th>一段／第二類</th>
                    <td lang="ja">食べる、見る、起きる</td>
                    <td>
                      常以いる／える結尾，但有五段例外，遇到新詞應查詞性。
                    </td>
                  </tr>
                  <tr>
                    <th>不規則／第三類</th>
                    <td lang="ja">する、勉強する、来る</td>
                    <td>個別記する、来る；来在不同形式讀き、こ、く。</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <h3>五段字尾對照</h3>
            <div
              className="table-scroll"
              tabIndex={0}
              aria-label="五段動詞音段表"
            >
              <table className="reference-table">
                <thead>
                  <tr>
                    <th>辭書字尾</th>
                    <th>あ段（ない）</th>
                    <th>い段（ます）</th>
                    <th>え段（可能等）</th>
                    <th>お段（意志）</th>
                  </tr>
                </thead>
                <tbody>
                  {"うくぐすつぬぶむる".split("").map((end, i) => (
                    <tr key={end}>
                      <th lang="ja">{end}</th>
                      {[
                        "わかがさたなばまら",
                        "いきぎしちにびみり",
                        "えけげせてねべめれ",
                        "おこごそとのぼもろ",
                      ].map((row) => (
                        <td lang="ja" key={row}>
                          {row[i]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="helper">
              う結尾的否定用わない，不是あない；ある的否定是ない。尊敬語如いらっしゃる另有ます形例外。
            </p>
            <Mark id="verb-groups" />
          </section>
          <section className="panel">
            <div className="form-row">
              <label>
                選擇動詞
                <select
                  value={verbId}
                  onChange={(e) => setVerbId(e.target.value)}
                >
                  {verbs.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.word}（{v.reading}）・{v.meaning}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                選擇變化
                <select
                  value={formId}
                  onChange={(e) => setFormId(e.target.value as FormId)}
                >
                  {verbForms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="conjugation-result">
              <span>{groupNames[verb.group]}</span>
              <div>
                <span lang="ja">{verb.word}</span>
                <span>→</span>
                <strong lang="ja">{forms[form.id].word}</strong>
              </div>
              <p lang="ja">{forms[form.id].reading}</p>
            </div>
            <h2>{form.title}</h2>
            <p>{form.meaning}</p>
            <ul className="rule-list">
              {form.rules.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <div className="trap-note">
              <strong>容易混淆</strong>
              <p>{form.note}</p>
            </div>
            <p className="example">
              <Japanese text={form.example} />
            </p>
            <p className="translation full">{form.translation}</p>
            <Audio
              key={form.id}
              text={form.example}
              translation={form.translation}
            />
            {verb.id === "aru" && (
              <p className="notice warning">
                ある表示存在，部分形式一般不使用，表中以「—」標示；あろう等形式也不等於日常個人意志。
              </p>
            )}
            <p className="helper">
              例句示範這個句型的用法，不一定使用上方所選的同一個動詞。
            </p>
            <Mark id="verb-forms" />
          </section>
        </>
      )}
      {tab === "summary" && (
        <>
          <section className="panel">
            <h2>24 種動詞形式統整</h2>
            <p>
              橫向比較五段、一段與兩個不規則類別。手機可左右滑動表格；點形式名稱可到詳解。
            </p>
            <label className="inline-check">
              <input
                type="checkbox"
                checked={showReadings}
                onChange={(e) => setShowReadings(e.target.checked)}
              />
              顯示平假名讀音
            </label>
            <div className="search-box">
              <input
                aria-label="搜尋動詞變化表"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜尋形式或意思，例如：被動、否定"
              />
            </div>
            <div
              className="table-scroll"
              tabIndex={0}
              aria-label="動詞變化統整表"
            >
              <table className="reference-table conjugation-table">
                <thead>
                  <tr>
                    <th>形式</th>
                    {["kaku", "taberu", "suru", "kuru"].map((id) => (
                      <th key={id}>{verbs.find((v) => v.id === id)!.word}</th>
                    ))}
                    <th>意思／用途</th>
                  </tr>
                </thead>
                <tbody>
                  {verbForms
                    .filter((f) => `${f.title}${f.meaning}`.includes(search))
                    .map((f) => (
                      <tr key={f.id}>
                        <th>
                          <button
                            className="text-button"
                            onClick={() => {
                              setFormId(f.id);
                              setTab("verbs");
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                          >
                            {f.title}
                          </button>
                        </th>
                        {["kaku", "taberu", "suru", "kuru"].map((id) => (
                          <td key={id}>
                            <FormWord
                              v={verbs.find((v) => v.id === id)!}
                              id={f.id}
                            />
                          </td>
                        ))}
                        <td>{f.meaning}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {!verbForms.some((f) =>
              `${f.title}${f.meaning}`.includes(search),
            ) && <p>沒有符合的形式，試試其他關鍵字。</p>}
          </section>
          <section className="panel">
            <h2>組合形式怎麼繼續變？</h2>
            <p>
              可能、被動、使役、使役被動的新動詞，多可當一段動詞再變成ない、た、ます等。例如：
            </p>
            <div className="table-scroll" tabIndex={0} aria-label="組合形式表">
              <table className="reference-table">
                <thead>
                  <tr>
                    <th>新動詞</th>
                    <th>否定</th>
                    <th>過去</th>
                    <th>禮貌</th>
                  </tr>
                </thead>
                <tbody>
                  <tr lang="ja">
                    <th>読める</th>
                    <td>読めない</td>
                    <td>読めた</td>
                    <td>読めます</td>
                  </tr>
                  <tr lang="ja">
                    <th>食べられる</th>
                    <td>食べられない</td>
                    <td>食べられた</td>
                    <td>食べられます</td>
                  </tr>
                  <tr lang="ja">
                    <th>書かせる</th>
                    <td>書かせない</td>
                    <td>書かせた</td>
                    <td>書かせます</td>
                  </tr>
                  <tr lang="ja">
                    <th>待たせられる</th>
                    <td>待たせられない</td>
                    <td>待たせられた</td>
                    <td>待たせられます</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              「読めます」是能讀；「読みます」是讀。動詞變化先改意思，再決定肯否、時態與禮貌程度。
            </p>
          </section>
          <section className="panel">
            <h2>由基礎形式接出常用句型</h2>
            <div
              className="table-scroll"
              tabIndex={0}
              aria-label="動詞接續句型統整"
            >
              <table className="reference-table pattern-table">
                <thead>
                  <tr>
                    <th>接續</th>
                    <th>句型與意思</th>
                    <th>例句與中文</th>
                  </tr>
                </thead>
                <tbody>
                  {derivedPatterns.map((p) => (
                    <tr key={p.pattern}>
                      <th>{p.base}</th>
                      <td>
                        <strong lang="ja">{p.pattern}</strong>
                        <p>{p.meaning}</p>
                      </td>
                      <td>
                        <Japanese text={p.example} />
                        <p>{p.translation}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="panel">
            <h2>敬語另看動作的方向</h2>
            <p>
              尊敬語抬高對方或談論對象的動作，謙讓語降低己方動作以表敬意。不是把所有動詞機械換成同一個結尾。
            </p>
            <div
              className="table-scroll"
              tabIndex={0}
              aria-label="常見敬語對照"
            >
              <table className="reference-table">
                <thead>
                  <tr>
                    <th>一般表達</th>
                    <th>尊敬</th>
                    <th>謙讓</th>
                    <th>注意</th>
                  </tr>
                </thead>
                <tbody>
                  {honorifics.map((h) => (
                    <tr key={h.normal}>
                      <th lang="ja">{h.normal}</th>
                      <td lang="ja">{h.respect}</td>
                      <td>{h.humble}</td>
                      <td>{h.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              一般規則還有「お＋ます語幹＋になる」與「お＋ます語幹＋する」，但並非所有動詞都適用。伺う限於向對方處拜訪等情境，参る可表己方去／來。先學對應對象，再決定用法。
            </p>
          </section>
        </>
      )}
      <p className="source-line">
        本站自編的現代標準語基礎整理，優先涵蓋 N5～N3
        常用形式；古文、方言及所有詞彙的特殊用法不在本表。例句附完整中文，讀音提示與裝置合成語音可輔助學習。
      </p>
    </>
  );
}
