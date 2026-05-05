import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Load the dataset
df = pd.read_csv('dataset/student_sleep_patterns.csv')

# Sort University Year for proper ordering in plot
year_order = ['1st Year', '2nd Year', '3rd Year', '4th Year']
df['University_Year'] = pd.Categorical(df['University_Year'], categories=year_order, ordered=True)

# Create a Small Multiples view (FacetGrid)
g = sns.FacetGrid(df, col="University_Year", col_wrap=2, height=4, aspect=1.5, hue="University_Year", palette="viridis")
g.map(sns.histplot, "Sleep_Duration", bins=15, kde=True)

# Add Reference Line and Annotations to each subplot
for ax in g.axes.flat:
    ax.axvline(x=7, color='#ef4444', linestyle='--', linewidth=2, label='7h Recommendation')
    
    # Calculate percentage below 7 hours for this specific facet
    year = ax.get_title().split('=')[1].strip()
    subset = df[df['University_Year'] == year]
    if len(subset) > 0:
        percent_below_7 = (subset['Sleep_Duration'] < 7).mean() * 100
        ax.text(6.8, ax.get_ylim()[1]*0.85, f'{percent_below_7:.1f}% < 7h', 
                color='#ef4444', fontsize=10, fontweight='bold', ha='right')

# Formatting
g.fig.subplots_adjust(top=0.9)
g.fig.suptitle('How much do students actually sleep? (By University Year)', fontsize=16, fontweight='bold')
g.set_axis_labels('Hours of Sleep', 'Number of Students')
plt.savefig('outputs/visual1_histogram.png', dpi=300, bbox_inches='tight')