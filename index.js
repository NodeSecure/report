/* eslint-disable max-depth */
"use strict";

require("dotenv").config();
require("make-promises-safe");

// Require Node.js Dependencies
const fs = require("fs");
const { join, basename } = require("path");
const { mkdir, writeFile, readFile } = require("fs").promises;

// Require Third-party Dependencies
const Lock = require("@slimio/lock");
const nsecure = require("nsecure");
const git = require("isomorphic-git");
const premove = require("premove");

// Vars
git.plugins.set("fs", fs);
const securityLock = new Lock({ maxConcurrent: 1 });
const token = process.env.GIT_TOKEN;

// CONSTANTS
const ORGA_URL = "https://github.com/SlimIO";
const CLONE_DIR = join(__dirname, "clones");
const JSON_DIR = join(__dirname, "json");
const TOFETCH = [
    "Addon",
    "Scheduler",
    "Config"
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
 * @param {!string} dir
 * @returns {Promise<string>}
 */
async function runSecure(dir) {
    await securityLock.acquireOne();

    try {
        const name = `${basename(dir)}.json`;
        const payload = await nsecure(dir, {
            maxDepth: 4, verbose: false
        });

        const result = JSON.stringify(Object.fromEntries(payload), null, 2);
        const filePath = join(JSON_DIR, name);
        await writeFile(filePath, result);

        return filePath;
    }
    catch (error) {
        console.error(error);

        return null;
    }
    finally {
        securityLock.freeOne();
    }
}

/**
 * @async
 * @function main
 */
async function main() {
    await Promise.all([
        mkdir(CLONE_DIR, { recursive: true }),
        mkdir(JSON_DIR, { recursive: true })
    ]);

    try {
        const dirs = await Promise.all(TOFETCH.map(cloneRep));
        console.log("all clone successfully done!");

        const jsonFiles = await Promise.all(dirs.map(runSecure));
        console.log("security analysis done!");
        const pkgStats = new Map();

        for (const file of jsonFiles) {
            console.log(file);
            const buf = await readFile(file);
            const stats = JSON.parse(buf.toString());

            for (const [name, descriptor] of Object.entries(stats)) {
                const { versions } = descriptor;

                if (pkgStats.has(name)) {
                    const curr = pkgStats.get(name);
                    versions.forEach((version) => curr.versions.add(version));
                }
                else {
                    const ref = { versions: new Set(versions) };
                    for (const lVer of versions) {
                        const hasIndirectDependencies = descriptor[lVer].flags.hasIndirectDependencies;
                        ref[lVer] = {
                            hasIndirectDependencies
                        };
                    }

                    pkgStats.set(name, ref);
                }
            }
        }

        console.log(pkgStats);
    }
    finally {
        await premove(CLONE_DIR);
    }
}
main().catch(console.error);
