"use strict";

const kChartOptions = {
    legend: {
        padding: 20,
        labels: {
            fontColor: "white",
            fontFamily: "mononoki",
            fontSize: 16,
            padding: 10
        }
    }
};

const colorRangeInfo = {
    colorStart: 0.2, colorEnd: 1, useEndAsStart: false
};

// https://github.com/d3/d3-scale-chromatic/blob/master/README.md
function calculatePoint(id, intervalSize, { colorStart, colorEnd, useEndAsStart }) {
    return (useEndAsStart ? (colorEnd - (id * intervalSize)) : (colorStart + (id * intervalSize)));
}

function* interpolateColors(dataLength, scale, range) {
    const intervalSize = (range.colorEnd - range.colorStart) / dataLength;

    for (let id = 0; id < dataLength; id++) {
        yield scale(calculatePoint(id, intervalSize, range));
    }
}

function createChart(elementId, chartTitle, payload = {}) {
    const { labels, data, interpolate = d3.interpolateCool } = payload;

    new Chart(document.getElementById(elementId).getContext("2d"), {
        type: "pie",
        data: {
            labels,
            datasets: [{
                label: chartTitle,
                borderWidth: 0,
                backgroundColor: [...interpolateColors(labels.length, interpolate, colorRangeInfo)],
                data
            }]
        },
        options: kChartOptions
    });
}

document.addEventListener("DOMContentLoaded", () => {
    Chart.Legend.prototype.afterFit = function afterFit() {
        this.height += 15;
    };

    createChart("myChartEx", "Extensions", {
        labels: [".yml:2", ".md:14", ".js:14", ".json:14", ".ts:9", ".toml:2"],
        interpolate: d3.interpolateInferno,
        data: [2, 14, 14, 14, 9, 2]
    });

    createChart("myChartLi", "Licenses", {
        labels: ["MIT:14", "ISC:10", "BSD-2-Clause:2", "Unknown:2"],
        data: [14, 10, 2, 2]
    });

    setTimeout(() => {
        window.isReadyForPDF = true;
    }, 1000);
});
