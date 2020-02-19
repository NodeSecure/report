"use strict";

// Require Node.js Dependencies
const { join, dirname, basename } = require("path");
const fs = require("fs");
const { mkdir, writeFile, readFile } = require("fs").promises;

// Require Third-party Dependencies
const Lock = require("@slimio/lock");
const git = require("isomorphic-git");
const { from, cwd } = require("nsecure");
const { yellow } = require("kleur");

// Require Internal Dependencies
const config = require("../data/config.json");

// CONSTANTS
const ORGA_URL = `https://github.com/${config.ORG}`;
const CLONE_DIR = join(__dirname, "..", "clones");
const JSON_DIR = join(__dirname, "..", "json");

// VARS
const token = process.env.GIT_TOKEN;
const securityLock = new Lock({ maxConcurrent: 2 });
git.plugins.set("fs", fs);

/**
 * @async
 * @function linkPackages
 * @param {string[]} files
 * @returns {Map<string, any>}
 */
async function linkPackages(files) {
    const result = new Map();

    for (const file of files) {
        const buf = await readFile(file);
        const stats = JSON.parse(buf.toString());

        for (const [name, descriptor] of Object.entries(stats)) {
            const { versions } = descriptor;

            if (result.has(name)) {
                const curr = result.get(name);

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

                result.set(name, ref);
            }
        }
    }

    return result;
}

/**
 * @function stats
 * @param {*} stats
 * @returns {object}
 */
function stats(stats) {
    const ref = { internal: 0, external: 0 };
    const third = new Set();
    const transitive = new Set();

    for (const [name, pkg] of stats.entries()) {
        if (pkg.internal) {
            ref.internal++;
            continue;
        }

        third.add(name);
        for (const version of pkg.versions) {
            if (pkg[version].hasIndirectDependencies) {
                transitive.add(yellow().bold(`${name}@${version}`));
            }
        }
    }
    ref.external = stats.size - ref.internal;

    return Object.assign({ third, transitive }, ref);
}

/**
 * @async
 * @function cloneGITRepository
 * @description clone a given repository from github
 * @param {!string} repositoryName
 * @returns {Promise<string>}
 */
async function cloneGITRepository(repositoryName) {
    const dir = join(CLONE_DIR, repositoryName);
    const url = `${ORGA_URL}/${repositoryName}`;

    await git.clone({
        dir, url, token, singleBranch: true, oauth2format: "github"
    });

    return dir;
}

/**
 * @async
 * @function onPackage
 * @description run nsecure on a given npm package (on the npm registry).
 * @param {!string} packageName
 * @returns {Promise<string>}
 */
async function onPackage(packageName) {
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
 * @function onLocalDirectory
 * @description run nsecure on a local directory
 * @param {!string} dir
 * @returns {Promise<string>}
 */
async function onLocalDirectory(dir) {
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

module.exports = {
    linkPackages,
    stats,
    cloneGITRepository,
    nsecure: Object.freeze({
        onPackage, onLocalDirectory
    })
};
