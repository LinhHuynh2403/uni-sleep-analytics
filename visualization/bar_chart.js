document.addEventListener("DOMContentLoaded", () => {
    
    // Set up dimensions and margins for the single central SVG
    const width = 800;
    const height = 720;  // taller to give summary grid more room
    const margin = {top: 60, right: 40, bottom: 80, left: 70};
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Create the main SVG container
    const svg = d3.select("#bc-d3-container")
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("width", "100%")
      .style("height", "100%");
      
    const singleChartGroup = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
      
    // Create summary layer
    const summaryChartGroup = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)
      .style("opacity", 0)
      .style("pointer-events", "none"); // Hidden by default
      
    // Load the dataset from data.js
    const data = d3.csvParse(rawCsvData);
    
    // Clean and prepare the data
    data.forEach(d => {
        d.Sleep_Duration = +d.Sleep_Duration;
    });

    // Define color scale based on steps
    const colorScale = {
        "intro": "#94a3b8", // Neutral slate for all students
        "1st Year": "var(--color-1)",
        "2nd Year": "var(--color-2)",
        "3rd Year": "var(--color-3)",
        "4th Year": "var(--color-4)"
    };
    
    // Group data by year for easy access (Supports both D3 v5 and v7)
    let dataByYear;
    if (d3.nest) {
        const dataByYearMap = d3.nest()
            .key(d => d.University_Year)
            .entries(data);
        dataByYear = new Map(dataByYearMap.map(d => [d.key, d.values]));
    } else {
        dataByYear = d3.group(data, d => d.University_Year);
    }
    
    // Add an "intro" group that contains all data
    dataByYear.set("intro", data);

    // Define X scale (hours of sleep)
    const x = d3.scaleLinear()
        .domain([3, 11])
        .range([0, innerWidth]);

    // Histogram generator (D3 v5 compatible using d3.histogram)
    const histogram = (d3.histogram || d3.bin)()
        .value(d => d.Sleep_Duration)
        .domain(x.domain())
        .thresholds(x.ticks(15));
        
    // Pre-calculate bins for all steps to find the global max Y
    const binsByStep = {};
    let yMax = 0;
    
    ["intro", "1st Year", "2nd Year", "3rd Year", "4th Year"].forEach(step => {
        const stepData = dataByYear.get(step) || [];
        const bins = histogram(stepData);
        binsByStep[step] = bins;
        yMax = Math.max(yMax, d3.max(bins, d => d.length));
    });

    // Define Y scale
    const y = d3.scaleLinear()
        .domain([0, yMax])
        .range([innerHeight, 0]);

    // ======== SINGLE CHART SETUP ========
    const xAxis = d3.axisBottom(x).ticks(8);
    singleChartGroup.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(xAxis)
        .selectAll("path, line")
        .attr("class", "domain");

    const yAxis = d3.axisLeft(y).ticks(6);
    singleChartGroup.append("g")
        .attr("class", "y-axis")
        .call(yAxis)
        .selectAll("path, line")
        .attr("class", "domain");

    // Axis Labels
    singleChartGroup.append("text")
        .attr("class", "axis-label")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + 50)
        .attr("text-anchor", "middle")
        .text("Hours of Sleep");

    singleChartGroup.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", -50)
        .attr("x", -innerHeight / 2)
        .attr("text-anchor", "middle")
        .text("Number of Students");
        
    // Dynamic Chart Title
    const chartTitle = singleChartGroup.append("text")
        .attr("class", "chart-title")
        .attr("x", innerWidth / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .text("All University Students");

    // 7h Reference Line (Static)
    singleChartGroup.append("line")
        .attr("class", "reference-line")
        .attr("x1", x(7))
        .attr("x2", x(7))
        .attr("y1", 0)
        .attr("y2", innerHeight);
        
    // Dynamic <7h Annotation
    const annotationText = singleChartGroup.append("text")
        .attr("class", "annotation-text")
        .attr("x", x(6.8))
        .attr("y", 20)
        .attr("text-anchor", "end");

    // ======== SUMMARY CHART GRID SETUP ========
    // 2x2 layout — give each cell generous padding so labels fit
    const gridCols = 2;
    const gridRows = 2;
    // Per-cell margins (inside each small chart)
    const cellPad = { top: 30, right: 10, bottom: 52, left: 52 };
    const totalCellWidth  = innerWidth  / gridCols;
    const totalCellHeight = innerHeight / gridRows;
    const innerCellWidth  = totalCellWidth  - cellPad.left - cellPad.right;
    const innerCellHeight = totalCellHeight - cellPad.top  - cellPad.bottom;

    // Small scales
    const smallX = d3.scaleLinear()
        .domain([3, 11])
        .range([0, innerCellWidth]);
    
    // We can use the same global yMax for fair comparison across all 4 years
    const smallY = d3.scaleLinear()
        .domain([0, yMax])
        .range([innerCellHeight, 0]);

    const smallXAxis = d3.axisBottom(smallX).ticks(5);
    const smallYAxis = d3.axisLeft(smallY).ticks(4);

    const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
    
    // Pre-draw the 4 small charts
    years.forEach((year, i) => {
        const row = Math.floor(i / gridCols);
        const col = i % gridCols;
        
        // Offset by each cell's left/top padding
        const g = summaryChartGroup.append("g")
            .attr("transform", `translate(${col * totalCellWidth + cellPad.left}, ${row * totalCellHeight + cellPad.top})`);
            
        // X Axis
        g.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${innerCellHeight})`)
            .call(smallXAxis)
            .selectAll("path, line")
            .attr("class", "domain");

        // X Axis Label
        g.append("text")
            .attr("x", innerCellWidth / 2)
            .attr("y", innerCellHeight + 40)
            .attr("text-anchor", "middle")
            .style("fill", "#94a3b8")
            .style("font-size", "12px")
            .style("font-weight", "600")
            .text("Hours of Sleep");
            
        // Y Axis
        g.append("g")
            .attr("class", "y-axis")
            .call(smallYAxis)
            .selectAll("path, line")
            .attr("class", "domain");

        // Y Axis Label
        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -innerCellHeight / 2)
            .attr("y", -40)
            .attr("text-anchor", "middle")
            .style("fill", "#94a3b8")
            .style("font-size", "12px")
            .style("font-weight", "600")
            .text("# Students");
            
        // Title
        g.append("text")
            .attr("x", innerCellWidth / 2)
            .attr("y", -12)
            .attr("text-anchor", "middle")
            .style("fill", "#f8fafc")
            .style("font-size", "15px")
            .style("font-weight", "bold")
            .text(year);
            
        // Reference Line
        g.append("line")
            .attr("class", "reference-line")
            .attr("x1", smallX(7))
            .attr("x2", smallX(7))
            .attr("y1", 0)
            .attr("y2", innerCellHeight);
            
        // Draw bars
        const bins = binsByStep[year];
        const smallBars = g.selectAll(".bar")
            .data(bins)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => smallX(d.x0) + 1)
            .attr("width", d => Math.max(0, smallX(d.x1) - smallX(d.x0) - 1))
            .attr("y", d => smallY(d.length))
            .attr("height", d => innerCellHeight - smallY(d.length))
            .style("fill", colorScale[year]);
            
        // Add hover to small charts too
        smallBars.on("mouseover", function(a, b) {
            const e = b !== undefined ? a : d3.event;
            const d = b !== undefined ? b : a;
            
            tooltip.style("opacity", 1)
                .html(`<strong>${year}</strong><br/><strong>${d.x0} - ${d.x1} Hours</strong><br/><span style="color:var(--accent-color)">${d.length} Students</span>`);
                
            d3.select(this).style("filter", "brightness(1.3)");
        })
        .on("mousemove", function(a, b) {
            const e = b !== undefined ? a : d3.event;
            tooltip.style("left", (e.clientX + 15) + "px")
                   .style("top", (e.clientY - 30) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("opacity", 0);
            d3.select(this).style("filter", "none");
        });
    });

    // Create Tooltip (shared by both layers)
    let tooltip = d3.select("#bc-tooltip");
    if (tooltip.empty()) {
        tooltip = d3.select("body").append("div")
            .attr("id", "bc-tooltip")
            .style("position", "fixed")
            .style("background", "rgba(20, 25, 35, 0.95)")
            .style("border", "1px solid rgba(255, 255, 255, 0.1)")
            .style("border-radius", "8px")
            .style("padding", "10px 15px")
            .style("color", "#f8fafc")
            .style("font-family", "sans-serif")
            .style("font-size", "14px")
            .style("pointer-events", "none")
            .style("opacity", 0)
            .style("z-index", 9999)
            .style("box-shadow", "0 10px 25px rgba(0,0,0,0.5)")
            .style("transition", "opacity 0.1s ease");
    }

    // Bar drawing logic (for single chart)
    function updateChart(stepName) {
        // Handle layer switching
        if (stepName === "summary") {
            singleChartGroup.transition().duration(400).style("opacity", 0).style("pointer-events", "none");
            summaryChartGroup.transition().delay(400).duration(400).style("opacity", 1).style("pointer-events", "all");
            return;
        } else {
            summaryChartGroup.transition().duration(200).style("opacity", 0).style("pointer-events", "none");
            singleChartGroup.transition().delay(200).duration(400).style("opacity", 1).style("pointer-events", "all");
        }

        if (!binsByStep[stepName]) return;
        
        const bins = binsByStep[stepName];
        const stepData = dataByYear.get(stepName);
        
        // Update Title
        const titleText = stepName === "intro" ? "All University Students" : stepName;
        chartTitle.text(titleText);
        
        // Update Annotation
        const below7 = stepData.filter(d => d.Sleep_Duration < 7).length;
        const total = stepData.length;
        const pct = ((below7 / total) * 100).toFixed(1);
        annotationText.text(`${pct}% < 7h`)
            .style("fill", stepName === "intro" ? "var(--accent-color)" : colorScale[stepName]);
            
        // Data join
        const bars = singleChartGroup.selectAll(".bar")
            .data(bins);
            
        // Enter + Update
        const barsEnter = bars.enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.x0) + 1)
            .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
            .attr("y", innerHeight) // Start from bottom
            .attr("height", 0)
            .style("fill", colorScale[stepName]);
            
        const barsMerge = barsEnter.merge(bars);
        
        // Setup Hover Effects (Compatible with both D3 v5 and v7)
        barsMerge.on("mouseover", function(a, b) {
            const e = b !== undefined ? a : d3.event; // Event
            const d = b !== undefined ? b : a;        // Data
            
            tooltip.style("opacity", 1)
                .html(`<strong>${d.x0} - ${d.x1} Hours</strong><br/><span style="color:var(--accent-color)">${d.length} Students</span>`);
                
            d3.select(this).style("filter", "brightness(1.3)");
        })
        .on("mousemove", function(a, b) {
            const e = b !== undefined ? a : d3.event;
            tooltip.style("left", (e.clientX + 15) + "px")
                   .style("top", (e.clientY - 30) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("opacity", 0);
            d3.select(this).style("filter", "none");
        });

        // Transition animation
        barsMerge.transition()
            .duration(800)
            .ease(d3.easeCubicOut)
            .attr("x", d => x(d.x0) + 1)
            .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
            .attr("y", d => y(d.length))
            .attr("height", d => innerHeight - y(d.length))
            .style("fill", colorScale[stepName]);
            
        // Exit
        bars.exit()
            .transition()
            .duration(800)
            .attr("y", innerHeight)
            .attr("height", 0)
            .remove();
    }

    // Initialize with "intro"
    updateChart("intro");

    // Scroll Interactivity via IntersectionObserver
    const steps = document.querySelectorAll(".bc-step");
    
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Remove active class from all
                steps.forEach(s => s.classList.remove("active"));
                
                // Add active class to current
                const stepElement = entry.target;
                stepElement.classList.add("active");
                
                // Update chart
                const stepName = stepElement.getAttribute("data-step");
                updateChart(stepName);
            }
        });
    }, {
        root: null,
        rootMargin: "-45% 0px -45% 0px", // Trigger when element is near the vertical center
        threshold: 0
    });
    
    steps.forEach(step => observer.observe(step));
});
