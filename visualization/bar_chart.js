document.addEventListener("DOMContentLoaded", () => {
    
    // Set up dimensions and margins for the entire SVG
    const width = 800;
    const height = 600;
    const margin = {top: 40, right: 30, bottom: 60, left: 50};
    
    // Create the main SVG container
    const svg = d3.select("#d3-container")
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("width", "100%")
      .style("height", "100%");
      
    // Load the dataset from data.js
    const data = d3.csvParse(rawCsvData);
    
    // Clean and prepare the data
        data.forEach(d => {
            d.Sleep_Duration = +d.Sleep_Duration;
        });

        // Define the order of years and map them to colors
        const yearOrder = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
        const colorScale = d3.scaleOrdinal()
            .domain(yearOrder)
            .range(["var(--color-1)", "var(--color-2)", "var(--color-3)", "var(--color-4)"]);

        // Create a grid layout (2x2)
        const cols = 2;
        const rows = 2;
        
        // Calculate dimensions for each subplot
        const subWidth = (width - margin.left - margin.right) / cols;
        const subHeight = (height - margin.top - margin.bottom) / rows;
        
        // Define common X scale (hours of sleep)
        const xDomain = d3.extent(data, d => d.Sleep_Duration);
        const x = d3.scaleLinear()
            .domain([3, 11]) // Give a bit of padding around min/max which is roughly 4-9
            .range([0, subWidth - 30]); // padding between subplots

        // Histogram generator (15 bins)
        const histogram = d3.bin()
            .value(d => d.Sleep_Duration)
            .domain(x.domain())
            .thresholds(x.ticks(15));
            
        // Group data by year
        const dataByYear = d3.group(data, d => d.University_Year);
        
        // Determine the maximum Y value across all groups for consistent Y scale
        let yMax = 0;
        const binsByYear = {};
        
        yearOrder.forEach(year => {
            if (dataByYear.has(year)) {
                const yearData = dataByYear.get(year);
                const bins = histogram(yearData);
                binsByYear[year] = bins;
                yMax = Math.max(yMax, d3.max(bins, d => d.length));
            }
        });

        const y = d3.scaleLinear()
            .domain([0, yMax])
            .range([subHeight - 40, 0]);

        // Iterate and draw each subplot
        yearOrder.forEach((year, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            
            // Calculate translation for this subplot
            const xOffset = margin.left + (col * subWidth) + (col * 15);
            const yOffset = margin.top + (row * subHeight) + (row * 20);
            
            const g = svg.append("g")
                .attr("transform", `translate(${xOffset},${yOffset})`);
                
            // Draw axes
            const xAxis = d3.axisBottom(x).ticks(5);
            g.append("g")
                .attr("transform", `translate(0,${subHeight - 40})`)
                .call(xAxis)
                .selectAll("path, line")
                .attr("class", "domain");

            // Only add Y axis to left-most plots
            if (col === 0) {
                const yAxis = d3.axisLeft(y).ticks(5);
                g.append("g")
                    .call(yAxis)
                    .selectAll("path, line")
                    .attr("class", "domain");
                
                // Y-axis label
                g.append("text")
                    .attr("class", "axis-label")
                    .attr("transform", "rotate(-90)")
                    .attr("y", -35)
                    .attr("x", -(subHeight - 40) / 2)
                    .attr("text-anchor", "middle")
                    .text("Number of Students");
            }

            // X-axis label (only on bottom row)
            if (row === 1) {
                g.append("text")
                    .attr("class", "axis-label")
                    .attr("x", (subWidth - 30) / 2)
                    .attr("y", subHeight)
                    .attr("text-anchor", "middle")
                    .text("Hours of Sleep");
            }

            // Subplot Title
            g.append("text")
                .attr("class", "subplot-title")
                .attr("x", (subWidth - 30) / 2)
                .attr("y", -10)
                .attr("text-anchor", "middle")
                .text(year);

            // Draw bars
            if (binsByYear[year]) {
                const bins = binsByYear[year];
                g.selectAll("rect")
                    .data(bins)
                    .enter()
                    .append("rect")
                    .attr("class", "bar")
                    .attr("x", 1)
                    .attr("transform", d => `translate(${x(d.x0)},${y(d.length)})`)
                    .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
                    .attr("height", d => subHeight - 40 - y(d.length))
                    .style("fill", colorScale(year));
            }
            
            // Add 7h Reference Line
            g.append("line")
                .attr("class", "reference-line")
                .attr("x1", x(7))
                .attr("x2", x(7))
                .attr("y1", 0)
                .attr("y2", subHeight - 40);
                
            // Add <7h Annotation
            if (dataByYear.has(year)) {
                const yearData = dataByYear.get(year);
                const below7 = yearData.filter(d => d.Sleep_Duration < 7).length;
                const total = yearData.length;
                const pct = ((below7 / total) * 100).toFixed(1);
                
                g.append("text")
                    .attr("class", "annotation-text")
                    .attr("x", x(6.8))
                    .attr("y", 10)
                    .attr("text-anchor", "end")
                    .text(`${pct}% < 7h`);
            }
        });
});
