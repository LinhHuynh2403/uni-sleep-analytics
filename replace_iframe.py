import re

with open('Main/index.html', 'r') as f:
    main_content = f.read()

# Replace the scrollytelling-wrapper block and the script tag with the iframe
regex = r'<div class="scrollytelling-wrapper">[\s\S]*?</div>\n\t</div>\n\t<script src="\.\./radial_bar_chart/radial_bar_chart\.js"></script>'

iframe_html = '<iframe class="visual-frame" style="height: 3500px;" src="../radial_bar_chart/radial_chart.html"></iframe>'

new_content = re.sub(regex, iframe_html, main_content)

# Remove the CSS link for radial_bar_chart.css from head since iframe handles it
new_content = new_content.replace('\t<link rel="stylesheet" href="../radial_bar_chart/radial_bar_chart.css">\n', '')

with open('Main/index.html', 'w') as f:
    f.write(new_content)

print("Successfully updated Main/index.html to use iframe")
