// Creates a safe sandbox so variables don't crash the browser
(() => {
    document.addEventListener("DOMContentLoaded", () => {
        // 1. Unified Dataset Dictionaries
        const mhCorrs = {
            "Sleep Duration": {"Sleep Duration": 1.0, "Screen Time": -0.998, "Physical Activity": 0.998, "Stress": -0.834, "Mood": 0.694, "Social Media": -0.679, "Anxiety": -0.627},
            "Screen Time": {"Sleep Duration": -0.998, "Screen Time": 1.0, "Physical Activity": -0.999, "Stress": 0.835, "Mood": -0.694, "Social Media": 0.680, "Anxiety": 0.629},
            "Physical Activity": {"Sleep Duration": 0.998, "Screen Time": -0.999, "Physical Activity": 1.0, "Stress": -0.835, "Mood": 0.694, "Social Media": -0.680, "Anxiety": -0.628},
            "Stress": {"Sleep Duration": -0.834, "Screen Time": 0.835, "Physical Activity": -0.835, "Stress": 1.0, "Mood": -0.935, "Social Media": 0.882, "Anxiety": 0.899},
            "Mood": {"Sleep Duration": 0.694, "Screen Time": -0.694, "Physical Activity": 0.694, "Stress": -0.935, "Mood": 1.0, "Social Media": -0.867, "Anxiety": -0.903},
            "Social Media": {"Sleep Duration": -0.679, "Screen Time": 0.680, "Physical Activity": -0.680, "Stress": 0.882, "Mood": -0.867, "Social Media": 1.0, "Anxiety": 0.896},
            "Anxiety": {"Sleep Duration": -0.627, "Screen Time": 0.629, "Physical Activity": -0.628, "Stress": 0.899, "Mood": -0.903, "Social Media": 0.896, "Anxiety": 1.0}
        };

        const cmuCorrs = {
            "Term GPA": {"Term GPA": 1.0, "Cummulative GPA": 0.638, "Sleep Duration": 0.201, "Daytime Naps": -0.153, "Sleep Midpoint": -0.194, "Bedtime Variance": -0.035},
            "Cummulative GPA": {"Term GPA": 0.638, "Cummulative GPA": 1.0, "Sleep Duration": 0.110, "Daytime Naps": -0.143, "Sleep Midpoint": -0.191, "Bedtime Variance": -0.006},
            "Sleep Duration": {"Term GPA": 0.201, "Cummulative GPA": 0.110, "Sleep Duration": 1.0, "Daytime Naps": -0.292, "Sleep Midpoint": -0.332, "Bedtime Variance": -0.137},
            "Daytime Naps": {"Term GPA": -0.153, "Cummulative GPA": -0.143, "Sleep Duration": -0.292, "Daytime Naps": 1.0, "Sleep Midpoint": 0.088, "Bedtime Variance": 0.081},
            "Sleep Midpoint": {"Term GPA": -0.194, "Cummulative GPA": -0.191, "Sleep Duration": -0.332, "Daytime Naps": 0.088, "Sleep Midpoint": 1.0, "Bedtime Variance": 0.410},
            "Bedtime Variance": {"Term GPA": -0.035, "Cummulative GPA": -0.006, "Sleep Duration": -0.137, "Daytime Naps": 0.081, "Sleep Midpoint": 0.410, "Bedtime Variance": 1.0}
        };

        const allVariables = [
            "Screen Time", "Physical Activity", "Stress", "Mood", "Social Media", "Anxiety", 
            "Sleep Duration", 
            "Daytime Naps", "Sleep Midpoint", "Bedtime Variance", "Term GPA", "Cummulative GPA"
        ];

        // 2. Pre-compute the full unified matrix
        const fullData = [];
        allVariables.forEach(row => {
            allVariables.forEach(col => {
                let val = null;
                let dataset = "Unknown";
                
                if (mhCorrs[row] && mhCorrs[row][col] !== undefined) {
                    val = mhCorrs[row][col];
                    dataset = "Mental Health Tracking";
                } else if (cmuCorrs[row] && cmuCorrs[row][col] !== undefined) {
                    val = cmuCorrs[row][col];
                    dataset = "CMU Wearables";
                }
                
                fullData.push({ row, col, value: val, id: `${row}-${col}`, dataset });
            });
        });

        // 3. Storytelling Subsets
        const storyFocusSets = {
            "all": allVariables,
            "lifestyle": ["Screen Time", "Physical Activity", "Stress", "Mood", "Social Media", "Anxiety", "Sleep Duration"],
            "academic": ["Sleep Duration", "Daytime Naps", "Sleep Midpoint", "Bedtime Variance", "Term GPA", "Cummulative GPA"],
            "bridge": ["Screen Time", "Stress", "Sleep Duration", "Term GPA", "Cummulative GPA"]
        };

        // 4. SVG Setup & Cleanup
        const container = d3.select("#unified-heatmap-target");
        // Clear any phantom SVG elements leftover from previous hot reloads
        container.selectAll("*").remove(); 

        // Balanced Margins (Keeps chart perfectly in the middle)
        const margin = {top: 100, right: 100, bottom: 100, left: 140};
        const innerWidth = 500; 
        const innerHeight = 500;

        const svg = container.append("svg")
            .attr("width", innerWidth + margin.left + margin.right)
            .attr("height", innerHeight + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand().range([0, innerWidth]).padding(0.04);
        const y = d3.scaleBand().range([0, innerHeight]).padding(0.04);
        const colorScale = d3.scaleSequential().interpolator(d3.interpolateRdYlBu).domain([1, -1]);

        const xAxis = svg.append("g").attr("class", "axis-label");
        const yAxis = svg.append("g").attr("class", "axis-label");

        // Reusable Panel Reset
        function resetSidePanel() {
            document.getElementById("factor-narrative-target").innerHTML = 
                '<p class="fallback-style">Click on a correlation cell in the heatmap to load its clinical downstream narrative.</p>';
            d3.selectAll(".heatmap-rect").style("stroke", "none").classed("active-cell", false);
        }

        // 5. The Dynamic Update Function
        function updateHeatmap(focusKey) {
            const activeVars = storyFocusSets[focusKey];
            const filteredData = fullData.filter(d => activeVars.includes(d.row) && activeVars.includes(d.col));

            x.domain(activeVars);
            y.domain(activeVars);

            // Faster transition speed to prevent overlapping animations when scrolling fast
            const t = svg.transition("zoom-transition").duration(450).ease(d3.easeCubicInOut);

            // Animate axes
            xAxis.transition(t).call(d3.axisTop(x).tickSize(0))
                .selectAll("text").attr("transform", "translate(10,-10)rotate(-35)").style("text-anchor", "start").style("font-size", "13px");
            yAxis.transition(t).call(d3.axisLeft(y).tickSize(0))
                .selectAll("text").style("font-size", "13px");

            // DATA JOIN for rectangles
            svg.selectAll(".heatmap-rect")
                .data(filteredData, d => d.id)
                .join(
                    enter => enter.append("rect")
                        .attr("class", "heatmap-rect")
                        .attr("x", d => x(d.row))
                        .attr("y", d => y(d.col))
                        .attr("width", x.bandwidth())
                        .attr("height", y.bandwidth())
                        .attr("rx", 4)
                        .style("fill", d => d.value !== null ? colorScale(d.value) : "rgba(30, 18, 60, 0.5)")
                        .style("stroke", "none")
                        .style("cursor", "pointer")
                        .style("opacity", 0)
                        .call(enter => enter.transition(t).style("opacity", 1)),
                    update => update.call(update => update.transition(t)
                        .attr("x", d => x(d.row))
                        .attr("y", d => y(d.col))
                        .attr("width", x.bandwidth())
                        .attr("height", y.bandwidth())
                    ),
                    exit => exit.call(exit => exit.transition(t).style("opacity", 0).remove())
                )
                .on("click", function(event, d) {
                    const isAlreadyActive = d3.select(this).classed("active-cell");
                    resetSidePanel();
                    if (!isAlreadyActive) {
                        d3.select(this).style("stroke", "var(--accent-tint)").style("stroke-width", 3).classed("active-cell", true);
                        updateSidePanel(d);
                    }
                });

            // DATA JOIN for text inside boxes
            svg.selectAll(".heatmap-text")
                .data(filteredData, d => d.id)
                .join(
                    enter => enter.append("text")
                        .attr("class", "heatmap-text")
                        .attr("x", d => x(d.row) + x.bandwidth() / 2)
                        .attr("y", d => y(d.col) + y.bandwidth() / 2)
                        .attr("text-anchor", "middle")
                        .attr("dominant-baseline", "central")
                        .style("pointer-events", "none")
                        .text(d => d.value !== null ? d.value.toFixed(2) : "-")
                        .style("opacity", 0)
                        .call(enter => enter.transition(t).style("opacity", 1)),
                    update => update.call(update => update.transition(t)
                        .attr("x", d => x(d.row) + x.bandwidth() / 2)
                        .attr("y", d => y(d.col) + y.bandwidth() / 2)
                    ),
                    exit => exit.call(exit => exit.transition(t).style("opacity", 0).remove())
                )
                .style("fill", d => d.value !== null && Math.abs(d.value) > 0.45 ? "#ffffff" : "#7b6b99")
                .style("font-weight", "bold")
                .style("font-size", activeVars.length > 8 ? "11px" : "15px");
        }

        // 6. Side Panel Narrative Generator
        function updateSidePanel(d) {
            const target = document.getElementById("factor-narrative-target");
            
            if (d.value === null) {
                target.innerHTML = `
                    <div class="active-factor-title">${d.row} & ${d.col}</div>
                    <span class="active-factor-badge neutral">Data Incompatible</span>
                    <p style="color: #cbd5e1; line-height: 1.6;">These two metrics were recorded in separate tracking studies. We cannot mathematically prove a direct correlation between them.</p>
                `;
                return;
            }

            if (d.row === d.col) {
                target.innerHTML = `
                    <div class="active-factor-title">${d.row} (Self)</div>
                    <span class="active-factor-badge neutral">Perfect Association | r = 1.000</span>
                    <p style="color: #cbd5e1; line-height: 1.6;">Variables naturally possess a perfect positive mathematical correlation with themselves.</p>
                `;
                return;
            }

            const type = d.value < 0 ? "Negative" : "Positive";
            const badgeClass = d.value < 0 ? "negative" : "positive";
            const absVal = Math.abs(d.value);
            let strengthText = absVal > 0.8 ? "very strong" : absVal > 0.5 ? "strong" : "moderate";
            const relationshipDirection = d.value < 0 ? "decrease" : "increase";

            target.innerHTML = `
                <div class="active-factor-title">${d.row} & ${d.col}</div>
                <span class="active-factor-badge ${badgeClass}">${type} Association | r = ${d.value.toFixed(3)}</span>
                <p style="font-size: 0.95rem; color: #cbd5e1; line-height: 1.6;"><strong>Impact:</strong> There is a ${strengthText} ${type.toLowerCase()} correlation here. This implies that as a student's <em>${d.row}</em> goes up, their <em>${d.col}</em> tends to ${relationshipDirection}.</p>
            `;
        }

        // 7. Initialize
        updateHeatmap("all");
        let currentFocus = "all";

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const focusKey = entry.target.getAttribute('data-focus');
                    
                    // State Lock Performance Fix
                    if (focusKey && focusKey !== currentFocus) {
                        currentFocus = focusKey;

                        document.querySelectorAll('.scroll-step').forEach(step => step.classList.remove('active-step'));
                        entry.target.classList.add('active-step');

                        resetSidePanel();
                        
                        requestAnimationFrame(() => {
                            updateHeatmap(focusKey);
                        });
                    }
                }
            });
        }, {
            threshold: 0.5 
        });

        document.querySelectorAll('.scroll-step').forEach(step => observer.observe(step));
    });
})();