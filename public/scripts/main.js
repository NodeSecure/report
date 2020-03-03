/* eslint-disable no-invalid-this */
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
    colorStart: 0.2, colorEnd: 0.8, useEndAsStart: false
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

function liPackageClick() {
    const dataValue = this.getAttribute("data-value");
    window.open(`https://www.npmjs.com/package/${dataValue}`, "_blank");
}

function nodeDepClick() {
    const dataValue = this.getAttribute("data-value");
    window.open(`https://nodejs.org/dist/latest/docs/api/${dataValue}.html`, "_blank");
}

document.addEventListener("DOMContentLoaded", () => {
    Chart.Legend.prototype.afterFit = function afterFit() {
        this.height += 15;
    };

    const avatarsElements = document.querySelectorAll(".avatar");
    for (const avatar of avatarsElements) {
        const email = avatar.getAttribute("data-email");
        const aElement = avatar.querySelector("a");

        const imgEl = document.createElement("img");
        imgEl.src = `https://gravatar.com/avatar/${md5(email)}?&d=404`;
        imgEl.onerror = () => {
            imgEl.src = "../public/img/avatar-default.png";
        };
        aElement.appendChild(imgEl);
    }

    const packagesList = document.querySelectorAll("ul.npm-packages-list li");
    for (const liElement of packagesList) {
        liElement.addEventListener("click", liPackageClick);
    }

    const nodeList = document.querySelectorAll("ul.node-list li");
    for (const liElement of nodeList) {
        liElement.addEventListener("click", nodeDepClick);
    }

    setTimeout(() => {
        window.isReadyForPDF = true;
    }, 1000);
});