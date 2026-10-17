import n3Expansion from "./n3Expansion.json" with { type: "json" };
import { verbPracticeQuestions } from "./verb-practice";
import vocabulary from "./vocabulary.json" with { type: "json" };
import supplement from "./supplement.json" with { type: "json" };
import extraQuestions from "./extraQuestions.json" with { type: "json" };
export type Vocab = (typeof vocabulary)[number] & { foundationId?: number };
export const vocab: Vocab[] = [
  ...vocabulary,
  ...supplement.vocabulary,
  ...n3Expansion.vocabulary,
];
export const supplementalLessons = supplement.lessons;
export type Grammar = {
  id: string;
  unit: number;
  title: string;
  meaning: string;
  connection: string;
  example: string;
  translation: string;
  note: string;
  compare: string;
  source?: string;
};
export const grammar: Grammar[] = [
  {
    id: "g1",
    unit: 1,
    title: "〜ことになっている",
    meaning: "已安排、規定如此。重點是既有安排或規定。",
    connection: "動詞辭書形／ない形＋ことになっている",
    example: "会議は三時に始まることになっています。",
    translation: "會議已安排在三點開始。",
    note: "不適合用來表達自己當下剛做出的決定。",
    compare: "ことにする：自己決定；ことになる：事情決定下來。",
  },
  {
    id: "g2",
    unit: 1,
    title: "〜うちに",
    meaning: "趁狀態尚未改變時；也可表示在某段時間內不知不覺發生變化。",
    connection:
      "動詞辭書形／ない形／ている形、い形容詞＋うちに；な形容詞＋な、名詞＋の＋うちに",
    example: "忘れないうちに、予定をメモしておきます。",
    translation: "趁還沒忘記，先把行程記下來。",
    note: "「うちに」關注狀態改變前的機會，不只是時間先後。",
    compare: "前に：單純在某事之前；うちに：趁某狀態還持續。",
  },
  {
    id: "g3",
    unit: 2,
    title: "〜ように",
    meaning: "為了達成某種狀態或能力，採取行動。",
    connection: "動詞辭書形／ない形＋ように",
    example: "忘れないように、締め切りをカレンダーに書きました。",
    translation: "為了避免忘記，我把截止日期寫在日曆上。",
    note: "常接可能形、ない形或不由意志直接控制的動詞。",
    compare: "ために通常用於意志性目的；ように著重希望達成的狀態。",
  },
  {
    id: "g4",
    unit: 2,
    title: "〜ておく",
    meaning: "事先做好準備；也可表示維持某狀態。",
    connection: "動詞て形＋おく",
    example: "会議の前に資料を読んでおきます。",
    translation: "我會在會議前先讀好資料。",
    note: "這是主線需要的基礎補強句型，並非本站宣稱的 N3 專屬文法。",
    compare: "てある：某人做了動作後留下的狀態；ておく：為之後預作準備。",
  },
  {
    id: "g5",
    unit: 3,
    title: "〜わけではない",
    meaning: "並不是說……；否定由前文推導出的概括結論。",
    connection:
      "普通形＋わけではない；名詞／な形容詞＋な＋わけではない（也有其他接法）",
    example: "高い物がいつもいいわけではありません。",
    translation: "並不是貴的東西就總是好。",
    note: "常是部分否定，不能直接理解為完全相反。",
    compare: "わけがない：不可能；わけではない：並非……。",
  },
  {
    id: "g6",
    unit: 3,
    title: "〜に比べて",
    meaning: "與某個基準相比。",
    connection: "名詞＋に比べて",
    example: "去年に比べて、今年は雨が多いです。",
    translation: "與去年相比，今年雨比較多。",
    note: "需要比較基準，不要直接接在動詞普通形後。",
    compare: "より可直接表比較；に比べて更明確提出比較基準。",
  },
  {
    id: "g7",
    unit: 4,
    title: "〜ようになる",
    meaning: "能力、習慣或狀態逐漸產生變化。",
    connection: "動詞辭書形／ない形＋ようになる",
    example: "毎日練習して、日本語が少し話せるようになりました。",
    translation: "每天練習後，我變得能說一點日文了。",
    note: "描述變化的結果，與表示主動努力的「ようにする」不同。",
    compare: "ようにする：努力做到；ようになる：變得會、變得開始。",
  },
  {
    id: "g8",
    unit: 4,
    title: "〜ばかり",
    meaning: "淨是、總是做某件事；常帶說話者認為偏多的語氣。",
    connection: "名詞＋ばかり；動詞て形＋ばかりいる",
    example: "休みの日は寝てばかりいます。",
    translation: "休假時總是在睡覺。",
    note: "本節是「總是」的用法；「たばかり」表示剛完成，是另一種結構。",
    compare: "だけ較中性地限定；ばかり常帶偏多、不平衡的感受。",
  },
  {
    id: "g9",
    unit: 5,
    title: "〜おかげで",
    meaning: "多虧某個因素而有好結果。",
    connection: "普通形＋おかげで；名詞＋の／な形容詞＋な＋おかげで",
    example: "皆さんのおかげで、イベントは成功しました。",
    translation: "多虧大家，活動成功了。",
    note: "本節練習正面結果；實際語用中也可能用於反諷。",
    compare: "せいで通常引出負面結果；ために較中性地陳述原因。",
  },
  {
    id: "g10",
    unit: 5,
    title: "〜てもらう",
    meaning: "請別人做某事，或接受他人為自己做事。",
    connection: "（人に）動詞て形＋もらう",
    example: "田中さんに会場を案内してもらいました。",
    translation: "我請田中先生帶我參觀了會場。",
    note: "接受幫助的人作主語，做動作的人通常以「に」標示。",
    compare: "てくれる從施予者角度描述；てもらう從接受者角度描述。",
  },
  {
    id: "g11",
    unit: 6,
    title: "〜によると",
    meaning: "根據消息來源。常和そうだ、ということだ等傳聞表達一起使用。",
    connection: "名詞＋によると",
    example: "天気予報によると、明日は雨だそうです。",
    translation: "根據天氣預報，聽說明天會下雨。",
    note: "用於提出資訊來源，不要與方法手段的「によって」混淆。",
    compare:
      "によって：可能表手段、原因、差異或被動施事；によると：提出消息來源。",
  },
  {
    id: "g12",
    unit: 6,
    title: "〜とは限らない",
    meaning: "未必、不一定；否定某個規則必然成立。",
    connection: "普通形＋とは限らない",
    example: "有名な店がおいしいとは限りません。",
    translation: "有名的店不一定好吃。",
    note: "並不是說有名的店都不好吃，只是否定一定成立。",
    compare: "必ずしも常與否定呼應；決して通常接強烈否定，語氣不同。",
  },
  ...supplement.grammar,
  ...n3Expansion.grammar,
];
export const foundations = [
  {
    id: "f1",
    title: "動詞形與普通形",
    body: "辭書形：読む；ない形：読まない；て形：読んで；た形：読んだ。普通形還包含過去否定「読まなかった」。読む的意思是閱讀。先判斷句型要求的形，再看語意。",
    example: "資料を読んでから、出発します。",
    translation: "讀完資料後再出發。",
    related: ["g1", "g2", "g3", "g4"],
  },
  {
    id: "f2",
    title: "助詞與時間界線",
    body: "に：時間點、到達點、對象等。で：動作場所、方法等。「まで」是動作持續到某時；「までに」是在期限之前完成。",
    example: "金曜日までに資料を送ってください。",
    translation: "請在星期五以前寄出資料。",
    related: ["g3", "g4", "g6"],
  },
  {
    id: "f3",
    title: "可能形與自他動詞",
    body: "話せる（能說）、読める（能讀）是可能形。「予定が決まる」是行程決定下來；「予定を決める」是決定行程。依焦點選擇主詞與助詞。",
    example: "日本語の新聞が読めるようになりました。",
    translation: "我變得能讀日文報紙了。",
    related: ["g5", "g7", "g8"],
  },
  {
    id: "f4",
    title: "授受與名詞修飾",
    body: "てもらう：我接受對方幫忙；てくれる：對方為我做事。名詞修飾例：先生が書いた本（老師寫的書）、静かな部屋（安靜的房間）。",
    example: "友達に作文を見てもらいました。",
    translation: "我請朋友幫我看了作文。",
    related: ["g9", "g10", "g11", "g12"],
  },
];
export type Question = {
  id: string;
  unit: number;
  type: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  trap: string;
  related: string[];
  passage?: string;
  audio?: string;
  translation?: string;
  optionTranslations?: string[];
  source?: string;
};
export const questions: Question[] = [
  {
    id: "q1",
    unit: 1,
    type: "漢字讀音",
    prompt: "会議の「予定」を確認します。「予定」の読み方は？",
    options: ["よてい", "ようてい", "よでい", "よってい"],
    answer: 0,
    explanation: "予定的讀音是「よてい」，意思是預定、計畫。",
    trap: "不要把短音「よ」讀成長音「よう」。",
    related: ["v001"],
    translation: "我要確認會議的行程。",
  },
  {
    id: "q2",
    unit: 1,
    type: "文法選擇",
    prompt: "忘れない（　）、予定をメモしておきます。",
    options: ["うちに", "ばかり", "おかげで", "に比べて"],
    answer: 0,
    explanation: "「忘れないうちに」表示趁還沒忘記時。",
    trap: "不是因為還沒忘記而有好結果，所以不能用おかげで。",
    related: ["g2"],
    translation: "趁還沒忘記，先把行程記下來。",
  },
  {
    id: "q3",
    unit: 1,
    type: "句子排序",
    prompt: "選出 ★ 應放的片段：会議は［　］［ ★ ］［　］［　］。",
    options: ["三時に", "始まる", "ことに", "なっています"],
    answer: 1,
    explanation: "完整順序：会議は三時に始まることになっています。★ 為始まる。",
    trap: "「動詞辭書形＋ことになっている」是一組安排表達。",
    related: ["g1"],
    translation: "會議已安排在三點開始。",
  },
  {
    id: "q4",
    unit: 1,
    type: "閱讀・短文",
    passage:
      "明日の見学は、集合時間が九時から九時半に変わりました。集合場所は駅の東口のままです。バスは九時四十分に出発します。遅れる場合は、担当者に電話してください。",
    prompt: "明日の見学について、正しいものはどれですか。",
    options: [
      "九時半に駅の東口に集まる。",
      "九時に駅の西口に集まる。",
      "九時四十分に駅の東口に集まる。",
      "遅れる場合はメールを送る。",
    ],
    answer: 0,
    explanation: "集合時間改為九點半，地點仍是東口。九點四十分是巴士出發時間。",
    trap: "要區分集合與出發時間；通知只改時間，沒有改地點。",
    related: ["v001", "v002", "g1"],
    translation:
      "明天的參觀，集合時間由九點改為九點半。集合地點仍是車站東口。巴士九點四十分出發。若會遲到，請打電話給負責人。",
  },
  {
    id: "q5",
    unit: 1,
    type: "聽力・課題理解",
    audio:
      "女：明日の会議の資料、もう送りましたか。男：まだです。これから送ります。女：時間が三時に変わったので、資料を送る前に、表紙の時間を直してください。男：はい、分かりました。",
    prompt: "男の人は、まず何をしますか。",
    options: [
      "表紙の時間を直す。",
      "資料を送る。",
      "会議に出る。",
      "女の人に電話する。",
    ],
    answer: 0,
    explanation: "女方要求寄資料前先改封面時間，所以第一步是修改封面。",
    trap: "「これから送る」是原計畫；後面的指示改變了先後順序。",
    related: ["v002", "v003"],
    translation:
      "女：明天會議的資料已經寄了嗎？男：還沒，現在要寄。女：時間改成三點了，寄資料前請先改封面的時間。男：好的。",
  },
  {
    id: "q6",
    unit: 2,
    type: "漢字寫法",
    prompt: "必要な「しりょう」を送ってください。",
    options: ["資料", "資科", "姿料", "試料"],
    answer: 0,
    explanation:
      "資料（しりょう）是供參考的文件、材料。「試料」是檢驗用的樣本，讀作しりょう但意思不同。",
    trap: "同音詞要依文意判斷，不只看讀音。",
    related: ["v019"],
    translation: "請寄送必要的資料。",
  },
  {
    id: "q7",
    unit: 2,
    type: "文法選擇",
    prompt: "会議の前に、資料を読んで（　）ください。",
    options: ["おいて", "あって", "みえて", "しまっている"],
    answer: 0,
    explanation:
      "読んでおく表示為會議預先讀好資料；請求形是読んでおいてください。",
    trap: "てある描述留下的狀態，不能替換這裡的預先準備請求。",
    related: ["g4"],
    translation: "請在會議前先讀好資料。",
  },
  {
    id: "q8",
    unit: 2,
    type: "依文意選詞",
    prompt: "申し込みの（　）は今週の金曜日です。それまでに送ってください。",
    options: ["締め切り", "原因", "習慣", "具合"],
    answer: 0,
    explanation: "締め切り是截止期限，後句「請在那之前寄出」提供線索。",
    trap: "原因是原因，不表示期限。",
    related: ["v021"],
    translation: "報名截止期限是這週五，請在那之前寄出。",
  },
  {
    id: "q9",
    unit: 2,
    type: "閱讀・資訊查找",
    passage:
      "交流会のお知らせ\n日時：十一月十日 十四時〜十六時\n対象：日本語を勉強している人\n参加費：無料\n申込方法：十一月五日までに、メールで氏名と電話番号を送ってください。定員二十人。電話での申し込みは受け付けません。",
    prompt: "交流会に参加したい人は、どうすればいいですか。",
    options: [
      "十一月五日までに名前と電話番号をメールで送る。",
      "十一月十日に電話で申し込む。",
      "参加費を先に払う。",
      "会場で名前だけを書く。",
    ],
    answer: 0,
    explanation: "通知明確要求 11/5 前用電子郵件寄姓名及電話。",
    trap: "電話號碼是要提供的資料，不代表可用電話報名。",
    related: ["v022", "v023", "v032"],
    translation:
      "交流會通知：11月10日14至16時，對象為學日文的人，免費。請在11月5日前用電子郵件寄姓名與電話。名額20人，不受理電話報名。",
  },
  {
    id: "q10",
    unit: 2,
    type: "聽力・重點理解",
    audio:
      "男：交流会はどこでありますか。女：駅前の図書館です。去年は市役所でしたが、今年は図書館の二階の会議室です。男：一階ではないんですね。女：はい、二階です。",
    prompt: "今年の交流会の会場はどこですか。",
    options: ["図書館の二階", "図書館の一階", "市役所の二階", "駅の中"],
    answer: 0,
    explanation: "今年在圖書館二樓會議室。去年在市公所，是干擾資訊。",
    trap: "聽清楚「去年」「今年」與樓層訂正。",
    related: ["v070"],
    translation:
      "男：交流會在哪裡舉辦？女：車站前的圖書館。去年在市公所，今年在圖書館二樓會議室。男：不是一樓對吧？女：對，是二樓。",
  },
  {
    id: "q11",
    unit: 3,
    type: "近義替換",
    prompt: "どちらを買うか「迷っています」。近い意味は？",
    options: [
      "決められないでいます。",
      "忘れています。",
      "もう買いました。",
      "道が分かりません。",
    ],
    answer: 0,
    explanation: "本句的迷う是猶豫、無法決定，不是迷路。",
    trap: "同一個詞要依語境判斷詞義。",
    related: ["v046"],
    translation: "我正在猶豫要買哪一個。",
  },
  {
    id: "q12",
    unit: 3,
    type: "文法選擇",
    prompt: "値段が高ければ、必ず品質がいい（　）。",
    options: [
      "わけではありません",
      "に比べています",
      "ばかりあります",
      "ことにしています",
    ],
    answer: 0,
    explanation: "不是價格高就一定品質好，使用わけではない否定概括結論。",
    trap: "這是部分否定，不是說所有高價品品質都不好。",
    related: ["g5"],
    translation: "並不是價格高就一定品質好。",
  },
  {
    id: "q13",
    unit: 3,
    type: "用法",
    prompt: "「比べる」の使い方として、最も適切なものは？",
    options: [
      "二つの商品の値段を比べました。",
      "会議に比べて遅れました。",
      "友達を駅に比べました。",
      "昨日は雨が比べました。",
    ],
    answer: 0,
    explanation: "比較兩個商品的價格，可用「値段を比べる」。",
    trap: "比べる不是抵達、迎接或下雨的意思。",
    related: ["v033", "g6"],
    translation: "我比較了兩個商品的價格。",
  },
  {
    id: "q14",
    unit: 3,
    type: "閱讀・短文",
    passage:
      "私は以前、駅に近い店なら便利だと思っていた。しかし、今よく利用する店は駅から少し遠い。品物の種類が多く、店員も親切だからだ。近い店が自分に合うとは限らない。店を選ぶときは、距離だけでなく、何を買いたいかも考えるようになった。",
    prompt: "筆者が店を選ぶとき、今は何を大切にしていますか。",
    options: [
      "距離のほか、買いたい物なども考えること。",
      "駅から一番遠いこと。",
      "値段が必ず高いこと。",
      "店員の数だけを比べること。",
    ],
    answer: 0,
    explanation: "作者從只看距離，改為也考慮想買什麼、商品種類及服務。",
    trap: "不是越遠越好，而是距離不是唯一標準。",
    related: ["g6", "g12", "v034"],
    translation:
      "我以前覺得靠近車站的店就方便。但我現在常去的店離車站有點遠，因為商品種類多，店員也親切。近的店未必適合自己。選店時，我開始不只考慮距離，也考慮想買什麼。",
  },
  {
    id: "q15",
    unit: 3,
    type: "聽力・概要理解",
    audio:
      "前は、勉強するとき、長い時間を用意しなければならないと思っていました。でも、通勤中に少しずつ単語を復習するようになって、毎日続けられています。大切なのは、一度にたくさん勉強することより、自分の生活に合う方法を見つけることだと思います。",
    prompt: "話している人が一番伝えたいことは何ですか。",
    options: [
      "生活に合う方法なら、勉強を続けやすい。",
      "通勤時間は長いほうがいい。",
      "単語だけ勉強すればいい。",
      "毎日長い時間が必要だ。",
    ],
    answer: 0,
    explanation: "主旨是找適合生活的方法，有助於持續學習。通勤複習只是例子。",
    trap: "不要把例子誤當成「只能背單字」的結論。",
    related: ["v040", "v049"],
    translation:
      "以前我認為學習必須準備很長的時間。但開始在通勤時一點一點複習單字後，就能每天持續。我認為重要的是找到適合自己生活的方法，而不是一次學很多。",
  },
  {
    id: "q16",
    unit: 4,
    type: "依文意選詞",
    prompt: "日本での生活に（　）、毎日の買い物も楽になりました。",
    options: ["慣れて", "減って", "提出して", "到着して"],
    answer: 0,
    explanation: "生活に慣れる是習慣生活，後句說購物也變容易。",
    trap: "慣れる搭配對象助詞に。",
    related: ["v050"],
    translation: "習慣在日本的生活後，每天購物也變輕鬆了。",
  },
  {
    id: "q17",
    unit: 4,
    type: "文法選擇",
    prompt: "練習を続けて、漢字が読める（　）なりました。",
    options: ["ように", "ために", "ばかりに", "うちに"],
    answer: 0,
    explanation: "読めるようになる表示從不會到能讀的能力變化。",
    trap: "ためになる不能表達這個能力變化。",
    related: ["g7"],
    translation: "持續練習之後，我變得能讀漢字了。",
  },
  {
    id: "q18",
    unit: 4,
    type: "文章文法",
    passage:
      "最近、毎朝五分だけ日本語を聞いています。最初は速くて分かりませんでした。（　）、今は知っている言葉が聞き取れるようになりました。",
    prompt: "（　）に入る最も適切な言葉は？",
    options: ["しかし", "そのために", "例えば", "それに"],
    answer: 0,
    explanation:
      "前後是「最初聽不懂」和「現在能聽出熟悉詞語」的轉折，因此用しかし。",
    trap: "例えば用於舉例，這裡不是舉例關係。",
    related: ["g7"],
    translation:
      "最近我每天早上只聽五分鐘日文。最初因為太快而聽不懂。但是，現在能聽出認識的詞語了。",
  },
  {
    id: "q19",
    unit: 4,
    type: "閱讀・短文",
    passage:
      "毎日二十個の単語を覚えようとしていたが、忙しい日はできず、勉強をやめてしまった。そこで、一日五個に減らし、前の日の単語も復習することにした。一週間続けてみると、覚えている単語が増えていた。今は、数よりも続けられる量を大切にしている。",
    prompt: "筆者が勉強の方法を変えた理由は何ですか。",
    options: [
      "忙しい日も勉強を続けられるようにするため。",
      "一日で全部覚えるため。",
      "復習をやめるため。",
      "単語を勉強する必要がなくなったため。",
    ],
    answer: 0,
    explanation: "原本一天二十個無法持續，改成五個並複習，讓忙碌時也做得到。",
    trap: "減量不代表不學，也沒有取消複習。",
    related: ["v052", "v059", "g3"],
    translation:
      "我原本想每天記二十個單字，但忙時做不到，就停止了學習。於是改成每天五個，並複習前一天的單字。持續一週後，記住的單字增加了。我現在重視能持續的份量，而不是數量。",
  },
  {
    id: "q20",
    unit: 4,
    type: "聽力・即時應答",
    audio: "最近、日本語が上手になりましたね。",
    prompt: "最も自然な返事はどれですか。",
    options: [
      "ありがとうございます。まだ勉強中です。",
      "いいえ、今から帰ります。",
      "はい、駅の二階です。",
      "どうぞ召し上がってください。",
    ],
    answer: 0,
    explanation: "對方稱讚日文進步，以感謝加上謙虛回應最自然。",
    trap: "其餘分別談回家、位置、請用餐，與稱讚無關。",
    related: ["g7"],
    translation: "最近你的日文進步了呢。",
  },
  {
    id: "q21",
    unit: 5,
    type: "文法選擇",
    prompt: "友達に会場を案内して（　）。助かりました。",
    options: ["もらいました", "あげました", "おきました", "ありました"],
    answer: 0,
    explanation: "主語是接受幫助的自己，請朋友帶路用てもらう。",
    trap: "てあげる是自己為別人做事，方向相反。",
    related: ["g10"],
    translation: "我請朋友帶我參觀了會場，幫了很大的忙。",
  },
  {
    id: "q22",
    unit: 5,
    type: "句子排序",
    prompt: "選出 ★ 應放的片段：皆さん［　］［　］［ ★ ］［　］。",
    options: ["のおかげで", "イベントは", "成功", "しました"],
    answer: 2,
    explanation: "順序為「皆さんのおかげでイベントは成功しました」。★ 是成功。",
    trap: "名詞接おかげで時需要の。",
    related: ["g9"],
    translation: "多虧大家，活動成功了。",
  },
  {
    id: "q23",
    unit: 5,
    type: "用法",
    prompt: "「遠慮」の使い方として、最も適切なものは？",
    options: [
      "遠慮しないで、質問してください。",
      "電車を遠慮して駅に着いた。",
      "明日は遠慮が降るそうです。",
      "資料を三枚遠慮しました。",
    ],
    answer: 0,
    explanation: "遠慮しないで表示不要客氣、不要顧慮。",
    trap: "遠慮不是搭乘、天氣或文件數量的動作。",
    related: ["v079"],
    translation: "請不要客氣，儘管提問。",
  },
  {
    id: "q24",
    unit: 5,
    type: "閱讀・短文",
    passage:
      "交流会を手伝ってくださる皆さんへ。明日は一時に会場に来てください。受付の担当者は入り口で参加者に名札を渡します。案内の担当者は、受付が終わった人を二階の部屋へ案内してください。準備の後、全員で説明を聞きます。",
    prompt: "案内の担当者は、何をしますか。",
    options: [
      "受付を済ませた人を二階へ案内する。",
      "入り口で名札を渡す。",
      "一時に参加者へ電話する。",
      "説明を聞かずに帰る。",
    ],
    answer: 0,
    explanation: "案內人員負責將完成報到的人帶往二樓；發名牌是接待人員工作。",
    trap: "兩種職務的任務不要混淆。",
    related: ["v068", "v069", "v071"],
    translation:
      "給協助交流會的各位：明天請一點到會場。接待人員在入口發名牌。引導人員請把完成報到的人帶到二樓房間。準備後，全員一起聽說明。",
  },
  {
    id: "q25",
    unit: 5,
    type: "聽力・發話表達",
    audio:
      "あなたは交流会の受付にいます。参加者に、ここに名前を書くようにお願いしたいです。何と言いますか。",
    prompt: "受付で参加者に言う言葉として適切なものは？",
    options: [
      "こちらにお名前を書いてください。",
      "私の名前を書きました。",
      "名前を書いてもいいですか。",
      "名前を書かなくてよかったです。",
    ],
    answer: 0,
    explanation:
      "接待人員請參加者填姓名，可說「こちらにお名前を書いてください」。",
    trap: "書いてもいいですか是在請求允許自己寫，不是請對方寫。",
    related: ["v069"],
    translation: "你在交流會接待處，想請參加者在這裡寫名字，應該怎麼說？",
  },
  {
    id: "q26",
    unit: 6,
    type: "文法選擇",
    prompt: "天気予報（　）、明日は雨だそうです。",
    options: ["によると", "に比べて", "ばかり", "のおかげで"],
    answer: 0,
    explanation: "によると提示消息來源；だそうです表示傳聞。",
    trap: "に比べて是比較，不是「根據」。",
    related: ["g11"],
    translation: "根據天氣預報，聽說明天會下雨。",
  },
  {
    id: "q27",
    unit: 6,
    type: "依文意選詞",
    prompt: "申し込みは十八歳（　）の人が対象です。十八歳の人も参加できます。",
    options: ["以上", "未満", "より上", "以下"],
    answer: 0,
    explanation: "十八歳以上包含十八歲本身，也包含更年長的人。",
    trap: "未満不包含基準值且方向相反；より上不包含十八歲。",
    related: ["v090"],
    translation: "報名對象為十八歲以上的人，十八歲的人也能參加。",
  },
  {
    id: "q28",
    unit: 6,
    type: "文章文法",
    passage:
      "インターネットの情報は便利だ。しかし、書いてあることがすべて正しい（　）。大切なことは、別の資料でも確認しよう。",
    prompt: "（　）に入る最も適切なものは？",
    options: ["とは限らない", "ようになった", "ことにした", "おかげだ"],
    answer: 0,
    explanation: "網路內容未必全都正確，因此需要交叉確認。",
    trap: "否定的是「全都正確」，不是說網路資訊全錯。",
    related: ["g12"],
    translation:
      "網路資訊很方便，但寫的內容未必全部正確。重要事項也用其他資料確認吧。",
  },
  {
    id: "q29",
    unit: 6,
    type: "閱讀・資訊查找",
    passage:
      "市民講座「日本語で交流」\nＡ：土曜 午前十時〜十二時／対象：初めて学ぶ人／定員十五人\nＢ：土曜 午後二時〜四時／対象：簡単な会話ができる人／定員十人\nＣ：日曜 午後二時〜四時／対象：簡単な会話ができる人／定員十五人\n全講座無料。申し込みは十一月一日から。",
    prompt: "簡単な会話ができる人が、土曜の午後に参加できる講座は？",
    options: ["Ｂ", "Ａ", "Ｃ", "ＡとＣ"],
    answer: 0,
    explanation: "條件同時符合「能簡單會話」和「週六下午」的是 B。",
    trap: "C 的程度符合，但日期是週日；A 是週六上午且給初學者。",
    related: ["v086", "v087"],
    translation:
      "市民課程「用日文交流」：A週六10至12時，初學者15人；B週六14至16時，能簡單會話者10人；C週日14至16時，能簡單會話者15人。全部免費，11月1日起報名。",
  },
  {
    id: "q30",
    unit: 6,
    type: "聽力・重點理解",
    audio:
      "女：図書館の講座、申し込みましたか。男：まだです。女：明日が締め切りですよ。窓口は五時に閉まりますが、インターネットなら夜の十時まで申し込めます。男：仕事が六時に終わるので、インターネットにします。",
    prompt: "男の人は、どうやって申し込みますか。",
    options: ["インターネットで", "五時までに窓口で", "電話で", "手紙で"],
    answer: 0,
    explanation: "男方六點下班，窗口五點關，所以選網路報名。",
    trap: "要依男方的時間限制選方式，不能只聽到窗口就選。",
    related: ["v021", "v022"],
    translation:
      "女：圖書館課程報名了嗎？男：還沒。女：明天截止。窗口五點關，但網路到晚上十點都能報名。男：我六點下班，所以用網路。",
  },
  ...extraQuestions,
  ...supplement.questions,
  ...verbPracticeQuestions,
  ...n3Expansion.questions,
];
export type Unit = {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  minutes: number;
  focus: string;
  foundations: string[];
  prerequisites?: number[];
  category?: string;
};
export const units: Unit[] = [
  {
    id: 1,
    title: "把行程安排好",
    subtitle: "時間、變更與事先準備",
    icon: "01",
    minutes: 18,
    focus: "讀懂行程變動，抓住集合與出發的差別",
    foundations: ["f1", "f2"],
  },
  {
    id: 2,
    title: "看懂通知與報名",
    subtitle: "期限、條件與資訊查找",
    icon: "02",
    minutes: 20,
    focus: "從通知中找出期限、資格與申請方式",
    foundations: ["f1", "f2"],
  },
  {
    id: 3,
    title: "說出選擇的理由",
    subtitle: "比較、判斷與部分否定",
    icon: "03",
    minutes: 20,
    focus: "理解比較基準，不把部分否定看成全盤否定",
    foundations: ["f2", "f3"],
  },
  {
    id: 4,
    title: "讓學習成為習慣",
    subtitle: "能力變化與持續行動",
    icon: "04",
    minutes: 18,
    focus: "辨別能力變化與刻意努力，讀懂文章轉折",
    foundations: ["f1", "f3"],
  },
  {
    id: 5,
    title: "一起完成一場活動",
    subtitle: "授受、協助與人際互動",
    icon: "05",
    minutes: 20,
    focus: "辨別誰幫誰，掌握活動通知中的分工",
    foundations: ["f4"],
  },
  {
    id: 6,
    title: "讀出資訊的重點",
    subtitle: "消息來源、範圍與綜合練習",
    icon: "06",
    minutes: 22,
    focus: "辨識來源、數量界線與資訊查找條件",
    foundations: ["f2", "f4"],
  },
  ...n3Expansion.units,
];
export const n3UnitIds = new Set(units.map((u) => u.id));
export const n3Reference = n3Expansion.provenance;
export const sourceLinks = [
  {
    title: "時雨の町：N3 文法（使用者指定的延伸閱讀）",
    url: "https://www.sigure.tw/learn-japanese/grammar/n3/",
    note: "作者：時雨の町。此環境連線遭 403，尚未讀取或逐課核對目錄；未轉載該站文章、例句或題目。本站新增內容為自編，不能視為該站完整課程的替代。",
  },
  {
    title: "JLPT 官方題型與公開樣題",
    url: "https://www.jlpt.jp/samples/forlearners.html",
    note: "題型參考連結；未重製官方題目。",
  },
  {
    title: "JLPT Word List",
    url: "https://github.com/elzup/jlpt-word-list",
    note: "已讀取 N3、N4 候選詞表。民間分級，本站未直接匯入其英文釋義。",
  },
  {
    title: "Yomitan JLPT Vocab",
    url: "https://github.com/stephenmk/yomitan-jlpt-vocab",
    note: "分級與常見寫法參考；與前項部分同源，不視為獨立驗證。",
  },
  {
    title: "使用者提供的 N3／N5／N2 講義",
    url: "",
    note: "選詞參考；未重製講義版面、音訊或整批釋義。講義的出題標籤未視為官方證明。",
  },
];
