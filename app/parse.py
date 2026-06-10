import json

with open('lint-results.json', 'r', encoding='utf-16') as f:
    data = json.load(f)

for d in data:
    if d['errorCount'] > 0:
        print(f"FILE: {d['filePath']}")
        for m in d['messages']:
            if m['severity'] == 2:
                print(f"  {m.get('line')}:{m.get('column')}  {m.get('ruleId')} - {m.get('message')}")
