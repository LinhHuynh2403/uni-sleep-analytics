import pandas as pd
import matplotlib.pyplot as plt

# Load both datasets
df_patterns = pd.read_csv('dataset/student_sleep_patterns.csv')
df_health = pd.read_csv('dataset/sleep_health_and_lifestyle_dataset.csv')

# Calculate correlations from Student Sleep Patterns
factors_patterns = ['Study_Hours', 'Screen_Time', 'Caffeine_Intake']
correlations_patterns = df_patterns[['Sleep_Duration'] + factors_patterns].corr()['Sleep_Duration'].drop('Sleep_Duration')

# Calculate correlations from Sleep Health and Lifestyle (treating it as the "Social Media / Lifestyle" context)
# The dataset has 'Sleep Duration' (with space) and 'Stress Level'
factors_health = ['Stress Level']
correlations_health = df_health[['Sleep Duration'] + factors_health].corr()['Sleep Duration'].drop('Sleep Duration')

# Combine the correlations
all_correlations = pd.concat([correlations_patterns, correlations_health])

# Sort them
all_correlations = all_correlations.sort_values()

# Plotting
plt.figure(figsize=(10, 6))

# Negative correlations in red, positive in green
colors = ['#ef4444' if x < 0 else '#10b981' for x in all_correlations]

# Create horizontal bar chart
labels = all_correlations.index.str.replace('_', ' ')
bars = plt.barh(labels, all_correlations.values, color=colors)

# Add value labels to the bars
for bar, value in zip(bars, all_correlations.values):
    x_pos = value - 0.05 if value < 0 else value + 0.01
    ha = 'right' if value < 0 else 'left'
    plt.text(x_pos, bar.get_y() + bar.get_height()/2, f'{value:.2f}', 
             va='center', ha=ha, fontsize=10, fontweight='bold', 
             color=bar.get_facecolor())

plt.title("What's stealing student sleep?", fontsize=16, fontweight='bold')
plt.xlabel('Correlation with Sleep Duration', fontsize=12)
plt.axvline(x=0, color='black', linewidth=1)
plt.xlim(-1.1, 1.1)
plt.tight_layout()
plt.savefig('outputs/visual3_correlations.png', dpi=300, bbox_inches='tight')
plt.show()