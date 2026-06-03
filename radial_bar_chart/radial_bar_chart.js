let complexData = null;

// Centerpiece Dimensions
// Increase these width/height values to make the chart appear SMALLER on screen
const width = 1000, height = 750;
const svg = d3.select("#canvas-target")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

const tooltip = d3.select("#chart-tooltip");

const ringThickness = 26;
const ringGap = 10;
const innerBaseRadius = 80;

function drawActivityRings(callback) {
    if (!complexData || !complexData.rings) return;

    svg.selectAll("*").remove();

    const ringGroups = svg.selectAll(".ring-group")
        .data(complexData.rings)
        .enter()
        .append("g")
        .attr("class", "ring-group")
        .attr("id", (d, i) => `ring-group-${i}`);

    // 1. Draw Background Tracks
    const backgroundArcGenerator = d3.arc()
        .innerRadius((d, i) => innerBaseRadius + i * (ringThickness + ringGap))
        .outerRadius((d, i) => innerBaseRadius + ringThickness + i * (ringThickness + ringGap))
        .startAngle(0)
        .endAngle(2 * Math.PI);

    ringGroups.append("path")
        .attr("class", "track-bg")
        .attr("d", backgroundArcGenerator)
        .style("fill", "#141417")
        .style("opacity", 0.4);

    // 2. Draw Active Progress Rings
    const dynamicArcGenerator = d3.arc()
        .innerRadius((d, i) => innerBaseRadius + i * (ringThickness + ringGap))
        .outerRadius((d, i) => innerBaseRadius + ringThickness + i * (ringThickness + ringGap))
        .startAngle(0)
        .endAngle(d => {
            const percentage = d.hours / d.goal;
            return Math.min(percentage * 2 * Math.PI, 2 * Math.PI);
        })
        .cornerRadius(8);

    ringGroups.append("path")
        .attr("class", "foreground-arc")
        .attr("id", (d, i) => `ring-index-${i}`)
        .style("fill", d => d.color);

    // 3. Draw Overflow Arcs (for rings exceeding 100%)
    ringGroups.append("path")
        .attr("class", "overflow-arc")
        .attr("id", (d, i) => `overflow-index-${i}`)
        .style("fill", d => d.color)
        .style("filter", "drop-shadow(2px 4px 6px rgba(0,0,0,0.6))")
        .style("opacity", 0);

    // Add Summary Labels (Hidden by default)
    ringGroups.append("text")
        .attr("class", "summary-label")
        .attr("y", 105)
        .style("text-anchor", "middle")
        .style("fill", d => d.color)
        .style("font-size", "0.85rem")
        .style("font-weight", "600")
        .style("opacity", 0)
        .text(d => d.activity);

    ringGroups.append("text")
        .attr("class", "summary-value")
        .attr("y", 130)
        .style("text-anchor", "middle")
        .style("fill", "#ffffff")
        .style("font-size", "1.1rem")
        .style("font-weight", "800")
        .style("opacity", 0)
        .text(d => d.hours + "h");

    // Add Central Metrics Group
    const centerGroup = svg.append("g")
        .attr("id", "center-metrics")
        .style("opacity", 0)
        .style("text-anchor", "middle");

    // for the Categories Text
    centerGroup.append("text")
        .attr("id", "center-activity")
        .attr("y", -30)
        .style("font-size", "1rem")
        .style("font-weight", "600")
        .style("text-transform", "uppercase")
        .style("letter-spacing", "1.5px")
        .style("fill", "#ffffff")
        .text("ACTIVITY");

    // for the Time Value inside the ring
    centerGroup.append("text")
        .attr("id", "center-value")
        .attr("y", 20)
        .style("font-size", "3.2rem")
        .style("font-weight", "460000") // Keeping their typo
        .style("letter-spacing", "1.5px")
        .style("fill", "#ffffff")
        .text("0.0h");

    // for the Goal Text under the time value
    centerGroup.append("text")
        .attr("id", "center-goal")
        .attr("y", 45)
        .style("font-size", "1.1rem")
        .style("fill", "#86868b")
        .text("/ 0.0h goal");

    // Hover Interactive States for both ring types
    svg.selectAll(".foreground-arc, .overflow-arc")
        .on("mouseover", function (a, b) {
            const d = (a && a.activity) ? a : b;
            const isStudy = d.activity === "Study Hours";
            const suffix = isStudy ? "average" : (d.activity === "Screen Time" ? "recommended" : "goal");
            const unit = isStudy ? "hrs" : "h";

            d3.select("#center-value").text(`${d.hours}${isStudy ? 'hrs' : 'h'}`);
            d3.select("#center-goal").text(`/ ${d.goal}${unit} ${suffix}`);
            d3.select("#center-activity").text(d.activity);

            const currentStep = document.querySelector('.step.active');
            const stepId = currentStep ? currentStep.id : '';

            if (stepId !== 'summary-step') {
                d3.select("#center-metrics").style("opacity", 1);
            }

            d3.selectAll(".foreground-arc").style("opacity", 0.15)
                .style("fill", function (d_inner) {
                    if (stepId === 'intro-step' || stepId === 'all-rings' || stepId === 'summary-step') return d_inner.color;
                    return d_inner === d ? d3.color("#D6AC62").darker(0.6) : d_inner.color;
                });

            d3.selectAll(".overflow-arc").style("opacity", 0)
                .style("fill", function (d_inner) {
                    if (stepId === 'intro-step' || stepId === 'all-rings' || stepId === 'summary-step') return d_inner.color;
                    return d_inner === d ? d3.color("#D6AC62").brighter(0.3) : d_inner.color;
                });

            const index = complexData.rings.indexOf(d);
            d3.select(`#ring-index-${index}`).style("opacity", 1);
            d3.select(`#overflow-index-${index}`).style("opacity", 1);
        })
        .on("mouseout", function () {
            // Re-evaluate current step to restore highlighting properly
            const currentStep = document.querySelector('.step.active');
            if (currentStep) {
                updateHighlights(currentStep.id);
            }
        });

    // Entry animations are now handled strictly by the scroll highlighter!
    if (callback) {
        callback();
    }
}

// --- SCROLL DRIVEN ISOLATION HIGHLIGHTER ---
function updateHighlights(stepId) {
    if (!complexData) return;

    const highlightMap = {
        'ring-study': 0,
        'ring-screen': 1,
        'ring-sleep': 2,
        'ring-bedtime': 3,
        'ring-exercise': 4
    };

    const targetIndex = highlightMap[stepId];
    const wrapper = document.querySelector('.scrollytelling-wrapper');
    const visualCenter = d3.select(".sticky-visual-center");

    // Layout Switch: Shift canvas to left and add background tint if isolating a ring!
    if (stepId === 'intro-step' || stepId === 'all-rings' || stepId === 'summary-step') {
        wrapper.classList.remove('split-mode');
        visualCenter.style("background-color", "transparent");
    } else if (targetIndex !== undefined) {
        wrapper.classList.add('split-mode');
        const ringColor = d3.color("#7037cbff"); // Standardized isolated color
        ringColor.opacity = 0.12; // Apple-like subtle vibrant background tint on the left half
        visualCenter.style("background-color", ringColor);
    }

    // Update Center text and background track opacities
    if (stepId === 'intro-step') {
        d3.select("#center-metrics").style("opacity", 0);
    } else if (stepId === 'all-rings' || stepId === 'summary-step') {
        d3.select("#center-metrics").style("opacity", 0);
    } else if (targetIndex !== undefined) {
        const d = complexData.rings[targetIndex];
        const isStudy = d.activity === "Study Hours";
        const suffix = isStudy ? "average" : (d.activity === "Screen Time" ? "recommended" : "goal");
        const unit = isStudy ? "hrs" : "hrs";

        d3.select("#center-value").text(`${d.hours}${isStudy ? 'hrs' : 'hrs'}`);
        d3.select("#center-goal").text(`/ ${d.goal}${unit} ${suffix}`);
        d3.select("#center-activity").text(d.activity);
        d3.select("#center-metrics").style("opacity", 1);
    }

    // Transition the ring groups position for summary-step
    d3.selectAll(".ring-group").transition().duration(1200)
        .ease(d3.easeCubicOut)
        .attr("transform", function (d, i) {
            if (stepId === 'summary-step') {
                return `translate(${(i - 2) * 190}, 0)`;
            }
            return `translate(0, 0)`;
        });

    d3.selectAll(".summary-label").transition().duration(1200)
        .style("opacity", stepId === 'summary-step' ? 1 : 0);
    d3.selectAll(".summary-value").transition().duration(1200)
        .style("opacity", stepId === 'summary-step' ? 1 : 0);

    // Track Backgrounds
    d3.selectAll(".track-bg").interrupt().transition()
        .duration(1200)
        .ease(d3.easeCubicOut)
        .style("opacity", stepId === 'intro-step' ? 0.05 : (stepId === 'all-rings' || stepId === 'summary-step' ? 0.4 : 0.15))
        .attrTween("d", function (d, i) {
            const tInner = (stepId === 'summary-step') ? 55 : innerBaseRadius + i * (ringThickness + ringGap);
            const tOuter = (stepId === 'summary-step') ? 80 : innerBaseRadius + ringThickness + i * (ringThickness + ringGap);

            if (typeof this._currentInner === 'undefined') this._currentInner = innerBaseRadius + i * (ringThickness + ringGap);
            if (typeof this._currentOuter === 'undefined') this._currentOuter = innerBaseRadius + ringThickness + i * (ringThickness + ringGap);

            const iInner = d3.interpolate(this._currentInner, tInner);
            const iOuter = d3.interpolate(this._currentOuter, tOuter);

            return function (t) {
                this._currentInner = iInner(t);
                this._currentOuter = iOuter(t);
                return d3.arc()
                    .innerRadius(this._currentInner)
                    .outerRadius(this._currentOuter)
                    .startAngle(0)
                    .endAngle(2 * Math.PI)();
            }.bind(this);
        });

    // Foreground Arcs
    d3.selectAll(".foreground-arc").interrupt().transition()
        .duration(1200)
        .ease(d3.easeCubicOut)
        .attrTween("d", function (d, i) {
            const totalFinalAngle = (d.hours / d.goal) * 2 * Math.PI;

            let targetAngle = 0;
            if (stepId === 'all-rings' || stepId === 'summary-step') {
                targetAngle = totalFinalAngle;
            } else if (i === targetIndex) {
                targetAngle = totalFinalAngle;
            }

            if (typeof d.currentAngle === 'undefined') d.currentAngle = 0;
            if (i === targetIndex && targetAngle > 0) d.currentAngle = 0;

            const tInner = (stepId === 'summary-step') ? 55 : innerBaseRadius + i * (ringThickness + ringGap);
            const tOuter = (stepId === 'summary-step') ? 80 : innerBaseRadius + ringThickness + i * (ringThickness + ringGap);

            if (typeof this._currentInner === 'undefined') this._currentInner = innerBaseRadius + i * (ringThickness + ringGap);
            if (typeof this._currentOuter === 'undefined') this._currentOuter = innerBaseRadius + ringThickness + i * (ringThickness + ringGap);

            const interpolate = d3.interpolate(d.currentAngle, targetAngle);
            const iInner = d3.interpolate(this._currentInner, tInner);
            const iOuter = d3.interpolate(this._currentOuter, tOuter);

            return function (t) {
                d.currentAngle = interpolate(t);
                this._currentInner = iInner(t);
                this._currentOuter = iOuter(t);

                const localArc = d3.arc()
                    .innerRadius(this._currentInner)
                    .outerRadius(this._currentOuter)
                    .startAngle(0)
                    .cornerRadius(8);

                localArc.endAngle(Math.min(d.currentAngle, 2 * Math.PI));
                return localArc();
            }.bind(this);
        })
        .style("fill", function (d, i) {
            if (stepId === 'intro-step' || stepId === 'all-rings' || stepId === 'summary-step') return d.color;
            return i === targetIndex ? d3.color("#D6AC62").darker(0.6) : d.color;
        })
        .style("opacity", function (d, i) {
            if (stepId === 'intro-step') return 0;
            if (stepId === 'all-rings' || stepId === 'summary-step') return 1;
            return i === targetIndex ? 1 : 0.15;
        });

    // Overflow Arcs
    d3.selectAll(".overflow-arc").interrupt().transition()
        .duration(1200)
        .ease(d3.easeCubicOut)
        .attrTween("d", function (d, i) {
            const totalFinalAngle = (d.hours / d.goal) * 2 * Math.PI;

            let targetAngle = 0;
            if (stepId === 'all-rings' || stepId === 'summary-step') {
                targetAngle = totalFinalAngle;
            } else if (i === targetIndex) {
                targetAngle = totalFinalAngle;
            }

            if (typeof d.overflowAngle === 'undefined') d.overflowAngle = 0;
            if (i === targetIndex && targetAngle > 0) d.overflowAngle = 0;

            const tInner = (stepId === 'summary-step') ? 55 : innerBaseRadius + i * (ringThickness + ringGap);
            const tOuter = (stepId === 'summary-step') ? 80 : innerBaseRadius + ringThickness + i * (ringThickness + ringGap);

            if (typeof this._currentInner === 'undefined') this._currentInner = innerBaseRadius + i * (ringThickness + ringGap);
            if (typeof this._currentOuter === 'undefined') this._currentOuter = innerBaseRadius + ringThickness + i * (ringThickness + ringGap);

            const interpolate = d3.interpolate(d.overflowAngle, targetAngle);
            const iInner = d3.interpolate(this._currentInner, tInner);
            const iOuter = d3.interpolate(this._currentOuter, tOuter);

            return function (t) {
                d.overflowAngle = interpolate(t);
                this._currentInner = iInner(t);
                this._currentOuter = iOuter(t);

                if (d.overflowAngle <= 2 * Math.PI) return ""; // Hide completely if not exceeding 100%

                const localArc = d3.arc()
                    .innerRadius(this._currentInner)
                    .outerRadius(this._currentOuter)
                    .startAngle(0)
                    .cornerRadius(8);

                localArc.endAngle(d.overflowAngle - 2 * Math.PI);
                return localArc();
            }.bind(this);
        })
        .style("fill", function (d, i) {
            if (stepId === 'intro-step' || stepId === 'all-rings' || stepId === 'summary-step') return d.color;
            return i === targetIndex ? d3.color("#D6AC62").brighter(0.3) : d.color;
        })
        .style("opacity", function (d, i) {
            if (stepId === 'intro-step') return 0;
            if (stepId === 'all-rings' || stepId === 'summary-step') return 1;
            return i === targetIndex ? 1 : 0; // Hide unselected overflows
        });
}

// --- Intersection Observer ---
const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            document.querySelectorAll('.step').forEach(element => element.classList.remove('active'));
            entry.target.classList.add('active');
            updateHighlights(entry.target.id);
        }
    });
}, { root: null, threshold: 0.6 });

// --- Data Load Initialization ---
complexData = {
    "intro": {
        "deficit_pct": 58.2
    },
    "rings": [
        {
            "activity": "Study Hours",
            "hours": 6.0,
            "goal": 4.0,
            "color": "#AF880F",
            "story": "Students average 6.0 hours of daily study. Driven by intense 'extremely high stress' workloads, academic demands consistently compress other life rings."
        },
        {
            "activity": "Screen Time",
            "hours": 2.5,
            "goal": 1.5,
            "color": "#E1B223",
            "story": "Accounting for 2.5 hours. The dataset reveals device interaction before bed is 'often (5-6 times a week)', fueling insomnia loops."
        },
        {
            "activity": "Sleep Focus",
            "hours": 6.5,
            "goal": 8.0,
            "color": "#FFDC72",
            "story": "With an average of only 6.5 hours, this ring fails to close, directly causing a cascading impact on recent 'Poor' academic performance benchmarks."
        },
        {
            "activity": "Pre-Bedtime Routine",
            "hours": 1.5,
            "goal": 2.0,
            "color": "#F2C94C",
            "story": "A 1.5-hour evening block characterized by checking phones, streaming, or consuming caffeine to battle midnight deadlines."
        },
        {
            "activity": "Physical Exercise",
            "hours": 1.0,
            "goal": 1.0,
            "color": "#FFE79D",
            "story": "Averaging a slim 1.0 hours. Physical activity outlets are the first routines dropped when study and screen times spike."
        }
    ]
};

// Draw immediately, then run the initial highlight configuration once complete
drawActivityRings(() => {
    updateHighlights('intro-step');
});

// Bind scroll updates safely
document.querySelectorAll('.step').forEach(section => scrollObserver.observe(section));