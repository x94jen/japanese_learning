"""Generate conservative, exact-written-form lookup metadata.
Usage: python3 scripts/build-study-priority.py /path/ja_full.txt /path/n3.csv
Downloaded source files stay outside the repository; no definitions are imported.
"""
import csv,json,hashlib,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
frequency=Path(sys.argv[1]); candidates=Path(sys.argv[2])
rows=frequency.read_text().splitlines()
freq={}
for rank,line in enumerate(rows,1):
 word,count=line.rsplit(' ',1)
 freq[word]={'rank':rank,'count':int(count)}
with candidates.open(newline='') as f:
 n3={(r['expression'],r['reading']) for r in csv.DictReader(f)}
vocab=json.loads((root/'src/vocabulary.json').read_text())+json.loads((root/'src/supplement.json').read_text())['vocabulary']+json.loads((root/'src/n3Expansion.json').read_text())['vocabulary']
output={'metadata':{'retrieved':'2026-10-22','frequency':{'author':'Hermit Dave / FrequencyWords','url':'https://github.com/hermitdave/FrequencyWords/blob/master/content/2018/ja/ja_full.txt','license':'CC-BY-SA-4.0','licenseUrl':'https://creativecommons.org/licenses/by-sa/4.0/','corpus':'OpenSubtitles2018','sha256':hashlib.sha256(frequency.read_bytes()).hexdigest(),'totalTokens':len(rows),'method':'僅精確匹配教材單字完整寫法；未作詞形還原，未匹配不代表罕見。排名是字幕語料的詞元排名，不是日檢出題率。'},'candidates':{'url':'https://github.com/elzup/jlpt-word-list/blob/master/src/n3.csv','source':'民間 N3 候選詞表，溯源至 open-anki-jlpt-decks／Tanos；非官方分級。僅比對寫法及讀音，不匯入釋義。','sha256':hashlib.sha256(candidates.read_bytes()).hexdigest()},'grammar':'文法優先順序為本站備考／日常溝通編排建議，沒有可驗證的日檢出題率。'},'words':{}}
for v in vocab:
 output['words'][v['id']]={'n3Candidate':(v['word'],v['reading']) in n3,**freq.get(v['word'],{})}
(root/'src/study-priority.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
matched=sum('rank' in x for x in output['words'].values())
print(f'Exact corpus matches: {matched}/{len(vocab)}; candidate N3 matches: {sum(x["n3Candidate"] for x in output["words"].values())}')
