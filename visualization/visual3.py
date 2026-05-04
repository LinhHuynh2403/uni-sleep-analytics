import pandas as pd
import matplotlib.pyplot as plt

# Load both datasets
df_patterns = pd.read_csv('dataset/student_sleep_patterns.csv')
df_health = pd.read_csv('dataset/mental_health_social_media_dataset.csv')

# Calculate correlations from Student Sleep Patterns
factors_patterns = ['Study_Hours', 'Screen_Time', 'Caffeine_Intake']
correlations_patterns = df_patterns[['Sleep_Duration'] + factors_patterns].corr()['Sleep_Duration'].drop('Sleep_Duration')

# Process Mental Health & Social Media Dataset
# One-hot encode the 'platform' column so we can calculate correlations for each social media platform
df_health_encoded = pd.get_dummies(df_health, columns=['platform'], dtype=int)
platform_cols = [col for col in df_health_encoded.columns if col.startswith('platform_')]

# Define the numerical factors (including the interactions you mentioned)
factors_health = ['social_media_time_min', 'anxiety_level', 'stress_level', 'negative_interactions_count', 'positive_interactions_count']
all_health_factors = factors_health + platform_cols

# Calculate correlations
correlations_health = df_health_encoded[['sleep_hours'] + all_health_factors].corr()['sleep_hours'].drop('sleep_hours')

# Clean up index names so they look beautiful on the chart
def clean_health_name(name):
    if name.startswith('platform_'):
        return name.replace('platform_', '') + ' (Platform)'
    return name.replace('_', ' ').title().replace(' Min', '').replace(' Count', '')

correlations_health.index = correlations_health.index.map(clean_health_name)

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