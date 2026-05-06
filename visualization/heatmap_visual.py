import os
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

def create_heatmap():
    # Load the student sleep patterns dataset
    script_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(script_dir, '../dataset/student_sleep_patterns.csv')
    df = pd.read_csv(file_path)

    # To create a traditional heatmap from continuous data, we can bin the data
    # Create bins for Sleep Duration
    df['Sleep_Bins'] = pd.cut(df['Sleep_Duration'], bins=[0, 4, 6, 8, 10, 15], labels=['<4h', '4-6h', '6-8h', '8-10h', '>10h'])
    
    # Create bins for Screen Time
    df['Screen_Time_Bins'] = pd.cut(df['Screen_Time'], bins=[0, 1, 2, 3, 4, 10], labels=['<1h', '1-2h', '2-3h', '3-4h', '>4h'])

    # Create a crosstab (frequency count) of the two binned variables
    heatmap_data = pd.crosstab(df['Sleep_Bins'], df['Screen_Time_Bins'])

    # Initialize the matplotlib figure
    plt.figure(figsize=(10, 6))
    
    # Create the heatmap using seaborn
    ax = sns.heatmap(heatmap_data, annot=True, fmt='d', cmap='Blues', cbar_kws={'label': 'Number of Students'})
    
    # Invert the colorbar (legend) so that smaller numbers are at the bottom
    cbar = ax.collections[0].colorbar
    cbar.ax.invert_yaxis()
    
    # Add titles and labels
    plt.title('Relationship Between Sleep Duration and Screen Time', fontsize=14, pad=15)
    plt.xlabel('Screen Time (hours)', fontsize=12)
    plt.ylabel('Sleep Duration (hours)', fontsize=12)
    
    # Invert y-axis to have higher sleep duration at the top
    plt.gca().invert_yaxis()

    plt.tight_layout()
    
    # Save and show the plot
    plt.savefig('outputs/heatmap_sleep_vs_screen.png', dpi=300, bbox_inches='tight')
    plt.show()

if __name__ == '__main__':
    create_heatmap()
