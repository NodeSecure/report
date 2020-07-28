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
const { cloneGITRepository, fetchStatsFromNsecurePayloads, nsecure } = require("./src/utils");
const { generatePDF } = require("./src/pdf");
const config = require("./data/config.json");

// CONSTANTS
const CLONE_DIR = join(__dirname, "clones");
const JSON_DIR = join(__dirname, "json");
const VIEWS_DIR = join(__dirname, "views");
const REPORTS_DIR = join(__dirname, "reports");

// VARS
const createChart = taggedString`\tcreateChart("${0}", { labels: [${1}], interpolate: ${3}, data: [${2}] });`;

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

function transformGraphData(obj) {
    return Object.entries(obj).map(([key, value]) => `"${key}:${value}"`).join(",");
}

// eslint-disable-next-line max-params
function toChart(baliseName, data, interpolateName) {
    return createChart(baliseName, transformGraphData(data), Object.values(data).join(","), interpolateName);
}

async function main() {
    await Promise.all([
        mkdir(JSON_DIR, { recursive: true }),
        mkdir(CLONE_DIR, { recursive: true }),
        mkdir(REPORTS_DIR, { recursive: true })
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

        const HTMLTemplateStr = await readFile(join(VIEWS_DIR, "template.html"), "utf8");
        const templateGenerator = compile(HTMLTemplateStr);
        const charts = [];
        if (pkgStats !== null) {
            charts.push(
                toChart("npm_extension_canvas", pkgStats.extensions, "d3.interpolateRainbow"),
                toChart("npm_license_canvas", pkgStats.licenses, "d3.interpolateCool"),
                toChart("npm_warnings_canvas", pkgStats.warnings, "d3.interpolateInferno"),
                toChart("npm_flags_canvas", pkgStats.flags, "d3.interpolateWarm")
            );
        }
        if (repoStats !== null) {
            charts.push(
                toChart("git_extension_canvas", repoStats.extensions, "d3.interpolateRainbow"),
                toChart("git_license_canvas", repoStats.licenses, "d3.interpolateCool"),
                toChart("git_warnings_canvas", repoStats.warnings, "d3.interpolateInferno"),
                toChart("git_flags_canvas", repoStats.flags, "d3.interpolateWarm")
            );
        }

        const templatePayload = {
            report_title: config.report_title,
            report_logo: config.report_logo,
            report_date: generationDate,
            npm_stats: pkgStats,
            git_stats: repoStats
        };
        const HTMLReport = templateGenerator(templatePayload)
            .concat(`\n<script>\ndocument.addEventListener("DOMContentLoaded", () => {\n${charts.join("\n")}\n});\n</script>`);

        const reportHTMLPath = join(REPORTS_DIR, "report.html");
        await writeFile(reportHTMLPath, HTMLReport);
        await new Promise((resolve) => setTimeout(resolve, 100));
        console.log("HTML Report writted on disk!");

        await generatePDF(reportHTMLPath);
        console.log("Report sucessfully generated!");
    }
    finally {
        await new Promise((resolve) => setTimeout(resolve, 100));
        await rmdir(CLONE_DIR, { recursive: true });
    }
}
main().catch(console.error);

