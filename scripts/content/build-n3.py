"""Build the self-authored N3 sprint expansion from editable TSV manuscripts.
No third-party pages or articles are scraped/reproduced by this script.
Run from the repository root: python3 scripts/content/build-n3.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONTENT = ROOT / 'scripts/content'

def rows(name, fields):
    result=[]
    for line in (CONTENT / name).read_text().splitlines():
        if not line or line.startswith('#'): continue
        record=line.split('|')
        assert len(record)==fields,(name,len(record),line)
        result.append(record)
    return result

gs=rows('n3-grammar.tsv',8)
vs=rows('n3-vocabulary.tsv',8)
rs=rows('n3-reading.tsv',7)
ls=rows('n3-listening.tsv',7)
assert (len(gs),len(vs),len(rs),len(ls))==(96,48,24,24)
metadata=[
 ('掌握時間的先後','時點、進行中與突發事件','時間與變化',['f1','f2']),
 ('讀懂持續的變化','趨勢、起點與連動','時間與變化',['f1','f3']),
 ('表達完成與反覆','做到最後、半途與每一次','時間與變化',['f1','f3']),
 ('分辨原因與責任','客觀原因、歸責與辯解','原因與條件',['f2','f4']),
 ('看懂讓步與反差','預期落差、責備與修正','原因與條件',['f2','f3']),
 ('釐清必要與充分條件','即使、只要與不先做就無法','原因與條件',['f1','f2']),
 ('說明目的與要求','意志目的、必要條件與轉述','決定與規範',['f1','f4']),
 ('區分決定與打算','個人意志、外部安排與嘗試','決定與規範',['f1','f3']),
 ('理解習慣與義務','自訂原則、應當與不必','決定與規範',['f1','f2']),
 ('判斷推測的確定程度','有據推論、強烈確信與可能','推測與否定',['f2','f3']),
 ('分清看起來與聽說','樣態、傳聞與間接線索','推測與否定',['f2','f4']),
 ('解開わけ與雙重否定','難怪、不可能與不能不顧責任','推測與否定',['f1','f3']),
 ('掌握程度與比例','到某程度、比較與越來越','程度與範圍',['f2','f3']),
 ('讀出限定與追加','只有、連〜都、不但〜而且','程度與範圍',['f2','f4']),
 ('分辨主題與立場','關於、對〜而言與作為','對象與依據',['f2','f4']),
 ('找到手段與依據','透過、根據與名詞修飾','對象與依據',['f2','f4']),
 ('看見條件與不同面向','相應調整、對象與優缺點','對象與依據',['f2','f3']),
 ('描述他人與常見傾向','欲望、感受與易發生的情況','狀態與感受',['f1','f3']),
 ('理解留下來的狀態','維持、放任、完成與準備結果','狀態與感受',['f1','f3']),
 ('用敬語表達協助','授受方向、尊敬與謙讓','人際與敬語',['f1','f4']),
 ('分清誰做、誰被要求','受身、使役、使役受身與請求','人際與敬語',['f1','f4']),
 ('連結經驗與未來','險些、曾經、偶爾與往後','經驗與篇章',['f1','f3']),
 ('讀懂慶幸與後悔','還好做了、早知道與強烈感受','經驗與篇章',['f1','f3']),
 ('抓住文章的邏輯','追加、讓步與換言歸納','經驗與篇章',['f2','f4']),
]
source='本站自編教材、例句與練習；備考導航分級，非 JLPT 官方分級或歷屆試題'
output={'units':[],'grammar':[],'vocabulary':[],'questions':[], 'provenance':{
 'authorship':source,
 'requestedReference':{'author':'時雨の町','url':'https://www.sigure.tw/learn-japanese/grammar/n3/', 'status':'延伸閱讀連結；此環境連線遭 403，未讀取或逐課核對該站內容。'},
 'coverage':'N3 備考主線，含必要基礎複習與跨級延伸；不是官方完整清單或第三方課程的重製。'
}}
readings=[r[1] for r in vs]
for index,(title,subtitle,category,foundations) in enumerate(metadata):
    uid=index+7
    grammar_ids=[]
    output['units'].append({'id':uid,'title':title,'subtitle':subtitle,'category':category,'icon':f'{uid:02}', 'minutes':20,'focus':subtitle+'，在句子與情境中判斷接法及意思','foundations':foundations,'prerequisites':[uid-1]})
    for j,record in enumerate(gs[index*4:index*4+4]):
        title,meaning,connection,marked,zh,note,compare,wrong=record
        assert marked.count('〈')==marked.count('〉')==1,marked
        target=marked.split('〈')[1].split('〉')[0]
        example=marked.replace('〈','').replace('〉','')
        gid=f'gn3-{uid:02}-{j+1}'
        grammar_ids.append(gid)
        output['grammar'].append({'id':gid,'unit':uid,'title':title,'meaning':meaning,'connection':connection,'example':example,'translation':zh,'note':note,'compare':compare,'source':source})
        options=[target,*wrong.split('/')]
        assert len(options)==len(set(options))==4,record
        output['questions'].append({'id':f'qn3-{uid:02}-grammar-{j+1}','unit':uid,'type':'文法選擇','prompt':f'請依下列文意，選出接續正確且最符合語意的選項。\n情境：{zh}\n'+marked.replace('〈'+target+'〉','（　）'), 'options':options,'answer':0,'explanation':f'正解「{target}」。{meaning}接續：{connection}。完整句：{example}。','trap':f'{note}比較：{compare}','translation':zh,'related':[gid],'source':source})
    for j,record in enumerate(vs[index*2:index*2+2]):
        word,reading,pos,meaning,sentence,translation,collocation,confusion=record
        vid=f'vn3-{uid:02}-{j+1}'
        output['vocabulary'].append(dict(id=vid,unit=uid,word=word,reading=reading,pos=pos,meaning=meaning,sentence=sentence,translation=translation,collocation=collocation,confusion=confusion,level='N3 備考主線選詞（含基礎與延伸）',source=source))
        others=list(dict.fromkeys(readings[(index*2+j+1):]+readings[:(index*2+j)]))
        options=[reading,*[r for r in others if r!=reading][:3]]
        assert len(set(options))==4
        output['questions'].append({'id':f'qn3-{uid:02}-word-{j+1}','unit':uid,'type':'漢字讀音','prompt':sentence+f'\n「{word}」の読み方はどれですか。','options':options,'answer':0,'explanation':f'「{word}」讀作「{reading}」，{pos}，意思是「{meaning}」。常見搭配：{collocation}。','trap':confusion,'translation':translation,'related':[vid],'source':source})
    passage,translation,prompt,answer,wrong,explanation,trap=rs[index]
    output['questions'].append(dict(id=f'qn3-{uid:02}-reading',unit=uid,type='閱讀・資訊查找' if uid in [10,12,15,20,23,25,26,28] else '閱讀・短文',passage=passage,translation=translation,prompt=prompt,options=[answer,*wrong.split('/')],answer=0,explanation=explanation,trap=trap,related=grammar_ids,source=source))
    audio,translation,prompt,answer,wrong,explanation,trap=ls[index]
    kind='聽力・課題理解' if uid in [7,10,12,13,15,23,25,28,30] else '聽力・重點理解'
    if uid==26:
        kind='聽力・即時回應'
        audio='本日はご案内いただき、ありがとうございました。'
        translation='感謝您今天帶我參觀。'
        prompt='感謝に対する返事として適切なのはどれですか。'
    if uid==27:
        kind='聽力・情境表達'
        audio='受付で説明を聞きましたが、分からないところがあります。もう一度説明してほしいです。何と言いますか。'
        translation='在櫃檯聽了說明，但還有不明白的地方，想請對方再說明一次，該怎麼說？'
        prompt='受付の人に何と言いますか。'
        answer='すみません、もう一度説明してもらえませんか。'
        wrong='もう説明しないでください。/私は説明を終わりました。/説明は必要ありません。'
        explanation='需要再聽一次說明，用てもらえませんか委婉請求對方。'
    if uid==24:
        kind='聽力・概要理解'
        prompt='何について話していますか。'
        answer='弟がゲームを欲しがっていること'
        wrong='弟が仕事を探していること/店の営業時間が変わること/ゲームの修理が終わったこと'
        explanation='兩人談論弟弟想買遊戲但尚未購買，是整段的主題。'
    output['questions'].append(dict(id=f'qn3-{uid:02}-listening',unit=uid,type=kind,audio=audio,translation=translation,prompt=prompt,options=[answer,*wrong.split('/')],answer=0,explanation=explanation,trap=trap,related=grammar_ids,source=source))
assert len(output['questions'])==192
(ROOT/'src/n3Expansion.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
print('Built 24 units, 96 grammar points, 48 vocabulary cards and 192 questions.')
