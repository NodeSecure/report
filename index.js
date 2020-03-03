/* eslint-disable max-depth */
"use strict";

require("dotenv").config();
require("make-promises-safe");

// Require Node.js Dependencies
const { join } = require("path");
const { mkdir, rmdir, readFile, writeFile } = require("fs").promises;

// Require Third-party Dependencies
const { cyan, white } = require("kleur");
const Spinner = require("@slimio/async-cli-spinner");
Spinner.DEFAULT_SPINNER = "dots";
const compile = require("zup");

// Require Internal Dependencies
const { cloneGITRepository, fetchStatsFromNsecurePayloads, nsecure } = require("./src/utils");
const config = require("./data/config.json");

// CONSTANTS
const CLONE_DIR = join(__dirname, "clones");
const JSON_DIR = join(__dirname, "json");
const VIEWS_DIR = join(__dirname, "views");
const REPORTS_DIR = join(__dirname, "reports");

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
        spinner.succeed(`Successfully done in ${spinner.elapsedTime.toFixed(2)}ms`);

        return fetchStatsFromNsecurePayloads(jsonFiles.filter((value) => value !== null));
    }
    catch (error) {
        spinner.failed(error.message);
        throw error;
    }
}

async function main() {
    await Promise.all([
        mkdir(JSON_DIR, { recursive: true }),
        mkdir(CLONE_DIR, { recursive: true })
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

        // console.log(generationDate);
        const pkgStats = await fetchPackagesStats();
        // const repoStats = await fetchRepositoriesStats();

        // console.log(JSON.stringify(pkgStats, null, 4));
        // console.log(repoStats);

        const HTMLTemplateStr = await readFile(join(VIEWS_DIR, "template.html"), "utf8");

        const templateGenerator = compile(HTMLTemplateStr);
        const templatePayload = {
            report_title: config.report_title,
            report_logo: config.report_logo,
            report_date: generationDate,
            ...pkgStats
        };
        console.log(templatePayload);
        const HTMLReport = templateGenerator(templatePayload);

        await writeFile(join(REPORTS_DIR, "report.html"), HTMLReport);
    }
    finally {
        await new Promise((resolve) => setTimeout(resolve, 100));
        await rmdir(CLONE_DIR, { recursive: true });
    }
}
main().catch(console.error);

