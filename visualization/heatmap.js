const lifestyleMatrix = {
    "Sleep Hours": {"Sleep Hours": 1.0, "Screen Time": -0.998, "Physical Activity": 0.998, "Stress": -0.834, "Mood": 0.694, "Social Media": -0.679, "Anxiety": -0.627},
    "Screen Time": {"Sleep Hours": -0.998, "Screen Time": 1.0, "Physical Activity": -0.999, "Stress": 0.835, "Mood": -0.694, "Social Media": 0.680, "Anxiety": 0.629},
    "Physical Activity": {"Sleep Hours": 0.998, "Screen Time": -0.999, "Physical Activity": 1.0, "Stress": -0.835, "Mood": 0.694, "Social Media": -0.680, "Anxiety": -0.628},
    "Stress": {"Sleep Hours": -0.834, "Screen Time": 0.835, "Physical Activity": -0.835, "Stress": 1.0, "Mood": -0.935, "Social Media": 0.882, "Anxiety": 0.899},
    "Mood": {"Sleep Hours": 0.694, "Screen Time": -0.694, "Physical Activity": 0.694, "Stress": -0.935, "Mood": 1.0, "Social Media": -0.867, "Anxiety": -0.903},
    "Social Media": {"Sleep Hours": -0.679, "Screen Time": 0.680, "Physical Activity": -0.680, "Stress": 0.882, "Mood": -0.867, "Social Media": 1.0, "Anxiety": 0.896},
    "Anxiety": {"Sleep Hours": -0.627, "Screen Time": 0.629, "Physical Activity": -0.628, "Stress": 0.899, "Mood": -0.903, "Social Media": 0.896, "Anxiety": 1.0}
};

const academicMatrix = {
    "Term GPA": {"Term GPA": 1.0, "Cum GPA": 0.638, "Total Sleep": 0.201, "Daytime Naps": -0.153, "Sleep Midpoint": -0.194, "Bedtime Variance": -0.035},
    "Cum GPA": {"Term GPA": 0.638, "Cum GPA": 1.0, "Total Sleep": 0.110, "Daytime Naps": -0.143, "Sleep Midpoint": -0.191, "Bedtime Variance": -0.006},
    "Total Sleep": {"Term GPA": 0.201, "Cum GPA": 0.110, "Total Sleep": 1.0, "Daytime Naps": -0.292, "Sleep Midpoint": -0.332, "Bedtime Variance": -0.137},
    "Daytime Naps": {"Term GPA": -0.153, "Cum GPA": -0.143, "Total Sleep": -0.292, "Daytime Naps": 1.0, "Sleep Midpoint": 0.088, "Bedtime Variance": 0.081},
    "Sleep Midpoint": {"Term GPA": -0.194, "Cum GPA": -0.191, "Total Sleep": -0.332, "Daytime Naps": 0.088, "Sleep Midpoint": 1.0, "Bedtime Variance": 0.410},
    "Bedtime Variance": {"Term GPA": -0.035, "Cum GPA": -0.006, "Total Sleep": -0.137, "Daytime Naps": 0.081, "Sleep Midpoint": 0.410, "Bedtime Variance": 1.0}
};

function flattenMatrix(matrix) {
    const data = [];
    const variables = Object.keys(matrix);
    variables.forEach(row => {
        variables.forEach(col => {
            data.push({ row, col, value: matrix[row][col] });
        });
    });
    return { data, variables };
}

// Reusable function to clear the highlights and reset the text panel
function resetSidePanel() {
    document.getElementById("factor-narrative-target").innerHTML = 
        '<p class="fallback-style">Click on a correlation cell in the heatmap to load its clinical downstream narrative.</p>';
    
    // Remove strokes and tracking classes from all rectangles
    d3.selectAll("rect")
      .style("stroke", "none")
      .classed("active-cell", false);
}

function drawHeatmap(containerId, matrixData, datasetName) {
    const { data, variables } = flattenMatrix(matrixData);
    const container = d3.select(`#${containerId}`);
    container.html("");

    const margin = {top: 130, right: 20, bottom: 20, left: 110},
          width = (variables.length * 70), 
          height = (variables.length * 70);

    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand().range([0, width]).domain(variables).padding(0.04);
    const y = d3.scaleBand().range([0, height]).domain(variables).padding(0.04);

    const colorScale = d3.scaleSequential()
        .interpolator(d3.interpolateRdYlBu)
        .domain([1, -1]);

    svg.append("g").attr("class", "axis-label").call(d3.axisTop(x).tickSize(0))
        .selectAll("text")
        .attr("transform", "translate(10,-10)rotate(-35)")
        .style("text-anchor", "start")
        .style("font-size", "13px");

    svg.append("g").attr("class", "axis-label").call(d3.axisLeft(y).tickSize(0))
        .selectAll("text")
        .style("font-size", "13px");

    svg.selectAll()
        .data(data).enter().append("rect")
        .attr("x", d => x(d.row))
        .attr("y", d => y(d.col))
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .attr("rx", 4)
        .style("fill", d => colorScale(d.value))
        .style("stroke", "none")
        .style("cursor", "pointer")
        .on("click", function(event, d) {
            // 1. Check if the clicked box is already active
            const isAlreadyActive = d3.select(this).classed("active-cell");

            // 2. Reset everything (clears the board regardless)
            resetSidePanel();

            // 3. If it wasn't active before, activate it and update the narrative
            if (!isAlreadyActive) {
                d3.select(this)
                  .style("stroke", "var(--accent-tint)")
                  .style("stroke-width", 3)
                  .classed("active-cell", true); // Add our tracking class
                  
                updateSidePanel(d.row, d.col, d.value, datasetName);
            }
        });

    svg.selectAll()
        .data(data).enter().append("text")
        .attr("x", d => x(d.row) + x.bandwidth() / 2)
        .attr("y", d => y(d.col) + y.bandwidth() / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .style("fill", d => Math.abs(d.value) > 0.45 ? "#ffffff" : "#1a1032")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .style("pointer-events", "none")
        .text(d => d.value.toFixed(2));
}

function updateSidePanel(var1, var2, value, datasetName) {
    const target = document.getElementById("factor-narrative-target");
    
    if (var1 === var2) {
        target.innerHTML = `
            <div class="active-factor-title">${var1} (Self)</div>
            <span class="active-factor-badge neutral">Perfect Association | Coefficient r = 1.000</span>
            <p style="color: #cbd5e1; font-size: 0.95rem;">Variables naturally possess a perfect positive mathematical correlation with themselves.</p>
        `;
        return;
    }

    const type = value < 0 ? "Negative" : "Positive";
    const badgeClass = value < 0 ? "negative" : "positive";
    const absVal = Math.abs(value);
    let strengthText = absVal > 0.8 ? "very strong" : absVal > 0.5 ? "strong" : "moderate";
    const relationshipDirection = value < 0 ? "decrease" : "increase";

    target.innerHTML = `
        <div class="active-factor-title">${var1} & ${var2}</div>
        <span class="active-factor-badge ${badgeClass}">${type} Association | Coefficient r = ${value.toFixed(3)}</span>
        
        <p style="font-size: 0.95rem; color: #cbd5e1; line-height: 1.6; margin-bottom: 15px;">
            <strong>Data Context:</strong> Extracted directly from the <em>${datasetName}</em>, highlighting the statistical relationship between these two parameters.
        </p>

        <p style="font-size: 0.95rem; color: #cbd5e1; line-height: 1.6;">
            <strong>Impact on Student Profile:</strong> There is a ${strengthText} ${type.toLowerCase()} correlation here. This implies that as a student's <em>${var1}</em> goes up, their <em>${var2}</em> tends to predictably ${relationshipDirection}.
        </p>
    `;
}

// Initialization and Intersection Observer for Scrollytelling
document.addEventListener("DOMContentLoaded", () => {
    drawHeatmap("heatmap1-target", lifestyleMatrix, "Dataset 5 (Mental Health)");
    drawHeatmap("heatmap2-target", academicMatrix, "Dataset 2 (CMU Wearables)");

    const layers = document.querySelectorAll('.heatmap-layer');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                document.querySelectorAll('.scroll-step').forEach(step => step.style.opacity = '0.4');
                entry.target.style.opacity = '1';

                const targetId = entry.target.getAttribute('data-target');
                
                layers.forEach(layer => layer.classList.remove('active-layer'));
                document.getElementById(targetId).classList.add('active-layer');

                // Ensure the panel cleanly resets when the user scrolls to a new chart
                resetSidePanel();
            }
        });
    }, {
        rootMargin: "-20% 0px -60% 0px"
    });

    document.querySelectorAll('.scroll-step').forEach(step => observer.observe(step));
});