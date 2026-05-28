// Label dictionary mapping code headers to human-readable text
const labelMapping = {
    // Dataset 1
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

    // Dataset 2
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

    // Dataset 3
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

    // Dataset 4
    "Difficulty_Falling_Staying_Asleep": "Difficulty Falling/Staying Asleep",
    "Daytime_Naps": "Daytime Naps Frequency",
    "Lights_On_During_Sleep": "Lights On During Sleep",
    "Exercise_Regularity": "Exercise Regularity",
    "Bedtime_Act_Electronics": "Pre-Bed: Electronics",
    "Bedtime_Act_TV_Movies": "Pre-Bed: TV/Movies",
    "Bedtime_Act_Reading": "Pre-Bed: Reading",

    // Dataset 5
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

// Filtered Top 10 factors that directly target and affect sleep metrics across datasets
const topFactors = [
    { factor: "Daily Screen Time", correlation: -0.9986, type: "Negative", dataset: "Dataset 5 (Mental Health)", impact: "High screen runtime triggers high cognitive alertness and blocks endogenous melatonin secretion, directly reducing continuous overnight rest windows." },
    { factor: "Physical Activity Duration", correlation: 0.9981, type: "Positive", dataset: "Dataset 5 (Mental Health)", impact: "Regular physical movement acts as an immediate biological catalyst for deep slow-wave sleep cycles, substantially scaling overnight architecture stability." },
    { factor: "Psychological Stress Index", correlation: -0.8345, type: "Negative", dataset: "Dataset 5 (Mental Health)", impact: "Elevated mental workloads provoke sympathetic nervous system over-arousal, causing severe bedtime latency and shorter total rest windows." },
    { factor: "Social Media Scroll Time", correlation: -0.6798, type: "Negative", dataset: "Dataset 5 (Mental Health)", impact: "Prolonged screen stimulation before bedtime shortens available sleep duration, inducing chronic daytime fatigue." },
    { factor: "Anxiety Trait Levels", correlation: -0.6278, type: "Negative", dataset: "Dataset 5 (Mental Health)", impact: "Intrusive pre-sleep thoughts and worry induce chronic nocturnal waking cycles, severely fragmenting sleep architecture metrics." },
    { factor: "Subjective Sleep Difficulty", correlation: -0.5401, type: "Negative", dataset: "Dataset 4 (Bedtime Routine)", impact: "Frequent struggles to fall or stay asleep create a state of pre-bed anxiety, directly decreasing subjective sleep quality scores." },
    { factor: "Delayed Sleep Midpoint", correlation: -0.3471, type: "Negative", dataset: "Dataset 2 (CMU Wearables)", impact: "Wearable sensor logs reveal that a significantly delayed sleep midpoint (sleeping very late) cuts off critical deep restorative sleep phases." },
    { factor: "Daytime Napping Duration", correlation: -0.2852, type: "Negative", dataset: "Dataset 2 (CMU Wearables)", impact: "Unstructured or prolonged mid-day naps diminish baseline homeostatic sleep drive, resulting in fragile, fragmented overnight sleep." },
    { factor: "Pre-Bed Device Electronic Use", correlation: -0.2910, type: "Negative", dataset: "Dataset 4 (Bedtime Routine)", impact: "Interfacing with tablet or phone displays immediately prior to closing eyes degrades qualitative rest depth and metrics values." },
    { factor: "Nocturnal Waking Trouble", correlation: -0.3692, type: "Negative", dataset: "Dataset 1 (Student Insomnia)", impact: "Frequent midnight awakenings interrupt memory consolidation pathways, causing high morning fatigue scores." }
];

// Define a uniform D3 Diverging Color Scale (-1 is Deep Blue, 0 is light yellow, +1 is Deep Red)
const colorMapper = d3.scaleSequential()
    .interpolator(d3.interpolateRdYlBu)
    .domain([1, -1]); // Reversed domain maps positive values to warm red tones

document.addEventListener("DOMContentLoaded", () => {
    // Render initial visualizations
    initMatrixRenderer("dataset2");
    initFactorBarChart();

    // Bind dropdown controller to rebuild matrix landscapes dynamically
    document.getElementById("dataset-dropdown").addEventListener("change", (e) => {
        initMatrixRenderer(e.target.value);
    });
});

/**
 * Builds the Dynamic Pearson Matrix Heatmap
 */
function initMatrixRenderer(datasetKey) {
    const rawData = correlationData[datasetKey];
    const viewContainer = d3.select("#heatmap-render-target");
    viewContainer.html(""); // Clean canvas space

    // Extract unique labels to define standard axis tick lengths
    const rows = Array.from(new Set(rawData.map(d => d.row)));
    const cols = Array.from(new Set(rawData.map(d => d.col)));

    // Sizing Matrix Metrics
    const paddingOffset = { top: 20, right: 20, bottom: 120, left: 160 };
    const chartWidth = Math.max(480, rows.length * 40) + paddingOffset.left + paddingOffset.right;
    const chartHeight = Math.max(480, cols.length * 40) + paddingOffset.top + paddingOffset.bottom;

    const canvasSvg = viewContainer.append("svg")
        .attr("width", "100%")
        .attr("height", chartHeight)
        .attr("viewBox", `0 0 ${chartWidth} ${chartHeight}`)
        .append("g")
        .attr("transform", `translate(${paddingOffset.left}, ${paddingOffset.top})`);

    // Coordinate Mappings Scales
    const xRange = d3.scaleBand().range([0, chartWidth - paddingOffset.left - paddingOffset.right]).domain(rows).padding(0.04);
    const yRange = d3.scaleBand().range([0, chartHeight - paddingOffset.top - paddingOffset.bottom]).domain(cols).padding(0.04);

    // Draw Heatmap Cells
    canvasSvg.selectAll()
        .data(rawData)
        .enter()
        .append("rect")
        .attr("x", d => xRange(d.row))
        .attr("y", d => yRange(d.col))
        .attr("width", xRange.bandwidth())
        .attr("height", yRange.bandwidth())
        .style("fill", d => colorMapper(d.value))
        .style("stroke", "#ffffff")
        .style("stroke-width", 1)
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
            d3.select(this).style("stroke", "#0f172a").style("stroke-width", 2);
            
            // Lazy-create floating tooltip if it doesn't exist
            let hoverTooltip = d3.select("body").select(".minimal-heatmap-tooltip");
            if (hoverTooltip.empty()) {
                hoverTooltip = d3.select("body").append("div")
                    .attr("class", "minimal-heatmap-tooltip")
                    .style("position", "absolute")
                    .style("background-color", "rgba(15, 23, 42, 0.95)")
                    .style("color", "#ffffff")
                    .style("padding", "4px 8px")
                    .style("border-radius", "4px")
                    .style("font-size", "12px")
                    .style("font-weight", "600")
                    .style("pointer-events", "none")
                    .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)")
                    .style("z-index", "10000");
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
            d3.select(this).style("stroke", "#ffffff").style("stroke-width", 1);
            d3.select("body").select(".minimal-heatmap-tooltip").style("visibility", "hidden");
        });

    // If the dataset contains few variables, embed textual value labels inside the tiles
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
            .style("fill", d => Math.abs(d.value) > 0.45 ? "#ffffff" : "#0f172a")
            .style("pointer-events", "none")
            .text(d => d.value.toFixed(2));
    }

    // Append X-Axis Labels
    canvasSvg.append("g")
        .attr("transform", `translate(0, ${chartHeight - paddingOffset.top - paddingOffset.bottom})`)
        .call(d3.axisBottom(xRange).tickFormat(d => labelMapping[d] || d))
        .attr("class", "axis-label")
        .selectAll("text")
        .attr("transform", "translate(-10, 8)rotate(-42)")
        .style("text-anchor", "end");

    // Append Y-Axis Labels
    canvasSvg.append("g")
        .call(d3.axisLeft(yRange).tickFormat(d => labelMapping[d] || d))
        .attr("class", "axis-label");

    // Render the matching SVG legend right beneath this matrix layout instance
    renderDivergingLegend(chartWidth - paddingOffset.left - paddingOffset.right);
}

/**
 * Dynamically builds a continuous SVG gradient legend bound exactly to the D3 Diverging scale
 */
function renderDivergingLegend(matrixRenderWidth) {
    const legendContainer = d3.select("#matrix-legend-target");
    legendContainer.html(""); // Reset previous legend instances

    const legendMargin = { top: 10, right: 20, bottom: 30, left: 20 };
    const legendWidth = Math.min(500, matrixRenderWidth);
    const legendHeight = 60;

    const svg = legendContainer.append("svg")
        .attr("width", legendWidth + legendMargin.left + legendMargin.right)
        .attr("height", legendHeight)
        .append("g")
        .attr("transform", `translate(${legendMargin.left}, ${legendMargin.top})`);

    const defs = svg.append("defs");
    const gradientId = "d3-diverging-gradient";
    
    const linearGradient = defs.append("linearGradient")
        .attr("id", gradientId)
        .attr("x1", "0%").attr("y1", "0%")
        .attr("x2", "100%").attr("y2", "0%");

    // Sample 20 calculation points uniformly across the D3 interpolator function
    const sampleCount = 20;
    d3.range(sampleCount).forEach(i => {
        const pct = i / (sampleCount - 1);
        const val = -1.0 + (pct * 2.0); // Map percentage index to domain [-1.0, 1.0]
        linearGradient.append("stop")
            .attr("offset", `${pct * 100}%`)
            .attr("stop-color", colorMapper(val));
    });

    // Draw Legend Color Bar
    const barHeight = 14;
    svg.append("rect")
        .attr("width", legendWidth)
        .attr("height", barHeight)
        .style("fill", `url(#${gradientId})`)
        .style("stroke", "#cbd5e1")
        .style("stroke-width", "1px");

    // Create Legend Scale Tick Axis
    const legendScale = d3.scaleLinear()
        .domain([-1.0, 1.0])
        .range([0, legendWidth]);

    svg.append("g")
        .attr("transform", `translate(0, ${barHeight})`)
        .attr("class", "legend-axis")
        .call(d3.axisBottom(legendScale).ticks(5).tickFormat(d3.format(".1f")));

    // Axis Title
    svg.append("text")
        .attr("x", legendWidth / 2)
        .attr("y", barHeight + 34)
        .attr("text-anchor", "middle")
        .attr("class", "legend-title")
        .text("Pearson Correlation Matrix Range (r Score)");
}

function triggerCellInspection(cellData) {}

/**
 * Generates Horizontal Bar Chart mapping Top 10 Sleep Drivers
 */
function initFactorBarChart() {
    const canvasContainer = d3.select("#barchart-render-target");
    const layoutMargins = { top: 10, right: 30, bottom: 50, left: 160 };
    const axisWidth = 560 - layoutMargins.left - layoutMargins.right;
    const axisHeight = 420 - layoutMargins.top - layoutMargins.bottom;

    const baseSvg = canvasContainer.append("svg")
        .attr("width", "100%")
        .attr("height", axisHeight + layoutMargins.top + layoutMargins.bottom)
        .attr("viewBox", `0 0 ${axisWidth + layoutMargins.left + layoutMargins.right} ${axisHeight + layoutMargins.top + layoutMargins.bottom}`)
        .append("g")
        .attr("transform", `translate(${layoutMargins.left}, ${layoutMargins.top})`);

    // Ensure factor records are cleanly sorted by absolute correlation magnitude
    const sortedFactors = [...topFactors].sort((a, b) => d3.descending(Math.abs(a.correlation), Math.abs(b.correlation)));

    const yScaleConfig = d3.scaleBand().range([0, axisHeight]).domain(sortedFactors.map(d => d.factor)).padding(0.24);
    const xScaleConfig = d3.scaleLinear().range([0, axisWidth]).domain([-1.0, 1.0]);

    // Draw Connector Lines
    baseSvg.selectAll(".factor-link-line")
        .data(sortedFactors)
        .enter()
        .append("line")
        .attr("y1", d => yScaleConfig(d.factor) + yScaleConfig.bandwidth() / 2)
        .attr("y2", d => yScaleConfig(d.factor) + yScaleConfig.bandwidth() / 2)
        .attr("x1", xScaleConfig(0))
        .attr("x2", d => xScaleConfig(d.correlation))
        .style("stroke", "#cbd5e1")
        .style("stroke-width", "2px");

    // Draw Structural Value Bars
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
            d3.select(this).style("opacity", 1.0).style("stroke", "#0f172a").style("stroke-width", "1.5px");
            renderCascadeNarrative(d);
        });

    baseSvg.append("line")
        .attr("x1", xScaleConfig(0))
        .attr("x2", xScaleConfig(0))
        .attr("y1", 0)
        .attr("y2", axisHeight)
        .style("stroke", "#475569")
        .style("stroke-width", "1.5px")
        .style("stroke-dasharray", "2,2");

    baseSvg.append("g")
        .attr("transform", `translate(0, ${axisHeight})`)
        .call(d3.axisBottom(xScaleConfig).ticks(6))
        .style("font-weight", "700")
        .append("text")
        .attr("x", axisWidth / 2)
        .attr("y", 38)
        .attr("fill", "#64748b")
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .text("Pearson r Correlation Coefficient");

    baseSvg.append("g")
        .call(d3.axisLeft(yScaleConfig).tickSize(0))
        .style("font-weight", "700")
        .attr("transform", "translate(-6, 0)");
}

/**
 * Handles Bottom Content Injection on Bar Click Selection
 */
function renderCascadeNarrative(selectedFactor) {
    const descriptionTarget = d3.select("#factor-narrative-target");
    descriptionTarget.html(""); 

    descriptionTarget.append("div").attr("class", "active-factor-title").text(selectedFactor.factor);
    
    descriptionTarget.append("span")
        .attr("class", `active-factor-badge ${selectedFactor.type.toLowerCase()}`)
        .text(`${selectedFactor.type} Association | Coefficient r = ${selectedFactor.correlation.toFixed(3)}`);

    descriptionTarget.append("p")
        .style("font-size", "0.925rem")
        .style("color", "#334155")
        .html(`<strong>Data Context:</strong> Extracted via cross-examination within the <em>${selectedFactor.dataset}</em> repository.<br><br><strong>Direct Impact on Sleep:</strong> ${selectedFactor.impact}`);
}