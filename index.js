/* eslint-disable max-depth */
"use strict";

require("dotenv").config();
require("make-promises-safe");

// Require Node.js Dependencies
const { join, dirname, basename } = require("path");
const fs = require("fs");
const { mkdir, writeFile, rmdir } = require("fs").promises;

// Require Third-party Dependencies
const Lock = require("@slimio/lock");
const Spinner = require("@slimio/async-cli-spinner");
const git = require("isomorphic-git");
const { from, cwd } = require("nsecure");
const { cyan, white, grey } = require("kleur");

// Require Internal Dependencies
const { linkPackages, stats } = require("./src/utils");

// Vars
const token = process.env.GIT_TOKEN;
const securityLock = new Lock({ maxConcurrent: 2 });
Spinner.DEFAULT_SPINNER = "dots";
git.plugins.set("fs", fs);

// CONSTANTS
const ORGA_URL = "https://github.com/SlimIO";
const CLONE_DIR = join(__dirname, "clones");
const JSON_DIR = join(__dirname, "json");
const NPM_ADDONS = [
    "@slimio/addon",
    "@slimio/scheduler",
    "@slimio/config",
    "@slimio/core",
    "@slimio/arg-parser",
    "@slimio/profiles",
    "@slimio/queue",
    "@slimio/sqlite-transaction",
    "@slimio/alert",
    "@slimio/metrics",
    "@slimio/units",
    "@slimio/ipc",
    "@slimio/safe-emitter"
];

const BUILTIN_ADDONS = [
    "Aggregator",
    "Alerting",
    "Socket",
    "Gate"
];

/**
 * @async
 * @function cloneRep
 * @param {!string} repName
 * @returns {Promise<string>}
 */
async function cloneRep(repName) {
    const dir = join(CLONE_DIR, repName);
    const url = `${ORGA_URL}/${repName}`;

    await git.clone({
        dir, url, token,
        singleBranch: true,
        oauth2format: "github"
    });

    return dir;
}

/**
 * @async
 * @function runSecure
 * @param {!string} packageName
 * @returns {Promise<string>}
 */
async function runSecurePackage(packageName) {
    await securityLock.acquireOne();

    try {
        const name = `${packageName}.json`;
        const payload = await from(packageName, {
            maxDepth: 4, verbose: false
        });

        const result = JSON.stringify(Object.fromEntries(payload), null, 2);
        const filePath = join(JSON_DIR, name);
        await mkdir(dirname(filePath), { recursive: true });
        await writeFile(filePath, result);

        return filePath;
    }
    catch (error) {
        return null;
    }
    finally {
        securityLock.freeOne();
    }
}

/**
 * @async
 * @function runSecureDir
 * @param {!string} dir
 * @returns {Promise<string>}
 */
async function runSecureDir(dir) {
    await securityLock.acquireOne();

    try {
        const name = `${basename(dir)}.json`;
        const payload = await cwd(dir, {
            maxDepth: 4, verbose: false
        });

        const result = JSON.stringify(Object.fromEntries(payload), null, 2);
        const filePath = join(JSON_DIR, name);
        await writeFile(filePath, result);

        return filePath;
    }
    catch (error) {
        return null;
    }
    finally {
        securityLock.freeOne();
    }
}

/**
 * @async
 * @function fetchPackagesStats
 * @returns {Map<string, any>}
 */
async function fetchPackagesStats() {
    const spinner = new Spinner({
        prefixText: white().bold("Fetching packages stats on nsecure")
    }).start();

    try {
        const jsonFiles = await Promise.all(NPM_ADDONS.map(runSecurePackage));

        const elapsed = `${spinner.elapsedTime.toFixed(2)}ms`;
        spinner.succeed(`Successfully done in ${cyan().bold(elapsed)}`);
        console.log("");

        return linkPackages(jsonFiles);
    }
    catch (error) {
        spinner.failed(error.message);
        throw error;
    }
}

/**
 * @async
 * @function main
 */
async function main() {
    await Promise.all([
        mkdir(JSON_DIR, { recursive: true }),
        mkdir(CLONE_DIR, { recursive: true })
    ]);

    const spinner = new Spinner({
        prefixText: white().bold("Clone and analyze built-in addons")
    }).start("clone repositories...");

    let builtInThird;
    try {
        const repos = await Promise.all(BUILTIN_ADDONS.map(cloneRep));
        spinner.text = "Run node-secure analyze";

        const jsonFiles = await Promise.all(repos.map(runSecureDir));

        const nMap = await linkPackages(jsonFiles.filter((value) => value !== null));
        const fStats = stats(nMap);
        spinner.succeed(`Successfully done in ${spinner.elapsedTime.toFixed(2)}ms`);

        console.log(grey().bold("\n----------------------------------"));
        console.log(white().bold("SlimIO built-in stats:\n"));
        console.log(`Number of Third-party npm packages: ${cyan().bold(fStats.external)}`);
        // eslint-disable-next-line prefer-template
        console.log(" - " + [...fStats.third].join("\n - "));
        builtInThird = fStats.third;

        console.log(`\nNumber of packages with transitive dependencies: ${cyan().bold(fStats.transitive.size)}`);
        // eslint-disable-next-line prefer-template
        console.log(" - " + [...fStats.transitive].join("\n - "));
        console.log("\n");
    }
    catch (error) {
        spinner.failed(error.message);
        throw error;
    }
    finally {
        await rmdir(CLONE_DIR, { recursive: true });
    }

    const pkgStats = await fetchPackagesStats();
    const fStats = stats(pkgStats);

    console.log(grey().bold("----------------------------------"));
    console.log(white().bold("SlimIO packages stats:\n"));
    console.log(`Number of SlimIO npm packages: ${cyan().bold(fStats.internal)}`);
    console.log(`Number of Third-party npm packages: ${cyan().bold(fStats.external)}`);
    console.log("List (with dedup filtered):");
    // eslint-disable-next-line prefer-template
    console.log(" - " + [...fStats.third].filter((name) => !builtInThird.has(name)).join("\n - "));

    console.log(`\nNumber of packages with transitive dependencies: ${cyan().bold(fStats.transitive.size)}`);
    // eslint-disable-next-line prefer-template
    console.log(" - " + [...fStats.transitive].join("\n - "));
}
main().catch(console.error);
