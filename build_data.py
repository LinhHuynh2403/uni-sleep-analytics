import os
import json

csv_path = 'dataset/student_sleep_patterns.csv'
js_path = 'visualization/data.js'

with open(csv_path, 'r', encoding='utf-8') as f:
    csv_data = f.read()

# Write it as a JS module/variable
with open(js_path, 'w', encoding='utf-8') as f:
    f.write('const rawCsvData = ' + json.dumps(csv_data) + ';\n')

print('Generated data.js')
