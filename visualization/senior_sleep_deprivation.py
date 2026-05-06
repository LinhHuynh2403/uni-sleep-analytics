import os
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import numpy as np

def create_senior_visual():
    # Load the student sleep patterns dataset
    script_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(script_dir, '../dataset/student_sleep_patterns.csv')
    df = pd.read_csv(file_path)

    # Calculate average sleep by year
    avg_sleep = df.groupby('University_Year')['Sleep_Duration'].mean().reset_index()
    
    # Calculate percentage sleeping < 7 hours by year
    df['Sleep_Deprived'] = df['Sleep_Duration'] < 7
    deprived_pct = df.groupby('University_Year')['Sleep_Deprived'].mean().reset_index()
    deprived_pct['Sleep_Deprived'] *= 100

    order = ['1st Year', '2nd Year', '3rd Year', '4th Year']
    
    plt.figure(figsize=(10, 7))
    
    # Create bar plot for average sleep
    ax = sns.barplot(x='University_Year', y='Sleep_Duration', hue='University_Year', 
                     data=avg_sleep, order=order, palette='Blues', legend=False)
    
    # Add exact hour labels and the percentage of students < 7h on top of the bars
    for i, p in enumerate(ax.patches):
        year = order[i]
        # Get the percentage for this specific year
        pct = deprived_pct.loc[deprived_pct['University_Year'] == year, 'Sleep_Deprived'].values[0]
        
        # Format the annotation text
        text_label = f"{p.get_height():.2f}h\n({pct:.1f}% < 7h)"
        
        ax.annotate(text_label, 
                    (p.get_x() + p.get_width() / 2., p.get_height()), 
                    ha='center', va='center', fontsize=11, fontweight='bold', 
                    color='black', xytext=(0, 16), textcoords='offset points')

    # # Draw a line for the recommended 7 hours of sleep
    # ax.axhline(y=7, color='#ef4444', linestyle='--', linewidth=2, label='Recommended 7 Hours')
    
    # Highlight the 4th Year (Senior) bar by changing its color to match the line/alert theme
    for i, bar in enumerate(ax.patches):
        if i == 3: # index 3 corresponds to '4th Year'
            bar.set_color('#ef4444')
            
    # Labels and formatting
    plt.title('Average Sleep Duration by University Year', fontsize=16, fontweight='bold', pad=15)
    plt.xlabel('University Year', fontsize=12, fontweight='bold')
    plt.ylabel('Average Sleep Duration (Hours)', fontsize=12, fontweight='bold')
    
    # Show more smaller (decimal) intervals on the y-axis
    plt.yticks(np.arange(0, 9, 0.5))
    plt.ylim(0, 8.5)
    
    plt.legend(loc='upper right')

    # Adjust layout
    plt.tight_layout()
    
    # Save the output
    output_dir = os.path.join(script_dir, '../outputs')
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, 'senior_sleep_deprivation.png')
    plt.savefig(output_path, dpi=300)
    plt.close()
    
    print(f"-> A new visual has been saved to: {output_path}")

if __name__ == '__main__':
    create_senior_visual()
