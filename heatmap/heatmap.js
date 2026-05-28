// Label dictionary mapping code headers to human-readable text
const labelMapping = {
    "Year_of_Study": "Year of Study",
    "Sleep_Difficulty_Night": "Nightly Sleep Difficulty",
    "Sleep_Hours_Average": "Average Sleep Hours",
    "Wake_Up_Trouble": "Nocturnal Waking Trouble",
    "Sleep_Quality_Rating": "Sleep Quality Rating",
    "Concentration_Difficulty": "Concentration Difficulty",
    "Daytime_Fatigue": "Daytime Fatigue",
    "Miss_Skip_Classes": "Missed/Skipped Classes",
    "Insufficient_Sleep_Impact": "Insufficient Sleep Impact",
    "Device_Before_Bed": "Pre-Bed Device Use",
    "Caffeine_Consumption": "Caffeine Consumption",
    "Physical_Activity": "Physical Activity",
    "Academic_Stress_Level": "Academic Stress Level",
    "Academic_Performance": "Academic Performance",
    "cohort": "Student Cohort",
    "demo_race": "Race / Ethnicity",
    "demo_gender": "Gender",
    "demo_firstgen": "First-Gen Student Status",
    "bedtime_mssd": "Bedtime Variability (MSSD)",
    "TotalSleepTime": "Total Sleep Time",
    "midpoint_sleep": "Sleep Midpoint",
    "frac_nights_with_data": "Nights Measured %",
    "daytime_sleep": "Daytime Naps",
    "cum_gpa": "Cumulative GPA",
    "term_gpa": "Term GPA",
    "term_units": "Term Units Registered",
    "Zterm_units_ZofZ": "Normalized Units (Z-Score)",
    "Age": "Age",
    "Gender": "Gender",
    "University_Year": "University Year",
    "Sleep_Duration": "Sleep Duration (Hours)",
    "Study_Hours": "Weekly Study Hours",
    "Screen_Time": "Daily Screen Time",
    "Caffeine_Intake": "Daily Caffeine Intake",
    "Weekday_Sleep_Start": "Weekday Sleep Start Time",
    "Weekend_Sleep_Start": "Weekend Sleep Start Time",
    "Weekday_Sleep_End": "Weekday Wake-up Time",
    "Weekend_Sleep_End": "Weekend Wake-up Time",
    "Difficulty_Falling_Staying_Asleep": "Difficulty Falling/Staying Asleep",
    "Daytime_Naps": "Daytime Naps Frequency",
    "Lights_On_During_Sleep": "Lights On During Sleep",
    "Exercise_Regularity": "Exercise Regularity",
    "Bedtime_Act_Electronics": "Pre-Bed: Electronics",
    "Bedtime_Act_TV_Movies": "Pre-Bed: TV/Movies",
    "Bedtime_Act_Reading": "Pre-Bed: Reading",
    "age": "Age",
    "gender": "Gender",
    "platform": "Social Media Platform",
    "daily_screen_time_min": "Daily Screen Time (Min)",
    "social_media_time_min": "Social Media Use (Min)",
    "negative_interactions_count": "Negative Interactions",
    "positive_interactions_count": "Positive Interactions",
    "sleep_hours": "Sleep Duration (Hours)",
    "physical_activity_min": "Physical Activity (Min)",
    "anxiety_level": "Anxiety Level",
    "stress_level": "Stress Level",
    "mood_level": "Mood Level",
    "mental_state": "Mental State"
};

const topFactors = [
    { factor: "Daily Screen Time", correlation: -0.9986, type: "Negative", dataset: "Dataset 5 (Mental Health)", impact: "High screen runtime triggers high cognitive alertness and blocks endogenous melatonin secretion." },
    { factor: "Physical Activity Duration", correlation: 0.9981, type: "Positive", dataset: "Dataset 5 (Mental Health)", impact: "Regular physical movement acts as an immediate biological catalyst for deep slow-wave sleep cycles." },
    { factor: "Psychological Stress Index", correlation: -0.8345, type: "Negative", dataset: "Dataset 5 (Mental Health)", impact: "Elevated mental workloads provoke sympathetic nervous system over-arousal, causing severe bedtime latency." },
    { factor: "Social Media Scroll Time", correlation: -0.6798, type: "Negative", dataset: "Dataset 5 (Mental Health)", impact: "Prolonged screen stimulation before bedtime shortens available sleep duration." },
    { factor: "Anxiety Trait Levels", correlation: -0.6278, type: "Negative", dataset: "Dataset 5 (Mental Health)", impact: "Intrusive pre-sleep thoughts and worry induce chronic nocturnal waking cycles." },
    { factor: "Subjective Sleep Difficulty", correlation: -0.5401, type: "Negative", dataset: "Dataset 4 (Bedtime Routine)", impact: "Frequent struggles to fall or stay asleep create a state of pre-bed anxiety." },
    { factor: "Delayed Sleep Midpoint", correlation: -0.3471, type: "Negative", dataset: "Dataset 2 (CMU Wearables)", impact: "Wearable sensor logs reveal that a significantly delayed sleep midpoint cuts off critical deep restorative sleep phases." },
    { factor: "Daytime Napping Duration", correlation: -0.2852, type: "Negative", dataset: "Dataset 2 (CMU Wearables)", impact: "Unstructured or prolonged mid-day naps diminish baseline homeostatic sleep drive." },
    { factor: "Pre-Bed Device Electronic Use", correlation: -0.2910, type: "Negative", dataset: "Dataset 4 (Bedtime Routine)", impact: "Interfacing with tablet or phone displays immediately prior to closing eyes degrades qualitative rest depth." },
    { factor: "Nocturnal Waking Trouble", correlation: -0.3692, type: "Negative", dataset: "Dataset 1 (Student Insomnia)", impact: "Frequent midnight awakenings interrupt memory consolidation pathways, causing high morning fatigue scores." }
];

const colorMapper = d3.scaleSequential()
    .interpolator(d3.interpolateRdYlBu)
    .domain([1, -1]);

// Standard Execution Initializer Loop
document.addEventListener("DOMContentLoaded", () => {
    initMatrixRenderer("dataset2");
    initFactorBarChart();

    const dropdown = document.getElementById("dataset-dropdown");
    if (dropdown) {
        dropdown.addEventListener("change", (e) => {
            initMatrixRenderer(e.target.value);
            console.log(e.target.value);
        });
    }
});

function initMatrixRenderer(datasetKey) {
    const rawData = correlationData[datasetKey];
    const viewContainer = d3.select("#heatmap-render-target");
    
    // Clear out everything inside container space to prepare for redrawing completely
    viewContainer.html(""); 

    const baseRows = Array.from(new Set(rawData.map(d => d.row)));
    const orderedVariables = getClusteredOrder(rawData, baseRows);
    const rows = orderedVariables;
    const cols = orderedVariables; 

    // Safe padded zones (allocating right margin headroom to lock vertical legend inside SVG boundaries)
    const paddingOffset = { top: 120, right: 190, bottom: 40, left: 200 };
    
    const matrixInnerWidth = rows.length * 40;
    const matrixInnerHeight = cols.length * 40;
    
    const chartWidth = matrixInnerWidth + paddingOffset.left + paddingOffset.right;
    const chartHeight = matrixInnerHeight + paddingOffset.top + paddingOffset.bottom;

    const svgOuter = viewContainer.append("svg")
        .attr("width", "100%")
        .attr("height", chartHeight)
        .attr("viewBox", `0 0 ${chartWidth} ${chartHeight}`);

    const canvasSvg = svgOuter.append("g")
        .attr("transform", `translate(${paddingOffset.left}, ${paddingOffset.top})`);

    const xRange = d3.scaleBand().range([0, matrixInnerWidth]).domain(rows).padding(0.04);
    const yRange = d3.scaleBand().range([0, matrixInnerHeight]).domain(cols).padding(0.04);

    canvasSvg.selectAll()
        .data(rawData)
        .enter()
        .append("rect")
        .attr("x", d => xRange(d.row))
        .attr("y", d => yRange(d.col))
        .attr("width", xRange.bandwidth())
        .attr("height", yRange.bandwidth())
        .style("fill", d => colorMapper(d.value))
        .style("stroke", "rgba(160, 120, 255, 0.1)")
        .style("stroke-width", 1)
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
            d3.select(this).style("stroke", "#a078ff").style("stroke-width", 2);
            
            let hoverTooltip = d3.select("body").select(".minimal-heatmap-tooltip");
            if (hoverTooltip.empty()) {
                hoverTooltip = d3.select("body").append("div").attr("class", "minimal-heatmap-tooltip");
            }
            hoverTooltip.style("visibility", "visible")
                        .text(`${labelMapping[d.row] || d.row} × ${labelMapping[d.col] || d.col}: r = ${d.value.toFixed(2)}`);
        })
        .on("mousemove", function(event) {
            d3.select("body").select(".minimal-heatmap-tooltip")
                .style("top", (event.pageY + 12) + "px")
                .style("left", (event.pageX + 12) + "px");
        })
        .on("mouseleave", function() {
            d3.select(this).style("stroke", "rgba(160, 120, 255, 0.1)").style("stroke-width", 1);
            d3.select("body").select(".minimal-heatmap-tooltip").style("visibility", "hidden");
        });

    if (rows.length <= 8) {
        canvasSvg.selectAll()
            .data(rawData)
            .enter()
            .append("text")
            .attr("x", d => xRange(d.row) + xRange.bandwidth() / 2)
            .attr("y", d => yRange(d.col) + yRange.bandwidth() / 2)
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .style("font-size", "11px")
            .style("font-weight", "700")
            .style("fill", d => Math.abs(d.value) > 0.45 ? "#ffffff" : "#1a1032")
            .style("pointer-events", "none")
            .text(d => d.value.toFixed(2));
    }

    // Fixed Top overlapping properties
    canvasSvg.append("g")
        .call(d3.axisTop(xRange).tickFormat(d => labelMapping[d] || d))
        .attr("class", "axis-label")
        .selectAll("text")
        .style("text-anchor", "start")
        .attr("dx", "8px")
        .attr("dy", "-6px")
        .attr("transform", "rotate(-45)");

    canvasSvg.append("g")
        .call(d3.axisLeft(yRange).tickFormat(d => labelMapping[d] || d))
        .attr("class", "axis-label");

    // Recalculated positioning matrix baseline coordinates for the Vertical Legend
    const legendX = paddingOffset.left + matrixInnerWidth + 40;
    renderVerticalRightLegend(svgOuter, legendX, paddingOffset.top, matrixInnerHeight);
}

function renderVerticalRightLegend(svgContainer, xPosition, yPosition, legendHeight) {
    const legendWidth = 16;
    const legendGroup = svgContainer.append("g")
        .attr("transform", `translate(${xPosition}, ${yPosition})`);

    const defs = legendGroup.append("defs");
    const gradientId = "d3-vertical-diverging-gradient";
    
    const linearGradient = defs.append("linearGradient")
        .attr("id", gradientId)
        .attr("x1", "0%").attr("y1", "0%")
        .attr("x2", "0%").attr("y2", "100%");

    const sampleCount = 20;
    d3.range(sampleCount).forEach(i => {
        const pct = i / (sampleCount - 1);
        const val = 1.0 - (pct * 2.0); 
        linearGradient.append("stop")
            .attr("offset", `${pct * 100}%`)
            .attr("stop-color", colorMapper(val));
    });

    legendGroup.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", `url(#${gradientId})`)
        .style("stroke", "rgba(160, 120, 255, 0.3)")
        .style("stroke-width", "1px");

    const legendScale = d3.scaleLinear()
        .domain([1.0, -1.0]) 
        .range([0, legendHeight]);

    legendGroup.append("g")
        .attr("transform", `translate(${legendWidth}, 0)`)
        .attr("class", "legend-axis")
        .call(d3.axisRight(legendScale).ticks(5).tickFormat(d3.format(".1f")));

    legendGroup.append("text")
        .attr("transform", `translate(${legendWidth + 45}, ${legendHeight / 2})rotate(90)`)
        .attr("text-anchor", "middle")
        .attr("class", "legend-title")
        .text("Pearson Correlation Range (r Score)");
}

function getClusteredOrder(rawData, uniqueLabels) {
    const matrix = {};
    uniqueLabels.forEach(r => { matrix[r] = {}; });
    rawData.forEach(d => { if(matrix[d.row]) matrix[d.row][d.col] = d.value; });

    const labels = [...uniqueLabels];
    const clusters = labels.map(label => ({
        labels: [label],
        profile: labels.map(l => matrix[label][l] || 0)
    }));

    while (clusters.length > 1) {
        let minDistance = Infinity;
        let targetI = 0;
        let targetJ = 1;

        for (let i = 0; i < clusters.length; i++) {
            for (let j = i + 1; j < clusters.length; j++) {
                let dist = 0;
                for (let k = 0; k < clusters[i].profile.length; k++) {
                    dist += Math.pow(clusters[i].profile[k] - clusters[j].profile[k], 2);
                }
                if (dist < minDistance) {
                    minDistance = dist;
                    targetI = i;
                    targetJ = j;
                }
            }
        }

        const c1 = clusters[targetI];
        const c2 = clusters[targetJ];
        const mergedLabels = c1.labels.concat(c2.labels);
        const mergedProfile = c1.profile.map((val, idx) => (val + c2.profile[idx]) / 2);

        clusters.splice(targetJ, 1);
        clusters[targetI] = { labels: mergedLabels, profile: mergedProfile };
    }
    return clusters[0].labels;
}

function initFactorBarChart() {
    const canvasContainer = d3.select("#barchart-render-target");
    if (canvasContainer.empty()) return;
    canvasContainer.html("");

    const layoutMargins = { top: 10, right: 30, bottom: 50, left: 160 };
    const axisWidth = 560 - layoutMargins.left - layoutMargins.right;
    const axisHeight = 420 - layoutMargins.top - layoutMargins.bottom;

    const baseSvg = canvasContainer.append("svg")
        .attr("width", "100%")
        .attr("height", axisHeight + layoutMargins.top + layoutMargins.bottom)
        .attr("viewBox", `0 0 ${axisWidth + layoutMargins.left + layoutMargins.right} ${axisHeight + layoutMargins.top + layoutMargins.bottom}`)
        .append("g")
        .attr("transform", `translate(${layoutMargins.left}, ${layoutMargins.top})`);

    const sortedFactors = [...topFactors].sort((a, b) => d3.descending(Math.abs(a.correlation), Math.abs(b.correlation)));
    const yScaleConfig = d3.scaleBand().range([0, axisHeight]).domain(sortedFactors.map(d => d.factor)).padding(0.24);
    const xScaleConfig = d3.scaleLinear().range([0, axisWidth]).domain([-1.0, 1.0]);

    baseSvg.selectAll(".factor-link-line")
        .data(sortedFactors)
        .enter()
        .append("line")
        .attr("y1", d => yScaleConfig(d.factor) + yScaleConfig.bandwidth() / 2)
        .attr("y2", d => yScaleConfig(d.factor) + yScaleConfig.bandwidth() / 2)
        .attr("x1", xScaleConfig(0))
        .attr("x2", d => xScaleConfig(d.correlation))
        .style("stroke", "rgba(160, 120, 255, 0.2)")
        .style("stroke-width", "2px");

    baseSvg.selectAll(".factor-bar")
        .data(sortedFactors)
        .enter()
        .append("rect")
        .attr("class", "factor-bar")
        .attr("y", d => yScaleConfig(d.factor))
        .attr("x", d => d.correlation < 0 ? xScaleConfig(d.correlation) : xScaleConfig(0))
        .attr("width", d => Math.abs(xScaleConfig(d.correlation) - xScaleConfig(0)))
        .attr("height", yScaleConfig.bandwidth())
        .style("fill", d => d.type === "Positive" ? "#10b981" : "#f43f5e")
        .style("cursor", "pointer")
        .style("opacity", 0.85)
        .attr("rx", 4)
        .on("click", function(event, d) {
            baseSvg.selectAll(".factor-bar").style("opacity", 0.45).style("stroke", "none");
            d3.select(this).style("opacity", 1.0).style("stroke", "#a078ff").style("stroke-width", "1.5px");
            renderCascadeNarrative(d);
        });

    baseSvg.append("line")
        .attr("x1", xScaleConfig(0))
        .attr("x2", xScaleConfig(0))
        .attr("y1", 0)
        .attr("y2", axisHeight)
        .style("stroke", "#7b6b99")
        .style("stroke-width", "1.5px")
        .style("stroke-dasharray", "2,2");

    baseSvg.append("g")
        .attr("transform", `translate(0, ${axisHeight})`)
        .call(d3.axisBottom(xScaleConfig).ticks(6))
        .selectAll("text")
        .style("fill", "#cbd5e1");

    baseSvg.append("g")
        .call(d3.axisLeft(yScaleConfig).tickSize(0))
        .attr("transform", "translate(-6, 0)")
        .selectAll("text")
        .style("fill", "#cbd5e1");
}

function renderCascadeNarrative(selectedFactor) {
    const descriptionTarget = d3.select("#factor-narrative-target");
    descriptionTarget.html(""); 

    descriptionTarget.append("div").attr("class", "active-factor-title").text(selectedFactor.factor);
    descriptionTarget.append("span")
        .attr("class", `active-factor-badge ${selectedFactor.type.toLowerCase()}`)
        .text(`${selectedFactor.type} Association | Coefficient r = ${selectedFactor.correlation.toFixed(3)}`);

    descriptionTarget.append("p")
        .style("font-size", "0.925rem")
        .style("color", "#cbd5e1")
        .html(`<strong>Data Context:</strong> Extracted within the <em>${selectedFactor.dataset}</em> repository.<br><br><strong>Impact on Sleep:</strong> ${selectedFactor.impact}`);
}