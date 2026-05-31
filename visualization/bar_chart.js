document.addEventListener("DOMContentLoaded", () => {
    
    // Set up dimensions and margins for the single central SVG
    const width = 800;
    const height = 650;
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
      
    const chartGroup = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
      
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
    
    // Group data by year for easy access (D3 v5 compatible using d3.nest)
    const dataByYearMap = d3.nest()
        .key(d => d.University_Year)
        .entries(data);
        
    // Convert to a map for easier lookup
    const dataByYear = new Map(dataByYearMap.map(d => [d.key, d.values]));
    
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

    // Draw Axes
    const xAxis = d3.axisBottom(x).ticks(8);
    chartGroup.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(xAxis)
        .selectAll("path, line")
        .attr("class", "domain");

    const yAxis = d3.axisLeft(y).ticks(6);
    chartGroup.append("g")
        .attr("class", "y-axis")
        .call(yAxis)
        .selectAll("path, line")
        .attr("class", "domain");

    // Axis Labels
    chartGroup.append("text")
        .attr("class", "axis-label")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + 50)
        .attr("text-anchor", "middle")
        .text("Hours of Sleep");

    chartGroup.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", -50)
        .attr("x", -innerHeight / 2)
        .attr("text-anchor", "middle")
        .text("Number of Students");
        
    // Dynamic Chart Title
    const chartTitle = chartGroup.append("text")
        .attr("class", "chart-title")
        .attr("x", innerWidth / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .text("All University Students");

    // 7h Reference Line (Static)
    chartGroup.append("line")
        .attr("class", "reference-line")
        .attr("x1", x(7))
        .attr("x2", x(7))
        .attr("y1", 0)
        .attr("y2", innerHeight);
        
    // Dynamic <7h Annotation
    const annotationText = chartGroup.append("text")
        .attr("class", "annotation-text")
        .attr("x", x(6.8))
        .attr("y", 20)
        .attr("text-anchor", "end");

    // Bar drawing logic
    function updateChart(stepName) {
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
        const bars = chartGroup.selectAll(".bar")
            .data(bins);
            
        // Enter + Update
        bars.enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.x0) + 1)
            .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
            .attr("y", innerHeight) // Start from bottom
            .attr("height", 0)
            .merge(bars)
            .transition()
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
