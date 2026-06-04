document.addEventListener("DOMContentLoaded", () => {
    
    // =============================================
    // SHARED DATA SETUP
    // =============================================
    const data = d3.csvParse(rawCsvData);
    data.forEach(d => { d.Sleep_Duration = +d.Sleep_Duration; });

    const colorScale = {
        "intro":    "#94a3b8",
        "1st Year": "var(--color-1)",
        "2nd Year": "var(--color-2)",
        "3rd Year": "var(--color-3)",
        "4th Year": "var(--color-4)"
    };

    // Group data by year (D3 v5 + v7 compatible)
    let dataByYear;
    if (d3.nest) {
        const map = d3.nest().key(d => d.University_Year).entries(data);
        dataByYear = new Map(map.map(d => [d.key, d.values]));
    } else {
        dataByYear = d3.group(data, d => d.University_Year);
    }
    dataByYear.set("intro", data);

    const histogram = (d3.histogram || d3.bin)()
        .value(d => d.Sleep_Duration)
        .domain([3, 11])
        .thresholds(d3.range(3, 11, 0.5));

    const binsByStep = {};
    let yMax = 0;
    ["intro", "1st Year", "2nd Year", "3rd Year", "4th Year"].forEach(step => {
        const bins = histogram(dataByYear.get(step) || []);
        binsByStep[step] = bins;
        yMax = Math.max(yMax, d3.max(bins, d => d.length));
    });

    // Create shared tooltip
    let tooltip = d3.select("#bc-tooltip");
    if (tooltip.empty()) {
        tooltip = d3.select("body").append("div")
            .attr("id", "bc-tooltip")
            .style("position", "fixed")
            .style("background", "rgba(20, 25, 35, 0.95)")
            .style("border", "1px solid rgba(255,255,255,0.1)")
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

    // =============================================
    // SINGLE CHART SVG
    // =============================================
    const width = 800, height = 650;
    const margin = { top: 60, right: 40, bottom: 80, left: 70 };
    const innerWidth  = width  - margin.left - margin.right;
    const innerHeight = height - margin.top  - margin.bottom;

    const container = d3.select("#bc-d3-container");

    const singleSvg = container.append("svg")
        .attr("id", "bc-single-svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .style("width", "100%")
        .style("height", "100%")
        .style("position", "absolute")
        .style("top", 0).style("left", 0);

    const singleGroup = singleSvg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([3, 11]).range([0, innerWidth]);
    const y = d3.scaleLinear().domain([0, yMax]).range([innerHeight, 0]);

    singleGroup.append("g").attr("class", "x-axis")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x).ticks(8));

    singleGroup.append("g").attr("class", "y-axis")
        .call(d3.axisLeft(y).ticks(6));

    singleGroup.append("text").attr("class", "axis-label")
        .attr("x", innerWidth / 2).attr("y", innerHeight + 55)
        .attr("text-anchor", "middle").text("Hours of Sleep");

    singleGroup.append("text").attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", -55).attr("x", -innerHeight / 2)
        .attr("text-anchor", "middle").text("Number of Students");

    const chartTitle = singleGroup.append("text").attr("class", "chart-title")
        .attr("x", innerWidth / 2).attr("y", -20)
        .attr("text-anchor", "middle").text("All University Students");

    singleGroup.append("line").attr("class", "reference-line")
        .attr("x1", x(7)).attr("x2", x(7))
        .attr("y1", 0).attr("y2", innerHeight);

    const annotationText = singleGroup.append("text").attr("class", "annotation-text")
        .attr("x", x(6.8)).attr("y", 20).attr("text-anchor", "end");

    // =============================================
    // SUMMARY GRID SVG  (its own full-size SVG)
    // =============================================
    // Each mini-chart gets generous margins for labels
    const sm = { top: 45, right: 20, bottom: 58, left: 58 };
    const cols = 2, rows = 2;
    const svgW = 900, svgH = 880;                        // much bigger viewBox
    const cellW = svgW / cols;
    const cellH = svgH / rows;
    const icW  = cellW - sm.left - sm.right;             // inner cell width
    const icH  = cellH - sm.top  - sm.bottom;            // inner cell height

    const summarySvg = container.append("svg")
        .attr("id", "bc-summary-svg")
        .attr("viewBox", `0 0 ${svgW} ${svgH}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .style("width", "100%")
        .style("height", "100%")
        .style("position", "absolute")
        .style("top", 0).style("left", 0)
        .style("opacity", 0)
        .style("pointer-events", "none");

    const sx = d3.scaleLinear().domain([3, 11]).range([0, icW]);
    const sy = d3.scaleLinear().domain([0, yMax]).range([icH, 0]);

    const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
    years.forEach((year, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const g = summarySvg.append("g")
            .attr("transform", `translate(${col * cellW + sm.left},${row * cellH + sm.top})`);

        // X axis
        g.append("g").attr("class", "x-axis")
            .attr("transform", `translate(0,${icH})`)
            .call(d3.axisBottom(sx).ticks(6))
            .selectAll("text")
            .style("font-size", "13px");

        g.append("text")
            .attr("x", icW / 2).attr("y", icH + 45)
            .attr("text-anchor", "middle")
            .style("fill", "#94a3b8").style("font-size", "14px").style("font-weight", "600")
            .text("Hours of Sleep");

        // Y axis
        g.append("g").attr("class", "y-axis")
            .call(d3.axisLeft(sy).ticks(5))
            .selectAll("text")
            .style("font-size", "13px");

        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -icH / 2).attr("y", -44)
            .attr("text-anchor", "middle")
            .style("fill", "#94a3b8").style("font-size", "14px").style("font-weight", "600")
            .text("# Students");

        // Title
        g.append("text")
            .attr("x", icW / 2).attr("y", -18)
            .attr("text-anchor", "middle")
            .style("fill", "#f8fafc").style("font-size", "18px").style("font-weight", "800")
            .text(year);

        // 7h reference line
        g.append("line").attr("class", "reference-line")
            .attr("x1", sx(7)).attr("x2", sx(7))
            .attr("y1", 0).attr("y2", icH);

        // Bars
        const bars = g.selectAll(".bc-sum-bar")
            .data(binsByStep[year])
            .enter().append("rect")
            .attr("class", "bar bc-sum-bar")
            .attr("x", d => sx(d.x0) + 1)
            .attr("width", d => Math.max(0, sx(d.x1) - sx(d.x0) - 1))
            .attr("y", d => sy(d.length))
            .attr("height", d => icH - sy(d.length))
            .style("fill", colorScale[year]);

        bars.on("mouseover", function(a, b) {
                const e = b !== undefined ? a : d3.event;
                const d = b !== undefined ? b : a;
                tooltip.style("opacity", 1)
                    .html(`<strong>${year}</strong><br/><strong>${d.x0}–${d.x1} hrs</strong><br/><span style="color:var(--accent-color)">${d.length} Students</span>`);
                d3.select(this).style("filter", "brightness(1.3)");
            })
            .on("mousemove", function(a, b) {
                const e = b !== undefined ? a : d3.event;
                tooltip.style("left", (e.clientX + 15) + "px").style("top", (e.clientY - 30) + "px");
            })
            .on("mouseout", function() {
                tooltip.style("opacity", 0);
                d3.select(this).style("filter", "none");
            });
    });

    // Make the container position:relative so absolute children stack properly
    container.style("position", "relative");

    // Grab panel DOM nodes for dynamic resizing
    const rightPanel  = document.querySelector(".bc-right-panel");
    const leftPanel   = document.querySelector(".bc-left-panel");
    const d3Container = document.getElementById("bc-d3-container");

    // Remove the CSS size caps so the single chart fills the full right panel
    d3Container.style.maxWidth  = "none";
    d3Container.style.maxHeight = "none";

    // =============================================
    // LAYER SWITCHING
    // =============================================
    function expandForSummary() {
        rightPanel.style.transition  = "width 0.5s ease, padding 0.5s ease";
        leftPanel.style.transition   = "width 0.5s ease";
        rightPanel.style.width       = "72vw";
        rightPanel.style.padding     = "30px 0";   // breathing room top & bottom
        rightPanel.style.boxSizing   = "border-box";
        leftPanel.style.width        = "25vw";
        d3Container.style.maxWidth   = "none";
        d3Container.style.maxHeight  = "none";
    }

    function collapseFromSummary() {
        rightPanel.style.transition  = "width 0.4s ease, padding 0.4s ease";
        leftPanel.style.transition   = "width 0.4s ease";
        rightPanel.style.width       = "50vw";
        rightPanel.style.padding     = "0";
        leftPanel.style.width        = "45vw";
        // keep max-width/max-height as "none" so single chart stays full-size
    }

    function updateChart(stepName) {
        if (stepName === "summary") {
            expandForSummary();
            singleSvg.transition().duration(400).style("opacity", 0).style("pointer-events", "none");
            summarySvg.transition().delay(400).duration(400).style("opacity", 1).style("pointer-events", "all");
            return;
        }

        collapseFromSummary();
        summarySvg.transition().duration(200).style("opacity", 0).style("pointer-events", "none");
        singleSvg.transition().delay(200).duration(400).style("opacity", 1).style("pointer-events", "all");

        if (!binsByStep[stepName]) return;

        const bins     = binsByStep[stepName];
        const stepData = dataByYear.get(stepName);

        // Title
        chartTitle.text(stepName === "intro" ? "All University Students" : stepName);

        // Annotation
        const below7 = stepData.filter(d => d.Sleep_Duration < 7).length;
        const pct = ((below7 / stepData.length) * 100).toFixed(1);
        annotationText.text(`${pct}% < 7h`)
            .style("fill", stepName === "intro" ? "var(--accent-color)" : colorScale[stepName]);

        // Bars
        const barSel = singleGroup.selectAll(".bar").data(bins);

        const enter = barSel.enter().append("rect").attr("class", "bar")
            .attr("x", d => x(d.x0) + 1)
            .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
            .attr("y", innerHeight).attr("height", 0)
            .style("fill", colorScale[stepName]);

        const merged = enter.merge(barSel);

        merged.on("mouseover", function(a, b) {
                const e = b !== undefined ? a : d3.event;
                const d = b !== undefined ? b : a;
                tooltip.style("opacity", 1)
                    .html(`<strong>${d.x0}–${d.x1} Hours</strong><br/><span style="color:var(--accent-color)">${d.length} Students</span>`);
                d3.select(this).style("filter", "brightness(1.3)");
            })
            .on("mousemove", function(a, b) {
                const e = b !== undefined ? a : d3.event;
                tooltip.style("left", (e.clientX + 15) + "px").style("top", (e.clientY - 30) + "px");
            })
            .on("mouseout", function() {
                tooltip.style("opacity", 0);
                d3.select(this).style("filter", "none");
            });

        merged.transition().duration(800).ease(d3.easeCubicOut)
            .attr("x", d => x(d.x0) + 1)
            .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
            .attr("y", d => y(d.length))
            .attr("height", d => innerHeight - y(d.length))
            .style("fill", colorScale[stepName]);

        barSel.exit().transition().duration(800)
            .attr("y", innerHeight).attr("height", 0).remove();
    }

    updateChart("intro");

    // =============================================
    // SCROLL OBSERVER
    // =============================================
    const steps = document.querySelectorAll(".bc-step");

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                steps.forEach(s => s.classList.remove("active"));
                entry.target.classList.add("active");
                updateChart(entry.target.getAttribute("data-step"));
            }
        });
    }, {
        root: null,
        rootMargin: "-45% 0px -45% 0px",
        threshold: 0
    });

    steps.forEach(step => observer.observe(step));
});
