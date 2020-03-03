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
const createChart = taggedString`\tcreateChart("${0}", "${1}", { labels: [${2}], interpolate: ${4}, data: [${3}] });`;

async function fetchPackagesStats() {
    const spinner = new Spinner({
        prefixText: white().bold("Fetching packages stats on nsecure")
    }).start();

    try {
        const jsonFiles = await Promise.all(config.npm_packages.map(nsecure.onPackage));
        const elapsed = `${spinner.elapsedTime.toFixed(2)}ms`;
        spinner.succeed(`Successfully done in ${cyan().bold(elapsed)}`);

        return fetchStatsFromNsecurePayloads(jsonFiles);
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

async function main() {
    await Promise.all([
        mkdir(JSON_DIR, { recursive: true }),
        mkdir(CLONE_DIR, { recursive: true }),
        mkdir(REPORTS_DIR, { recursive: true })
    ]);

    try {
        // eslint-disable-next-line new-cap
        const generationDate = Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric"
        }).format(new Date());

        const pkgStats = await fetchPackagesStats();
        const repoStats = await (config.git_repositories.length === 0 ? Promise.resolve(null) : fetchRepositoriesStats());

        const HTMLTemplateStr = await readFile(join(VIEWS_DIR, "template.html"), "utf8");

        const templateGenerator = compile(HTMLTemplateStr);
        const charts = [
            createChart("npm_extension_canvas", "Extensions",
                transformGraphData(pkgStats.extensions),
                Object.values(pkgStats.extensions).join(","),
                "d3.interpolateInferno"),
            createChart("npm_license_canvas", "Licenses",
                transformGraphData(pkgStats.licenses),
                Object.values(pkgStats.licenses).join(","),
                "d3.interpolateCool")
        ];
        if (repoStats !== null) {
            charts.push(createChart("git_extension_canvas", "Extensions",
                transformGraphData(repoStats.extensions),
                Object.values(repoStats.extensions).join(","),
                "d3.interpolateInferno"),
            createChart("git_license_canvas", "Licenses",
                transformGraphData(repoStats.licenses),
                Object.values(repoStats.licenses).join(","),
                "d3.interpolateCool"));
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

