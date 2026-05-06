import os
import pandas as pd
import matplotlib.pyplot as plt

def display_sleep_stats():
    # Load the student sleep patterns dataset
    script_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(script_dir, '../dataset/student_sleep_patterns.csv')
    df = pd.read_csv(file_path)

    # Extract the Sleep Duration column
    sleep = df['Sleep_Duration']
    
    # Calculate statistics
    total = len(sleep)
    avg_sleep = sleep.mean()
    median_sleep = sleep.median()
    min_sleep = sleep.min()
    max_sleep = sleep.max()
    
    # Calculate percentages for healthy vs unhealthy sleep amounts
    under_7 = (sleep < 7).sum() / total * 100
    healthy = ((sleep >= 7) & (sleep <= 9)).sum() / total * 100
    over_9 = (sleep > 9).sum() / total * 100
    
    # Format the output as a clean text summary
    output = f"""
OVERALL COLLEGE STUDENT SLEEP STATISTICS
{'-'*50}
Total Students Analyzed: {total}

Summary Metrics:
Average Sleep: {avg_sleep:.2f} hours
Median Sleep:  {median_sleep:.2f} hours
Minimum Sleep: {min_sleep:.2f} hours
Maximum Sleep: {max_sleep:.2f} hours

Sleep Recommendations Breakdown:
< 7 hours (Sleep Deprived): {under_7:.1f}%
7 - 9 hours (Healthy):      {healthy:.1f}%
> 9 hours (Oversleeping):   {over_9:.1f}%
"""
    
    # Print the summary to the console
    print(output)
    
    # Save the output to a PNG file using matplotlib
    output_dir = os.path.join(script_dir, '../outputs')
    os.makedirs(output_dir, exist_ok=True)
    
    fig, ax = plt.subplots(figsize=(6, 5))
    ax.axis('off')
    
    # Add the text to the plot with styling
    ax.text(0.5, 0.5, output.strip(), 
            fontsize=12, family='monospace', 
            ha='center', va='center', 
            bbox=dict(boxstyle='round,pad=1', facecolor='#f8fafc', edgecolor='#cbd5e1', linewidth=2),
            color='#1e293b')
            
    output_path = os.path.join(output_dir, 'overall_sleep_stats.png')
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()
        
    print(f"-> An image summary has been saved to: {output_path}")

if __name__ == '__main__':
    display_sleep_stats()
