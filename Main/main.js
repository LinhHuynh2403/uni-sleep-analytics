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


function drawSankey() {
    d3.select("#sankey-svg").selectAll("*").remove();

    var w = window.innerWidth;
    var h = window.innerHeight;
    var svg = d3.select("#sankey-svg");

    // title
    svg.append("text")
        .attr("x", w / 2).attr("y", 28)
        .attr("text-anchor", "middle")
        .attr("fill", colors.titleText)
        .attr("font-size", "20px")
        .attr("font-weight", "bold")
        .attr("font-family", "sans-serif")
        .text("The Sleepless Cycle");

    svg.append("text")
        .attr("x", w / 2).attr("y", 48)
        .attr("text-anchor", "middle")
        .attr("fill", colors.mutedText)
        .attr("font-size", "12px")
        .attr("font-family", "sans-serif")
        .text("How caffeine, sleep, and screens trap 500 students in a loop. Can study habits or exercise break it?");

    var filterY = 58;
    var filterH = 50;

    var fo = svg.append("foreignObject")
        .attr("x", 0).attr("y", filterY)
        .attr("width", w).attr("height", filterH);

    // build filter buttons as html
    var html = '<div style="display:flex;align-items:center;justify-content:center;gap:24px;padding:8px 20px;font-family:sans-serif;">';

    // study load buttons
    html += '<div style="display:flex;align-items:center;gap:8px;">';
    html += '<span style="font-size:10px;color:#7b6b99;text-transform:uppercase;letter-spacing:0.05em;">Study Load</span>';
    html += '<div style="display:flex;gap:3px;">';
    ["Light", "Moderate", "Heavy"].forEach(function (lab) {
        var active = activeFilters.study === lab;
        var s = active
            ? "background:#2d1f6e;border:1px solid #a07cff;color:#c4b0ff;"
            : "background:transparent;border:1px solid #3d2a6e;color:#8a7aaa;";
        html += '<button onclick="handleFilterClick(\'study\',\'' + lab + '\')" style="' + s + 'padding:3px 10px;border-radius:12px;font-size:11px;cursor:pointer;font-family:sans-serif;transition:all 0.2s;">' + lab + '</button>';
    });
    html += '</div></div>';

    // exercise buttons
    html += '<div style="display:flex;align-items:center;gap:8px;">';
    html += '<span style="font-size:10px;color:#7b6b99;text-transform:uppercase;letter-spacing:0.05em;">Exercise</span>';
    html += '<div style="display:flex;gap:3px;">';

    var exerciseOpts = ["Low", "Medium", "High"];
    for (var ei = 0; ei < exerciseOpts.length; ei++) {
        var lab = exerciseOpts[ei];
        var active = activeFilters.activity === lab;
        var s = active
            ? "background:#2d1f6e;border:1px solid #a07cff;color:#c4b0ff;"
            : "background:transparent;border:1px solid #3d2a6e;color:#8a7aaa;";
        html += '<button onclick="handleFilterClick(\'activity\',\'' + lab + '\')" style="' + s + 'padding:3px 10px;border-radius:12px;font-size:11px;cursor:pointer;font-family:sans-serif;transition:all 0.2s;">' + lab + '</button>';
    }
    html += '</div></div>';

    if (activeFilters.study !== null || activeFilters.activity !== null) {
        html += '<button onclick="resetFilters()" style="background:transparent;border:1px solid #5a3a7e;color:#7b6b99;padding:3px 12px;border-radius:12px;font-size:10px;cursor:pointer;font-family:sans-serif;">Reset</button>';
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
        //console.log("filtered count:", count);

        // show count
        var narY = filterY + filterH + 2;
        var desc = "";
        if (activeFilters.study !== null) desc += activeFilters.study.toLowerCase() + " study load";
        if (activeFilters.activity !== null) {
            if (desc.length > 0) desc += " & ";
            desc += activeFilters.activity.toLowerCase() + " exercise";
        }
        var countText = "Showing " + count + " of 500 students";
        if (desc.length > 0) countText += " with " + desc;

        svg.append("text")
            .attr("x", w / 2).attr("y", narY + 10)
            .attr("text-anchor", "middle")
            .attr("fill", colors.mutedText)
            .attr("font-size", "11px")
            .attr("font-family", "sans-serif")
            .text(countText);

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
        var margin = { top: 50, right: 140, bottom: 120, left: 140 };
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
            .attr("stroke-opacity", 0.3)
            .attr("fill", "none")
            .style("cursor", "pointer");

        // link hover
        linkEls.on("mouseover", function (d) {
            d3.select(this).attr("stroke-opacity", 0.7);
            var pct = ((d.value / count) * 100).toFixed(1);
            var tip = "<strong>" + d.value + " students</strong> (" + pct + "%)<br>";
            tip += "<span style='color:" + colColors[colMap[d.source.name]] + "'>" + d.source.name + "</span>";
            tip += " → ";
            tip += "<span style='color:" + colColors[colMap[d.target.name]] + "'>" + d.target.name + "</span>";
            var tt = document.getElementById("tooltip");
            tt.innerHTML = tip;
            tt.style.opacity = 1;
        })
            .on("mousemove", function () {
                var tt = document.getElementById("tooltip");
                tt.style.left = (d3.event.pageX + 15) + "px";
                tt.style.top = (d3.event.pageY - 10) + "px";
            })
            .on("mouseout", function (d) {
                if (highlightedNode !== null) {
                    var connected = d.source.name === highlightedNode || d.target.name === highlightedNode;
                    d3.select(this).attr("stroke-opacity", connected ? 0.65 : 0.05);
                } else {
                    d3.select(this).attr("stroke-opacity", 0.3);
                }
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

        // click node to highlight
        nodeEls.on("click", function (d) {
            if (highlightedNode === d.name) {
                highlightedNode = null;
                linkEls.attr("stroke-opacity", 0.3);
                svg.selectAll(".hl-label").remove();
            } else {
                highlightedNode = d.name;
                linkEls.attr("stroke-opacity", 0.05);
                linkEls.each(function (lnk) {
                    if (lnk.source.name === d.name || lnk.target.name === d.name) {
                        d3.select(this).attr("stroke-opacity", 0.65);
                    }
                });

                svg.selectAll(".hl-label").remove();
                svg.append("text")
                    .attr("class", "hl-label")
                    .attr("x", w / 2).attr("y", h - 8)
                    .attr("text-anchor", "middle")
                    .attr("fill", colors.accent)
                    .attr("font-size", "11px")
                    .attr("font-family", "sans-serif")
                    .text("Showing paths through: " + d.name + " (" + d.value + " students) — click again to reset");
            }
        });

        nodeEls.on("mouseover", function (d) {
            d3.select(this).attr("fill-opacity", 0.8);
            var pct = ((d.value / count) * 100).toFixed(1);
            var tt = document.getElementById("tooltip");
            tt.innerHTML = "<strong>" + d.name + "</strong><br>" + d.value + " students (" + pct + "%)";
            tt.style.opacity = 1;
        })
            .on("mousemove", function () {
                var tt = document.getElementById("tooltip");
                tt.style.left = (d3.event.pageX + 15) + "px";
                tt.style.top = (d3.event.pageY - 10) + "px";
            })
            .on("mouseout", function () {
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

        // column headers
        var headers = ["Caffeine Intake", "Sleep Duration", "Sleep Quality", "Screen Time"];
        var colX = [null, null, null, null];
        data.nodes.forEach(function (d) {
            var c = colMap[d.name];
            if (colX[c] === null) colX[c] = (d.x0 + d.x1) / 2;
        });
        for (var hi = 0; hi < headers.length; hi++) {
            if (colX[hi] === null) continue;
            g.append("text")
                .attr("x", colX[hi]).attr("y", -18)
                .attr("text-anchor", "middle")
                .attr("fill", colors.mutedText)
                .attr("font-size", "10px")
                .attr("font-family", "sans-serif")
                .text(headers[hi].toUpperCase());
        }

        // cycle arrow at the bottom
        var lastX = colX[3];
        var firstX = colX[0];
        if (lastX !== null && firstX !== null) {
            var ay = sHeight + 14;
            var startX = lastX + margin.left;
            var endX = firstX + margin.left;
            var baseY = sTop + margin.top + ay;
            var curveY = baseY + 18;

            svg.append("path")
                .attr("d", "M " + startX + " " + baseY + " Q " + (w / 2) + " " + curveY + " " + endX + " " + baseY)
                .attr("fill", "none")
                .attr("stroke", colors.hintText)
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "4,4")
                .attr("opacity", 0.5);

            // arrowhead
            svg.append("polygon")
                .attr("points",
                    endX + "," + baseY + " " +
                    (endX + 8) + "," + (baseY - 4) + " " +
                    (endX + 8) + "," + (baseY + 4))
                .attr("fill", colors.hintText)
                .attr("opacity", 0.5);

            svg.append("text")
                .attr("x", w / 2).attr("y", curveY + 14)
                .attr("text-anchor", "middle")
                .attr("fill", colors.hintText)
                .attr("font-size", "10px")
                .attr("font-style", "italic")
                .attr("font-family", "sans-serif")
                .text("the cycle repeats → more caffeine to compensate");
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

        // narrative text at the bottom
        function getMode(arr, fn) {
            var tmp = {};
            arr.forEach(function (d) {
                var v = fn(d);
                if (!tmp[v]) tmp[v] = 0;
                tmp[v]++;
            });
            var best = null;
            var bestN = 0;
            Object.keys(tmp).forEach(function (v) {
                if (tmp[v] > bestN) { bestN = tmp[v]; best = v; }
            });
            return { value: best, count: bestN };
        }

        var mCaff = getMode(filtered, function (d) { return d.caffBin; });
        var mSleep = getMode(filtered, function (d) { return d.sleepBin; });
        var mQual = getMode(filtered, function (d) { return d.qualBin; });
        var mScreen = getMode(filtered, function (d) { return d.screenBin; });

        var badSleep = mSleep.value === "< 5 hrs" || mSleep.value === "5-6 hrs";
        var badQual = mQual.value === "Poor" || mQual.value === "Fair";
        var hiScreen = mScreen.value === "High (3+h)";
        var hiCaff = mCaff.value === "High (4-5)" || mCaff.value === "Moderate (2-3)";
        var hasFilter = activeFilters.study !== null || activeFilters.activity !== null;

        var narr = "";
        if (!hasFilter) {
            narr = "Across all 500 students, the most common path flows through " + mCaff.value.toLowerCase() + " caffeine, " + mSleep.value + " of sleep, " + mQual.value.toLowerCase() + " quality, and " + mScreen.value.toLowerCase() + " screen time. Try the filters above to compare groups.";
        } else if (badQual && hiScreen) {
            narr = "Among this group, " + mQual.value.toLowerCase() + " sleep quality and " + mScreen.value.toLowerCase() + " screen time dominate — a pattern consistent with the sleepless cycle.";
        } else if (hiCaff && badSleep) {
            narr = "This group averages " + mCaff.value.toLowerCase() + " caffeine intake but most still only sleep " + mSleep.value + " — caffeine may not be compensating for lost rest.";
        } else if (!badQual && hiScreen) {
            narr = "Most in this group report " + mQual.value.toLowerCase() + " sleep quality despite " + mScreen.value.toLowerCase() + " screen time — suggesting screens alone may not determine sleep quality.";
        } else if (!badQual && !hiScreen) {
            narr = "This group trends toward " + mQual.value.toLowerCase() + " sleep quality and " + mScreen.value.toLowerCase() + " screen time — a pattern that suggests the cycle can be broken.";
        } else {
            narr = "This group's most common path: " + mCaff.value.toLowerCase() + " caffeine → " + mSleep.value + " sleep → " + mQual.value.toLowerCase() + " quality → " + mScreen.value.toLowerCase() + " screen time.";
        }

        svg.append("text")
            .attr("x", w / 2).attr("y", h - 24)
            .attr("text-anchor", "middle")
            .attr("fill", colors.labelText)
            .attr("font-size", "11px").attr("font-style", "italic")
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
window.addEventListener("resize", drawSankey);