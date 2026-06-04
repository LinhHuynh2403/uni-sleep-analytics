# The Exhausted Campus 🌙
> **An Interactive Cross-Dataset Mapping of Lifestyle Elements Transforming Student Rest**

[![Course Project](https://img.shields.io/badge/ECS_163-Information_Visualization-7964d5)](https://cs.ucdavis.edu/schedules-classes/ecs-163-information-interfaces)
[![Aesthetic](https://img.shields.io/badge/Aesthetic-Dark_Academic_Night-160f29)](#)

---

## 📖 The Narrative Outline

College is routinely celebrated as a foundational era of academic expansion and newfound social discovery. However, hidden right beneath this vibrant surface lies a quiet, accelerating epidemic of sleep deprivation. 

**The Exhausted Campus** is a scroll-driven data narrative built using a **Martini Glass structure**. It guides you from the highly structured macro-realities of student lifestyle pressures straight into an exploratory, self-calibrating interactive workspace.

The narrative arc tracks a compounding cause-and-effect biological loop:
1. **The Daily Grind (Micro-View):** We start with the daily schedule, analyzing how a student's 24-hour cycle is fundamentally bottlenecked by competitive study demands and pre-bedtime digital interaction.
2. **The 4-Year Accumulation (Longitudinal View):** We expand out to look at the structural progression of "Sleep Debt" from Freshman transition to senior-year chronic exhaustion.
3. **The Interconnected Pathways (Statistical & Individual View):** We open up the framework, giving you full control to explore lifestyle correlations and chart personal choices down individual risk pathways where sleep loss directly correlates with heightened academic stress and falling GPAs.

---

## 📊 Core Visualizations

Our scrollytelling interface is powered dynamically by custom **D3.js** visual steps:

* **Apple Watch-Inspired Radial Bar Chart:** Illustrates the rhythmic "shape" of the university night, converting daily routines (study hours, screen time, physical exercise) into high-friction overlapping rings.
* **Longitudinal Split-Screen Bar Chart:** Compares student rest configurations across individual university cohorts against the critical 7-hour healthy baseline threshold.
* **Pearson Correlation Matrix Heatmap:** Exposes interactive, real-time downstream statistical relationships between cross-dataset lifestyle elements.
* **Interactive Multi-Node Sankey Diagram:** The "main character" interface, allowing users to actively map how inputs like caffeine, study load, and blue-light exposure stream directly into insomnia and academic degradation.

---

## 🗃️ Datasets Used

This project dynamically unifies **four distinct survey and sensor tracking datasets** to construct a holistic representation of student lifestyle health:

| Dataset Name | Source | Key Captured Features |
| :--- | :--- | :--- |
| **The Student Sleep Patterns** | Kaggle | Age, gender, university year, sleep duration, study hours, screen tracking, caffeine intake, active wellness outlets. |
| **Social Media Mental Health Indicators** | Kaggle | Recreational device tracking intervals, targeted platforms, platform engagement sentiment, and delayed sleep onset parameters. |
| **Sleep Habits & Bedtime Routines** | Kaggle | Bedtime timestamps, power naps, clinical sleep difficulty tracking, pre-sleep habits, and geographical baseline variations. |
| **Student Insomnia & Educational Outcomes** | Mendeley Data | Quantified metrics linking late-night caffeine spikes and blue-light exposure to daytime fatigue, academic anxiety, and cumulative GPA shifts. |

---

## 📂 Project Structure

This project follows a clean, asset-based architecture:

* **`Main/`** — Contains the core `index.html` scrollytelling document.
* **`dataset/`** — Dedicated to raw data files (e.g., `.csv`, `.json`).
* **`styles/`** — Global and component-specific stylesheets (`radial_bar_chart.css`, `heatmap.css`).
* **`visualization/`** — All D3.js visualization scripts and data logic (`radial_bar_chart.js`, `bar_chart.js`, `heatmap.js`, `correlation_matrices.js`, `data.js`).
* **`preprocess.py` & `build_data.py`** — Root-level Python utility scripts for data cleaning and pipeline preparation.

---

## 🚀 How to Run the Website Locally

Since this visualization relies on modular architecture and imports local tracking datasets using modern script bindings, running the file directly via `file://` protocols in your browser may cause **CORS (Cross-Origin Resource Sharing) blockages**. 

To run the interactive narrative smoothly, deploy a simple local development server using one of the quick methods below.

### Method A: Using VS Code (Easiest)
1. Open this project directory folder inside **Visual Studio Code**.
2. Install the **Live Server** extension (by Ritwick Dey) from the Extensions Marketplace.
3. Navigate to `Main/index.html` and open it.
4. Click the **"Go Live"** button in the bottom-right status bar of your VS Code window.
5. Your browser will launch automatically at `http://127.0.0.1:5500/Main/index.html`.

### Method B: Using Python Terminal (No Extensions Required)
If you have Python installed on your computer, you can launch a local server instantly via your terminal:

1. Open your Terminal (Mac/Linux) or Command Prompt/PowerShell (Windows).
2. Navigate (`cd`) into the main project directory:
   ```bash
   cd /path/to/uni-sleep-analytics
   ```
3. Start the built-in Python web server:
   ```bash
   python -m http.server 8000
   ```
4. Open your web browser and go to: `http://localhost:8000/Main/index.html`

---

## 👥 Contributors

This project was developed for the **ECS 163 Information Visualization** course at UC Davis.

Created by:
* **Linh Huynh**: Worked on Radial Bar Chart
* **William Pham**: Worked on Heatmap
* **Pachia Yang**
* **Parwaan Virk**
* **Kylie Lallak**

&copy; 2026 The UC Davis Project Sleep Study. All data cited from Kaggle.