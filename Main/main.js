// msg kylie for any issues w sankey diagram 
// the sleepless cycle sankey
// exploring caffeine -> sleep -> quality -> screen time

var activeFilters = {
    study: null,
    activity: null
};
var highlightedNode = null;

// colors
var colors = {
    bg: "#1a1032",
    cardBg: "#241845",
    titleText: "#e8dff5",
    labelText: "#b8a9d4",
    mutedText: "#7b6b99",
    accent: "#a07cff",
    gold: "#f0c040",
    hintText: "#5a4d80"
};

var colColors = ["#f0c040", "#9b7fea", "#7bb8ea", "#e88dc4"];


// maps a bin name to a plain-English description based on its column
// col: 0=caffeine, 1=sleep duration, 2=quality, 3=screen time
function describeBin(col, bin) {
    if (col === 0) {
        if (bin === "No caffeine") return "no caffeine";
        if (bin === "Low (1 cup)") return "1 cup of coffee";
        if (bin === "Moderate (2-3)") return "2-3 cups of coffee";
        if (bin === "High (4-5)") return "4-5 cups of coffee";
    } else if (col === 1) {
        if (bin === "7+ hrs") return "7+ hours of sleep";
        if (bin === "6-7 hrs") return "6-7 hours of sleep";
        if (bin === "5-6 hrs") return "5-6 hours of sleep";
        if (bin === "< 5 hrs") return "under 5 hours of sleep";
    } else if (col === 2) {
        if (bin === "Excellent") return "excellent quality";
        if (bin === "Good") return "good quality";
        if (bin === "Fair") return "fair quality";
        if (bin === "Poor") return "poor quality";
    } else if (col === 3) {
        if (bin === "Low (< 2h)") return "under 2 hours of screen time";
        if (bin === "Med (2-3h)") return "2-3 hours of screen time";
        if (bin === "High (3+h)") return "3+ hours of screen time";
    }
    return bin;
}


function drawSankey() {
    d3.select("#sankey-svg").selectAll("*").remove();

    var w = window.innerWidth;
    var h = window.innerHeight;
    var svg = d3.select("#sankey-svg");

    // title
    svg.append("text")
        .attr("x", w / 2).attr("y", 38)
        .attr("text-anchor", "middle")
        .attr("fill", colors.titleText)
        .attr("font-size", "29px")
        .attr("font-weight", "bold")
        .attr("font-family", "Libre Baskerville, serif")
        .text("The Sleepless Cycle");

    // thesis subtitle
    svg.append("text")
        .attr("x", w / 2).attr("y", 72)
        .attr("text-anchor", "middle")
        .attr("fill", "#a093b5")
        .attr("font-size", "17px")
        .attr("font-family", "sans-serif")
        .text("Most students never close the loop. Follow the flows — sleep lost is rarely sleep regained.");

    var filterY = 96;
    var filterH = 110;

    var fo = svg.append("foreignObject")
        .attr("x", 0).attr("y", filterY)
        .attr("width", w).attr("height", filterH);

    // build filter buttons as html
    var inactiveBtn = "background:rgba(184, 172, 226, 0.36);border:1px solid rgba(121,100,213,0.35);color:#c4b0ff;";
    var activeBtn   = "background:#2d1f6e;border:1px solid #a07cff;color:#e8dff5;";

    var html = '<div style="display:grid;grid-template-columns:240px 1fr;align-items:center;justify-content:center;gap:8px 12px;padding:6px 20px;font-family:sans-serif;width:560px;margin:0 auto;">';

    // study load filter
    html += '<span style="font-size:13px;color:#a093b5;font-style:italic;text-align:right;">Does less studying save sleep?</span>';
    html += '<div style="display:flex;gap:5px;">';
    ["Light", "Moderate", "Heavy"].forEach(function (lab) {
        var active = activeFilters.study === lab;
        var s = active ? activeBtn : inactiveBtn;
        html += '<button onclick="handleFilterClick(\'study\',\'' + lab + '\')" style="' + s + 'padding:4px 14px;border-radius:12px;font-size:13px;cursor:pointer;font-family:sans-serif;transition:all 0.2s;">' + lab + '</button>';
    });
    html += '</div>';

    // exercise filter
    html += '<span style="font-size:13px;color:#a093b5;font-style:italic;text-align:right;">Can exercise break the cycle?</span>';
    html += '<div style="display:flex;gap:5px;">';
    var exerciseOpts = ["Low", "Medium", "High"];
    for (var ei = 0; ei < exerciseOpts.length; ei++) {
        var lab = exerciseOpts[ei];
        var active = activeFilters.activity === lab;
        var s = active ? activeBtn : inactiveBtn;
        html += '<button onclick="handleFilterClick(\'activity\',\'' + lab + '\')" style="' + s + 'padding:4px 14px;border-radius:12px;font-size:13px;cursor:pointer;font-family:sans-serif;transition:all 0.2s;">' + lab + '</button>';
    }
    html += '</div>';

    if (activeFilters.study !== null || activeFilters.activity !== null) {
        html += '<div style="grid-column:1/-1;display:flex;justify-content:center;margin-top:2px;">';
        html += '<button onclick="resetFilters()" style="background:transparent;border:1px solid #5a3a7e;color:#7b6b99;padding:3px 14px;border-radius:12px;font-size:13px;cursor:pointer;font-family:sans-serif;">Reset</button>';
        html += '</div>';
    }

    html += '</div>';
    fo.append("xhtml:div").html(html);

    d3.csv("../dataset/student_sleep_patterns.csv").then(function (raw) {

        // parse + bin everything
        raw.forEach(function (d) {
            d.sleepDuration = +d.Sleep_Duration;
            d.studyHrs = +d.Study_Hours;
            d.screenTime = +d.Screen_Time;
            d.caffeine = +d.Caffeine_Intake;
            d.physActivity = +d.Physical_Activity;
            d.sleepQual = +d.Sleep_Quality;

            // caffeine bins
            if (d.caffeine === 0) d.caffBin = "No caffeine";
            else if (d.caffeine <= 1) d.caffBin = "Low (1 cup)";
            else if (d.caffeine <= 3) d.caffBin = "Moderate (2-3)";
            else d.caffBin = "High (4-5)";

            // sleep duration
            if (d.sleepDuration < 5) d.sleepBin = "< 5 hrs";
            else if (d.sleepDuration < 6) d.sleepBin = "5-6 hrs";
            else if (d.sleepDuration < 7) d.sleepBin = "6-7 hrs";
            else d.sleepBin = "7+ hrs";

            // quality
            if (d.sleepQual <= 3) d.qualBin = "Poor";
            else if (d.sleepQual <= 5) d.qualBin = "Fair";
            else if (d.sleepQual <= 7) d.qualBin = "Good";
            else d.qualBin = "Excellent";

            if (d.screenTime < 2) d.screenBin = "Low (< 2h)";
            else if (d.screenTime < 3) d.screenBin = "Med (2-3h)";
            else d.screenBin = "High (3+h)";

            // filter bins
            if (d.studyHrs < 4) d.studyBin = "Light";
            else if (d.studyHrs < 8) d.studyBin = "Moderate";
            else d.studyBin = "Heavy";

            if (d.physActivity < 30) d.actBin = "Low";
            else if (d.physActivity < 70) d.actBin = "Medium";
            else d.actBin = "High";
        });

        // apply filters
        var filtered = raw.filter(function (d) {
            if (activeFilters.study !== null && d.studyBin !== activeFilters.study) return false;
            if (activeFilters.activity !== null && d.actBin !== activeFilters.activity) return false;
            return true;
        });
        var count = filtered.length;
        var hasFilter = activeFilters.study !== null || activeFilters.activity !== null;

        // compute the most-traveled 4-step path
        var pathCount = {};
        filtered.forEach(function (d) {
            var key = d.caffBin + "||" + d.sleepBin + "||" + d.qualBin + "||" + d.screenBin;
            pathCount[key] = (pathCount[key] || 0) + 1;
        });
        var doomKey = null;
        var doomN = 0;
        Object.keys(pathCount).forEach(function (k) {
            if (pathCount[k] > doomN) { doomN = pathCount[k]; doomKey = k; }
        });
        var doomParts = doomKey ? doomKey.split("||") : [];
        var doomLinks = {};
        if (doomParts.length === 4) {
            doomLinks[doomParts[0] + ">>" + doomParts[1]] = true;
            doomLinks[doomParts[1] + ">>" + doomParts[2]] = true;
            doomLinks[doomParts[2] + ">>" + doomParts[3]] = true;
        }
        // doom mode is only active when no filters are applied
        var showDoomPath = !hasFilter;

        // helper to get the right link opacity based on current state
        function linkOpacityFor(d) {
            if (highlightedNode !== null) {
                var connected = d.source.name === highlightedNode || d.target.name === highlightedNode;
                return connected ? 0.65 : 0.05;
            }
            if (showDoomPath) {
                return doomLinks[d.source.name + ">>" + d.target.name] ? 0.85 : 0.12;
            }
            return 0.3;
        }

        // show count OR doom path callout
        var narY = filterY + filterH + 2;
        if (showDoomPath) {
            // build descriptive doom path string
            var doomDesc = doomParts.map(function (p, i) { return describeBin(i, p); }).join("   →   ");
            svg.append("text")
                .attr("x", w / 2).attr("y", narY + 14)
                .attr("text-anchor", "middle")
                .attr("fill", colors.gold)
                .attr("font-size", "15px")
                .attr("font-style", "italic")
                .attr("font-family", "sans-serif")
                .text("The most common night:  " + doomDesc + "    ·    " + doomN + " students walk this exact path");
        } else {
            var desc = "";
            if (activeFilters.study !== null) desc += activeFilters.study.toLowerCase() + " study load";
            if (activeFilters.activity !== null) {
                if (desc.length > 0) desc += " & ";
                desc += activeFilters.activity.toLowerCase() + " exercise";
            }
            var countText = "Showing " + count + " of 500 students";
            if (desc.length > 0) countText += " with " + desc;

            svg.append("text")
                .attr("x", w / 2).attr("y", narY + 12)
                .attr("text-anchor", "middle")
                .attr("fill", colors.mutedText)
                .attr("font-size", "16px")
                .attr("font-family", "sans-serif")
                .text(countText);
        }

        // not enough data check
        if (count < 5) {
            svg.append("text")
                .attr("x", w / 2).attr("y", h / 2)
                .attr("text-anchor", "middle")
                .attr("fill", colors.accent)
                .attr("font-size", "14px")
                .attr("font-family", "sans-serif")
                .text("Not enough data for this combination — try removing a filter.");
            return;
        }

        // node definitions for each column
        var caffNodes = ["No caffeine", "Low (1 cup)", "Moderate (2-3)", "High (4-5)"];
        var sleepNodes = ["7+ hrs", "6-7 hrs", "5-6 hrs", "< 5 hrs"];
        var qualNodes = ["Excellent", "Good", "Fair", "Poor"];
        var scrNodes = ["Low (< 2h)", "Med (2-3h)", "High (3+h)"];

        var allNames = caffNodes.concat(sleepNodes).concat(qualNodes).concat(scrNodes);

        // which column each node is in
        var colMap = {};
        caffNodes.forEach(function (n) { colMap[n] = 0; });
        sleepNodes.forEach(function (n) { colMap[n] = 1; });
        qualNodes.forEach(function (n) { colMap[n] = 2; });
        scrNodes.forEach(function (n) { colMap[n] = 3; });

        var nodes = [];
        for (var ni = 0; ni < allNames.length; ni++) {
            nodes.push({ name: allNames[ni] });
        }

        function nodeIdx(name) {
            return allNames.indexOf(name);
        }

        // count flows between columns
        var linkMap = {};
        filtered.forEach(function (d) {
            var pairs = [
                [d.caffBin, d.sleepBin],
                [d.sleepBin, d.qualBin],
                [d.qualBin, d.screenBin]
            ];
            pairs.forEach(function (p) {
                var k = p[0] + "||" + p[1];
                if (!linkMap[k]) linkMap[k] = { source: p[0], target: p[1], value: 0 };
                linkMap[k].value++;
            });
        });

        var links = [];
        Object.keys(linkMap).forEach(function (k) {
            var e = linkMap[k];
            if (e.value > 0) {
                links.push({
                    source: nodeIdx(e.source),
                    target: nodeIdx(e.target),
                    value: e.value
                });
            }
        });

        // layout setup
        var margin = { top: 60, right: 140, bottom: 120, left: 140 };
        var sTop = narY + 22;
        var sWidth = w - margin.left - margin.right;
        var sHeight = h - sTop - margin.top - margin.bottom;
        if (sHeight < 200) sHeight = 200;

        var g = svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + (sTop + margin.top) + ")");

        // keep nodes in our order
        var order = {};
        allNames.forEach(function (n, i) { order[n] = i; });

        var layout = d3.sankey()
            .nodeWidth(16)
            .nodePadding(14)
            .nodeAlign(d3.sankeyLeft)
            .nodeSort(function (a, b) { return order[a.name] - order[b.name]; })
            .extent([[0, 0], [sWidth, sHeight]]);

        var data = layout({
            nodes: nodes.map(function (d) { return Object.assign({}, d); }),
            links: links.map(function (d) { return Object.assign({}, d); })
        });

        // draw the links
        var linkEls = g.append("g")
            .selectAll(".link")
            .data(data.links)
            .enter()
            .append("path")
            .attr("class", "link")
            .attr("d", d3.sankeyLinkHorizontal())
            .attr("stroke-width", function (d) { return Math.max(1.5, d.width); })
            .attr("stroke", function (d) { return colColors[colMap[d.source.name]]; })
            .attr("stroke-opacity", function (d) { return linkOpacityFor(d); })
            .attr("fill", "none")
            .style("cursor", "pointer");

        // link hover (d3 v7 signature: event first, datum second)
        linkEls.on("mouseover", function (event, d) {
            d3.select(this).attr("stroke-opacity", 0.7);
            var pct = ((d.value / count) * 100).toFixed(1);
            var srcCol = colMap[d.source.name];
            var tgtCol = colMap[d.target.name];
            var tip = "<strong>" + d.value + " students</strong> (" + pct + "%)<br>";
            tip += "<span style='color:" + colColors[srcCol] + "'>" + describeBin(srcCol, d.source.name) + "</span>";
            tip += " → ";
            tip += "<span style='color:" + colColors[tgtCol] + "'>" + describeBin(tgtCol, d.target.name) + "</span>";
            var tt = document.getElementById("tooltip");
            tt.innerHTML = tip;
            tt.style.opacity = 1;
        })
            .on("mousemove", function (event) {
                var tt = document.getElementById("tooltip");
                tt.style.left = (event.pageX + 15) + "px";
                tt.style.top = (event.pageY - 10) + "px";
            })
            .on("mouseout", function (event, d) {
                d3.select(this).attr("stroke-opacity", linkOpacityFor(d));
                document.getElementById("tooltip").style.opacity = 0;
            });


        // draw nodes
        var nodeEls = g.append("g")
            .selectAll(".node")
            .data(data.nodes)
            .enter()
            .append("rect")
            .attr("class", "node")
            .attr("x", function (d) { return d.x0; })
            .attr("y", function (d) { return d.y0; })
            .attr("width", function (d) { return d.x1 - d.x0; })
            .attr("height", function (d) { return Math.max(2, d.y1 - d.y0); })
            .attr("fill", function (d) { return colColors[colMap[d.name]]; })
            .attr("stroke", "#1a1032")
            .attr("stroke-width", 1)
            .attr("rx", 3)
            .style("cursor", "pointer");

        // click node to highlight (d3 v7 signature)
        nodeEls.on("click", function (event, d) {
            if (highlightedNode === d.name) {
                // deselect - return to either doom mode or normal mode
                highlightedNode = null;
                linkEls.attr("stroke-opacity", function (l) { return linkOpacityFor(l); });
                svg.selectAll(".hl-label").remove();
            } else {
                highlightedNode = d.name;
                linkEls.attr("stroke-opacity", function (l) { return linkOpacityFor(l); });

                svg.selectAll(".hl-label").remove();
                svg.append("text")
                    .attr("class", "hl-label")
                    .attr("x", w / 2).attr("y", h - 8)
                    .attr("text-anchor", "middle")
                    .attr("fill", colors.accent)
                    .attr("font-size", "11px")
                    .attr("font-family", "sans-serif")
                    .text("Showing paths through: " + describeBin(colMap[d.name], d.name) + " (" + d.value + " students) — click again to reset");
            }
        });

        // node hover (d3 v7 signature)
        nodeEls.on("mouseover", function (event, d) {
            d3.select(this).attr("fill-opacity", 0.8);
            var pct = ((d.value / count) * 100).toFixed(1);
            var tt = document.getElementById("tooltip");
            tt.innerHTML = "<strong>" + describeBin(colMap[d.name], d.name) + "</strong><br>" + d.value + " students (" + pct + "%)";
            tt.style.opacity = 1;
        })
            .on("mousemove", function (event) {
                var tt = document.getElementById("tooltip");
                tt.style.left = (event.pageX + 15) + "px";
                tt.style.top = (event.pageY - 10) + "px";
            })
            .on("mouseout", function (event) {
                d3.select(this).attr("fill-opacity", 1);
                document.getElementById("tooltip").style.opacity = 0;
            });

        // node labels
        g.append("g")
            .selectAll(".lbl")
            .data(data.nodes)
            .enter()
            .append("text")
            .attr("class", "lbl")
            .attr("x", function (d) {
                return colMap[d.name] === 0 ? d.x0 - 8 : d.x1 + 8;
            })
            .attr("y", function (d) { return (d.y0 + d.y1) / 2; })
            .attr("text-anchor", function (d) {
                return colMap[d.name] === 0 ? "end" : "start";
            })
            .attr("dominant-baseline", "middle")
            .attr("fill", colors.labelText)
            .attr("font-size", "11px")
            .attr("font-family", "sans-serif")
            .text(function (d) { return d.name + " (" + d.value + ")"; });

        // column headers + story-role subheads
        var headers = ["Caffeine Intake", "Sleep Duration", "Sleep Quality", "Screen Time"];
        var subheads = ["the input", "the cost", "the consequence", "the relapse"];
        var colX = [null, null, null, null];
        data.nodes.forEach(function (d) {
            var c = colMap[d.name];
            if (colX[c] === null) colX[c] = (d.x0 + d.x1) / 2;
        });
        for (var hi = 0; hi < headers.length; hi++) {
            if (colX[hi] === null) continue;
            // main header
            g.append("text")
                .attr("x", colX[hi]).attr("y", -28)
                .attr("text-anchor", "middle")
                .attr("fill", colors.labelText)
                .attr("font-size", "12px")
                .attr("font-weight", "bold")
                .attr("letter-spacing", "0.1em")
                .attr("font-family", "sans-serif")
                .text(headers[hi].toUpperCase());
            // story-role subhead
            g.append("text")
                .attr("x", colX[hi]).attr("y", -12)
                .attr("text-anchor", "middle")
                .attr("fill", colors.mutedText)
                .attr("font-size", "11px")
                .attr("font-style", "italic")
                .attr("font-family", "sans-serif")
                .text(subheads[hi]);
        }

        // cycle arrow as the emotional payoff
        var lastX = colX[3];
        var firstX = colX[0];
        if (lastX !== null && firstX !== null) {
            var ay = sHeight + 14;
            var startX = lastX + margin.left;
            var endX = firstX + margin.left;
            var baseY = sTop + margin.top + ay;
            var curveY = baseY + 22;

            svg.append("path")
                .attr("d", "M " + startX + " " + baseY + " Q " + (w / 2) + " " + curveY + " " + endX + " " + baseY)
                .attr("fill", "none")
                .attr("stroke", colors.gold)
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "5,5")
                .attr("opacity", 0.85);

            // arrowhead
            svg.append("polygon")
                .attr("points",
                    endX + "," + baseY + " " +
                    (endX + 10) + "," + (baseY - 5) + " " +
                    (endX + 10) + "," + (baseY + 5))
                .attr("fill", colors.gold)
                .attr("opacity", 0.85);

            svg.append("text")
                .attr("x", w / 2).attr("y", curveY + 18)
                .attr("text-anchor", "middle")
                .attr("fill", colors.gold)
                .attr("font-size", "14px")
                .attr("font-style", "italic")
                .attr("font-weight", "bold")
                .attr("font-family", "sans-serif")
                .text("Tomorrow's exhaustion  →  tomorrow's caffeine  →  tomorrow's lost sleep.");
        }

        // hint text
        if (highlightedNode === null) {
            svg.append("text")
                .attr("x", w / 2).attr("y", h - 8)
                .attr("text-anchor", "middle")
                .attr("fill", colors.hintText)
                .attr("font-size", "10px")
                .attr("font-family", "sans-serif")
                .text("Click any category to isolate its paths  •  Hover for details  •  Use filters above to compare groups");
        }

        // revelatory narrative with evidence
        var lowSleepPct = Math.round(filtered.filter(function (d) {
            return d.sleepBin !== "7+ hrs";
        }).length / count * 100);
        var poorQualPct = Math.round(filtered.filter(function (d) {
            return d.qualBin === "Poor" || d.qualBin === "Fair";
        }).length / count * 100);
        var hiScreenPct = Math.round(filtered.filter(function (d) {
            return d.screenBin === "High (3+h)";
        }).length / count * 100);

        var narr = "";
        if (!hasFilter) {
            narr = doomN + " students walk this exact path — and " + lowSleepPct + "% of all 500 never reach 7 hours of sleep. The loop holds.";
        } else if (activeFilters.study === "Heavy") {
            narr = "Even with a heavy study load, " + lowSleepPct + "% still fall under 7 hours and " + poorQualPct + "% report poor or fair quality. Effort doesn't earn rest.";
        } else if (activeFilters.study === "Light") {
            narr = "Even with light study loads, " + lowSleepPct + "% still sleep less than 7 hours. The cycle is structural, not personal.";
        } else if (activeFilters.activity === "High") {
            narr = "Exercise helps — but " + lowSleepPct + "% still fall under 7 hours and " + hiScreenPct + "% still rack up 3+ hours of screen time. The cycle weakens, but doesn't break.";
        } else if (activeFilters.activity === "Low") {
            narr = "Without exercise, " + poorQualPct + "% report poor or fair sleep quality. The cycle deepens.";
        } else {
            narr = "In this group, " + lowSleepPct + "% sleep under 7 hours and " + poorQualPct + "% report poor or fair quality. The cycle holds.";
        }

        svg.append("text")
            .attr("x", w / 2).attr("y", h - 26)
            .attr("text-anchor", "middle")
            .attr("fill", colors.labelText)
            .attr("font-size", "13px").attr("font-style", "italic")
            .attr("font-family", "sans-serif")
            .text(narr);

    }).catch(function (err) {
        console.log("csv load error:", err);
        svg.append("text")
            .attr("x", w / 2).attr("y", h / 2)
            .attr("text-anchor", "middle")
            .attr("fill", "#e74c3c")
            .attr("font-size", "14px")
            .attr("font-family", "sans-serif")
            .text("Error loading student_sleep_patterns.csv — make sure the file is in the dataset folder");
    });
}


function handleFilterClick(type, val) {
    if (activeFilters[type] === val) {
        activeFilters[type] = null;
    } else {
        activeFilters[type] = val;
    }
    highlightedNode = null;
    drawSankey();
}

function resetFilters() {
    activeFilters.study = null;
    activeFilters.activity = null;
    highlightedNode = null;
    drawSankey();
}

drawSankey();

var resizeTimer;
window.addEventListener("resize", function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(drawSankey, 150);
});