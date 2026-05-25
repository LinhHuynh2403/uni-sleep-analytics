import re

# 1. Read radial_chart.html
with open('radial_bar_chart/radial_chart.html', 'r') as f:
    radial_content = f.read()

# Extract the scrollytelling-wrapper div
match = re.search(r'(<div class="scrollytelling-wrapper">[\s\S]*?</div>\n  </div>)', radial_content)
if match:
    radial_html = match.group(1)
else:
    print("Failed to find scrollytelling-wrapper")
    exit(1)

# 2. Update Main/index.html
with open('Main/index.html', 'r') as f:
    main_content = f.read()

# Replace iframe with scrollytelling HTML + script tag
iframe_regex = r'<iframe id="radial-frame".*?></iframe>'
replacement = radial_html + '\n\t<script src="../radial_bar_chart/radial_bar_chart.js"></script>'
main_content = re.sub(iframe_regex, replacement, main_content)

# Add CSS link back to head
if '<link rel="stylesheet" href="../radial_bar_chart/radial_bar_chart.css">' not in main_content:
    main_content = main_content.replace('</head>', '\t<link rel="stylesheet" href="../radial_bar_chart/radial_bar_chart.css">\n</head>')

# Remove the custom iframe script block
script_regex = r'\t<script>\n\t\t// Broadcast global scrolling data[\s\S]*?syncIframeScroll\(\);\n\t</script>'
main_content = re.sub(script_regex, '', main_content)

with open('Main/index.html', 'w') as f:
    f.write(main_content)

# 3. Update radial_bar_chart.js to remove the manual message event listener
with open('radial_bar_chart/radial_bar_chart.js', 'r') as f:
    js_content = f.read()

js_regex = r'// Handle iframe scroll syncing from parent document[\s\S]*?\}\);\n'
js_content = re.sub(js_regex, '', js_content)

with open('radial_bar_chart/radial_bar_chart.js', 'w') as f:
    f.write(js_content)

print("Successfully updated everything to inline")
