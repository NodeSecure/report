/* eslint-disable max-depth */
"use strict";

require("dotenv").config();
require("make-promises-safe");

// Require Node.js Dependencies
const { join, dirname } = require("path");
const { mkdir, writeFile, readFile } = require("fs").promises;

// Require Third-party Dependencies
const Lock = require("@slimio/lock");
const Spinner = require("@slimio/async-cli-spinner");
const { from } = require("nsecure");
const { cyan, yellow, white } = require("kleur");

// Vars
const securityLock = new Lock({ maxConcurrent: 2 });
Spinner.DEFAULT_SPINNER = "dots";

// CONSTANTS
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

/**
 * @async
 * @function runSecure
 * @param {!string} packageName
 * @returns {Promise<string>}
 */
async function runSecure(packageName) {
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
    await mkdir(JSON_DIR, { recursive: true });

    const spinner = new Spinner().start(white().bold("Fetching all repositories with nsecure..."));
    const jsonFiles = await Promise.all(NPM_ADDONS.map(runSecure));
    const elapsed = `${spinner.elapsedTime.toFixed(2)}ms`;
    spinner.succeed(`Successfully fetched in ${cyan().bold(elapsed)}`);
    console.log("");

    const pkgStats = new Map();
    for (const file of jsonFiles) {
        const buf = await readFile(file);
        const stats = JSON.parse(buf.toString());

        for (const [name, descriptor] of Object.entries(stats)) {
            const { versions } = descriptor;

            if (pkgStats.has(name)) {
                const curr = pkgStats.get(name);

                for (const lVer of versions) {
                    curr.versions.add(lVer);
                    const hasIndirectDependencies = descriptor[lVer].flags.hasIndirectDependencies;
                    curr[lVer] = {
                        hasIndirectDependencies
                    };
                }
            }
            else {
                const ref = {
                    internal: name.startsWith("@slimio/"),
                    versions: new Set(versions)
                };

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

    let internalPkgCount = 0;
    const pkgWithTransitiveDeps = new Set();
    const thirdPartyPackages = new Set();
    for (const [name, pkg] of pkgStats.entries()) {
        if (pkg.internal) {
            internalPkgCount++;
            continue;
        }

        thirdPartyPackages.add(name);
        for (const version of pkg.versions) {
            if (pkg[version].hasIndirectDependencies) {
                pkgWithTransitiveDeps.add(yellow().bold(`${name}@${version}`));
            }
        }
    }
    const externalPkgCount = pkgStats.size - internalPkgCount;

    console.log(`Number of SlimIO npm packages: ${cyan().bold(internalPkgCount)}`);
    console.log(`Number of Third-party npm packages: ${cyan().bold(externalPkgCount)}`);
    // eslint-disable-next-line prefer-template
    console.log(" - " + [...thirdPartyPackages].join("\n - "));

    console.log(`\nNumber of packages with transitive dependencies: ${cyan().bold(pkgWithTransitiveDeps.size)}`);
    // eslint-disable-next-line prefer-template
    console.log(" - " + [...pkgWithTransitiveDeps].join("\n - "));
}
main().catch(console.error);
