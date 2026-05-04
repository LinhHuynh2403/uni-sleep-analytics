import pandas as pd
import plotly.graph_objects as go
import numpy as np

# Load the dataset
df = pd.read_csv('dataset/sleep_habits.csv')

# Clean up column names
df = df.rename(columns={
    '  What time do you usually wake up?  ': 'Wake_Up',
    'Unnamed: 13': 'Bedtime',
    'How would you rate the quality of your sleep?': 'Quality_of_Sleep'
})

# Parsing functions for the messy string ranges
def parse_bedtime(val):
    if pd.isna(val): return np.nan
    val = str(val).strip().lower()
    if 'before 10 pm' in val: return 21.5
    elif '10 pm - 11 pm' in val: return 22.5
    elif '11 pm - 12 am' in val: return 23.5
    elif 'after 12 am' in val: return 0.5
    return np.nan

def parse_wakeup(val):
    if pd.isna(val): return np.nan
    val = str(val).strip().lower()
    if 'before 5am' in val: return 4.5
    elif '5 am - 6 am' in val: return 5.5
    elif '6 am - 7 am' in val: return 6.5
    elif 'after 7 am' in val: return 7.5
    return np.nan

df['Bedtime_Hour'] = df['Bedtime'].apply(parse_bedtime)
df['Wakeup_Hour'] = df['Wake_Up'].apply(parse_wakeup)

# Drop rows where parsing failed
df = df.dropna(subset=['Bedtime_Hour', 'Wakeup_Hour', 'Quality_of_Sleep'])

# Sort by Bedtime to make it look nicer
df = df.sort_values(by='Bedtime_Hour').reset_index(drop=True)

fig = go.Figure()

def time_to_deg(t):
    return (t / 24) * 360

# Quality of sleep color mapping
quality_colors = {
    'Excellent': '#10b981', # Green
    'Good': '#3b82f6',      # Blue
    'Fair': '#f59e0b',      # Orange
    'Poor': '#ef4444',      # Red
    'Worst': '#7f1d1d'      # Dark Red
}

# Plotting the arcs for each respondent
for i, row in df.iterrows():
    start_t = row['Bedtime_Hour']
    end_t = row['Wakeup_Hour']
    
    if end_t < start_t:
        t_values = np.linspace(start_t, 24, 20).tolist() + np.linspace(0, end_t, 20).tolist()
    else:
        t_values = np.linspace(start_t, end_t, 40).tolist()
        
    theta = [time_to_deg(t) for t in t_values]
    r = [i + 1] * len(theta)
    
    color = quality_colors.get(row['Quality_of_Sleep'], '#cbd5e1')
    
    fig.add_trace(go.Scatterpolar(
        r=r,
        theta=theta,
        mode='lines',
        line=dict(width=2, color=color),
        name=row['Quality_of_Sleep'],
        showlegend=False,
        hoverinfo='text',
        text=f"Bedtime: {row['Bedtime']}<br>Wake up: {row['Wake_Up']}<br>Quality: {row['Quality_of_Sleep']}"
    ))

# Add dummy traces for legend
for quality, color in quality_colors.items():
    if quality in df['Quality_of_Sleep'].unique():
        fig.add_trace(go.Scatterpolar(
            r=[None], theta=[None], mode='lines',
            line=dict(width=3, color=color),
            name=quality
        ))

# Configure the polar chart
fig.update_layout(
    title=dict(text="When are people actually sleeping?", font=dict(size=20), x=0.5),
    polar=dict(
        angularaxis=dict(
            direction='clockwise',
            rotation=90, 
            tickvals=[0, 45, 90, 135, 180, 225, 270, 315],
            ticktext=['12 AM', '3 AM', '6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM'],
            showline=True,
            showgrid=True
        ),
        radialaxis=dict(
            showticklabels=False,
            showgrid=False,
            range=[0, len(df) + 5]
        )
    ),
    showlegend=True,
    legend=dict(title="Quality of Sleep", orientation="h", yanchor="bottom", y=-0.15, xanchor="center", x=0.5)
)

fig.write_html('outputs/visual2_radial_clock.html')
fig.show()