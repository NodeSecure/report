/* eslint-disable max-depth */
"use strict";

require("dotenv").config();
require("make-promises-safe");

// Require Node.js Dependencies
const { join } = require("path");
const { mkdir, rmdir, readFile, writeFile } = require("fs").promises;

// Require Third-party Dependencies
const { cyan, white } = require("kleur");
const { taggedString } = require("@slimio/utils");
const compile = require("zup");
const Spinner = require("@slimio/async-cli-spinner");
Spinner.DEFAULT_SPINNER = "dots";

// Require Internal Dependencies
const { cloneGITRepository, fetchStatsFromNsecurePayloads, nsecure, cleanReportName } = require("./src/utils");
const { generatePDF } = require("./src/pdf");
const config = require("./data/config.json");

// CONSTANTS
const kCloneDir = join(__dirname, "clones");
const kJsonDir = join(__dirname, "json");
const kViewsDir = join(__dirname, "views");
const kReportsDir = join(__dirname, "reports");
const kChartTemplate = taggedString`\tcreateChart("${0}", "${4}", { labels: [${1}], interpolate: ${3}, data: [${2}] });`;

async function fetchPackagesStats() {
    const spinner = new Spinner({
        prefixText: white().bold("Fetching packages stats on nsecure")
    }).start();

    try {
        const jsonFiles = await Promise.all(config.npm_packages.map(nsecure.onPackage));
        const elapsed = `${spinner.elapsedTime.toFixed(2)}ms`;
        spinner.succeed(`Successfully done in ${cyan().bold(elapsed)}`);

        return fetchStatsFromNsecurePayloads(jsonFiles.filter((value) => value !== null));
    }
    catch (error) {
        spinner.failed(error.message);
        throw error;
    }
}

async function fetchRepositoriesStats() {
    const spinner = new Spinner({
        prefixText: white().bold("Clone and analyze built-in addons")
    }).start("clone repositories...");

    try {
        const repos = await Promise.all(config.git_repositories.map(cloneGITRepository));
        spinner.text = "Run node-secure analyze";

        const jsonFiles = await Promise.all(repos.map(nsecure.onLocalDirectory));
        const elapsed = `${spinner.elapsedTime.toFixed(2)}ms`;
        spinner.succeed(`Successfully done in ${cyan().bold(elapsed)}`);

        return fetchStatsFromNsecurePayloads(jsonFiles.filter((value) => value !== null));
    }
    catch (error) {
        spinner.failed(error.message);
        throw error;
    }
}

// eslint-disable-next-line max-params
function toChart(baliseName, data, interpolateName, type = "bar") {
    const graphLabels = Object.keys(data).map((key) => `"${key}"`).join(",");

    return kChartTemplate(baliseName, graphLabels, Object.values(data).join(","), interpolateName, type);
}

function generateChartArray(pkgStats, repoStats) {
    const charts = [];
    const displayableCharts = config.charts.filter((chart) => chart.display);

    if (pkgStats !== null) {
        for (const chart of displayableCharts) {
            const name = chart.name.toLowerCase();
            charts.push(toChart(`npm_${name}_canvas`, pkgStats[name], chart.interpolation, chart.type));
        }
    }
    if (repoStats !== null) {
        for (const chart of displayableCharts) {
            const name = chart.name.toLowerCase();
            charts.push(toChart(`git_${name}_canvas`, repoStats[name], chart.interpolation, chart.type));
        }
    }

    return charts;
}

async function main() {
    await Promise.all([
        mkdir(kJsonDir, { recursive: true }),
        mkdir(kCloneDir, { recursive: true }),
        mkdir(kReportsDir, { recursive: true })
    ]);

    try {
        // eslint-disable-next-line new-cap
        const generationDate = Intl.DateTimeFormat("en-GB", {
            day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "numeric", second: "numeric"
        }).format(new Date());

        const pkgStats = await (config.npm_packages.length === 0 ? Promise.resolve(null) : fetchPackagesStats());
        const repoStats = await (config.git_repositories.length === 0 ? Promise.resolve(null) : fetchRepositoriesStats());
        if (pkgStats === null && repoStats === null) {
            console.log("No git repositories and no npm packages to fetch in the local configuration!");
            process.exit(0);
        }

        console.log("Start generating template!");
        const HTMLTemplateStr = await readFile(join(kViewsDir, "template.html"), "utf8");
        const templateGenerator = compile(HTMLTemplateStr);

        const templatePayload = {
            report_title: config.report_title,
            report_logo: config.report_logo,
            report_date: generationDate,
            npm_stats: pkgStats,
            git_stats: repoStats,
            charts: config.charts.filter((chart) => chart.display).map((chart) => chart.name)
        };

        const charts = generateChartArray(pkgStats, repoStats);
        const HTMLReport = templateGenerator(templatePayload)
            .concat(`\n<script>\ndocument.addEventListener("DOMContentLoaded", () => {\n${charts.join("\n")}\n});\n</script>`);

        const reportHTMLPath = join(kReportsDir, cleanReportName(config.report_title, ".html"));
        await writeFile(reportHTMLPath, HTMLReport);
        await new Promise((resolve) => setTimeout(resolve, 100));
        console.log("HTML Report writted on disk!");

        await generatePDF(reportHTMLPath);
        console.log("Report sucessfully generated!");
    }
    finally {
        await new Promise((resolve) => setTimeout(resolve, 100));
        await rmdir(kCloneDir, { recursive: true });
        process.exit(0);
    }
}
main().catch(console.error);

