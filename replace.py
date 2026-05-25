import re

with open('radial_bar_chart/radial_chart.html', 'r') as f:
    radial_content = f.read()

# Extract the scrollytelling-wrapper div
match = re.search(r'(<div class="scrollytelling-wrapper">[\s\S]*?</div>\n  </div>)', radial_content)
if match:
    radial_html = match.group(1)
else:
    print("Failed to find scrollytelling-wrapper")
    exit(1)

with open('Main/index.html', 'r') as f:
    main_content = f.read()

# Replace iframe with scrollytelling HTML
iframe_regex = r'<iframe class="visual-frame" style="height: 2500px;" src="\.\./radial_bar_chart/radial_chart\.html"></iframe>'
main_content = re.sub(iframe_regex, radial_html, main_content)

# Add CSS link
if '<link rel="stylesheet" href="../radial_bar_chart/radial_bar_chart.css">' not in main_content:
    main_content = main_content.replace('</head>', '\t<link rel="stylesheet" href="../radial_bar_chart/radial_bar_chart.css">\n</head>')

# Add JS script directly below the scrollytelling block
js_tags = '<script src="../radial_bar_chart/radial_bar_chart.js"></script>'
main_content = main_content.replace('</div>\n  </div>', '</div>\n  </div>\n\t' + js_tags)

# Also ensure D3 v5 is loaded in head
if '<script src="https://d3js.org/d3.v5.min.js"></script>' not in main_content:
    main_content = main_content.replace('</head>', '\t<script src="https://d3js.org/d3.v5.min.js"></script>\n</head>')
    # And remove from bottom
    main_content = main_content.replace('<script src="https://d3js.org/d3.v5.min.js"></script>\n', '')

with open('Main/index.html', 'w') as f:
    f.write(main_content)

print("Successfully updated Main/index.html")
