import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
handouts={r['lesson']:r for r in json.loads((root/'src/dialogue-handouts.json').read_text())}
rows=[l.split('|') for l in (root/'scripts/content/dialogue-vocabulary.tsv').read_text().splitlines() if l and not l.startswith('#')]
out=[]
for i,row in enumerate(rows,1):
 assert len(row)==10,row
 word,reading,pos,meaning,scene,lesson,sentence,translation,collocation,confusion=row
 ref=handouts[int(lesson)]
 basis='講義出現詞之整理' if word in {'打ち合わせ','順調','飲み物','趣味','なるほど','流れ','休暇','在宅勤務','着替える','効率','壊す','反応','名刺'} else '依講義情境補充選詞（非宣稱原課詞表收錄）'
 out.append(dict(id=f'vdlg-kaiwa-{i:02}',unit=201,word=word,reading=reading,pos=pos,meaning=meaning,sentence=sentence,translation=translation,collocation=collocation,confusion=confusion,level='會話補充選詞（含基礎與實用延伸，非官方分級）',source=f'{basis}；主題參考使用者提供《基礎會話》第{int(lesson):02}課，{ref["file"]} PDF第{ref["pages"][0]}頁起；釋義、例句與注意事項為本站自編。',dialogueIds=[scene]))
assert len(out)==24 and len({v['word'] for v in out})==24
(root/'src/dialogue-vocabulary.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print('Built',len(out),'shared dialogue vocabulary cards')
