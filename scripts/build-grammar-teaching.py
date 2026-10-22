"""Compile authored teaching notes and explicit, contextual sentence annotations.
Markup: [g:grammar] [f:form/connection] [w:vocabulary]. No automatic POS guesses.
"""
from pathlib import Path
import json,re
root=Path(__file__).resolve().parents[1]
content=root/'scripts/content'
rows=[l.split('|') for l in (content/'n3-teaching.tsv').read_text().splitlines() if l and not l.startswith('#')]
base=json.loads((root/'src/n3Expansion.json').read_text())
assert len(rows)==len(base['grammar'])==96,(len(rows),len(base['grammar']))
core=json.loads((content/'core-grammar-teaching.json').read_text())
for g,row in zip(base['grammar'],rows):
 assert len(row)==3,row
 derivation,usage,marked=row
 clean=re.sub(r'\[(?:g|f|w):([^\]]+)\]',r'\1',marked)
 assert clean in g['example'],(g['id'],clean,g['example'])
 core[g['id']]={'usage':[usage],'derivation':derivation,'marked':marked}
(root/'src/grammar-teaching.json').write_text(json.dumps(core,ensure_ascii=False,indent=2)+'\n')
print('Compiled teaching notes for',len(core),'N3 grammar points.')
