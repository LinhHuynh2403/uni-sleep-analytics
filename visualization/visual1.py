import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Load the dataset
df = pd.read_csv('dataset/student_sleep_patterns.csv')

# Sort University Year for proper ordering
year_order = ['1st Year', '2nd Year', '3rd Year', '4th Year']
df['University_Year'] = pd.Categorical(df['University_Year'], categories=year_order, ordered=True)

# 1. Increased 'height' and 'aspect' for wider, more readable subplots
# 2. Added 'margin_titles=True' to pull titles away from the bars
g = sns.FacetGrid(df, col="University_Year", col_wrap=2, 
                  height=5, aspect=1.6, 
                  hue="University_Year", palette="viridis")

g.map(sns.histplot, "Sleep_Duration", bins=15, kde=True, edgecolor="white", alpha=0.7)

# Add Reference Line and Annotations to each subplot
for ax in g.axes.flat:
    # Add a thicker reference line for clarity
    ax.axvline(x=7, color='#ef4444', linestyle='--', linewidth=2.5, label='7h Recommendation')
    
    # Ensure x-axis numbers show on all subplots
    ax.tick_params(labelbottom=True, labelsize=11)
    
    # Calculate percentage below 7 hours
    title_text = ax.get_title()
    if '=' in title_text:
        year = title_text.split('=')[1].strip()
        subset = df[df['University_Year'] == year]
        if len(subset) > 0:
            percent_below_7 = (subset['Sleep_Duration'] < 7).mean() * 100
            # Moved text higher up and further left to avoid overlapping the top bars
            ax.text(6.8, ax.get_ylim()[1]*0.9, f'{percent_below_7:.1f}% < 7h', 
                    color='#ef4444', fontsize=12, fontweight='bold', ha='right')

# --- LAYOUT FIXES ---

# 1. Provide more room at the top for the main title
g.fig.subplots_adjust(top=0.88, hspace=0.4, wspace=0.25) 

# 2. Add padding to axis labels
g.set_axis_labels('Hours of Sleep', 'Number of Students', 
                  fontsize=13, fontweight='bold', labelpad=15)

# 3. Use set_titles with padding to make "1st Year", etc., look cleaner
g.set_titles(col_template="{col_name}", pad=20, size=14, fontweight='bold')

g.fig.suptitle('How much do students actually sleep? (By University Year)', 
               fontsize=18, fontweight='bold', y=0.98)

# Use tight_layout to handle any remaining overlap automatically
plt.tight_layout(rect=[0, 0.03, 1, 0.95])

plt.savefig('outputs/visual1_histogram.png', dpi=300, bbox_inches='tight')
plt.show()