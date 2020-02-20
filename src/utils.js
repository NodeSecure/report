/* eslint-disable max-depth */
"use strict";

// Require Node.js Dependencies
const { join, dirname, basename } = require("path");
const fs = require("fs");
const { mkdir, writeFile, readFile } = require("fs").promises;

// Require Third-party Dependencies
const Lock = require("@slimio/lock");
const git = require("isomorphic-git");
const parseAuthor = require("parse-author");
const { from, cwd } = require("nsecure");

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

function formatBytes(bytes, decimals) {
    if (bytes === 0) {
        return "0 B";
    }
    const dm = decimals <= 0 ? 0 : decimals || 2;
    const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const id = Math.floor(Math.log(bytes) / Math.log(1024));

    // eslint-disable-next-line
    return parseFloat((bytes / Math.pow(1024, id)).toFixed(dm)) + ' ' + sizes[id];
}

async function fetchStatsFromNsecurePayloads(payloadFiles = []) {
    const stats = {
        slimioPackagesCount: 0,
        thirdPartyPackagesCount: 0,
        allPackagesSize: 0,
        thirdSize: 0,
        slimioSize: 0,
        hasTransitiveDeps: new Set(),
        nodeCoreDep: new Set(),
        licenses: {
            Unknown: 0
        },
        extensions: {},
        authors: new Set(),
        packages: {}
    };

    for (const file of payloadFiles) {
        const buf = await readFile(file);

        /** @type {NodeSecure.Payload} */
        const nsecurePayload = JSON.parse(buf.toString());

        for (const [name, descriptor] of Object.entries(nsecurePayload)) {
            const { versions } = descriptor;
            const isThird = !name.startsWith("@slimio/");

            if (!(name in stats.packages)) {
                if (isThird) {
                    stats.thirdPartyPackagesCount++;
                }
                stats.packages[name] = { isThird, versions: new Set() };
            }

            const curr = stats.packages[name];
            for (const localVersion of versions) {
                if (curr.versions.has(localVersion)) {
                    continue;
                }
                const { size, composition, license, author } = descriptor[localVersion];

                stats.allPackagesSize += size;
                stats[isThird ? "thirdSize" : "slimioSize"] += size;
                composition.required_builtin.forEach((dep) => stats.nodeCoreDep.add(dep));
                for (const extName of composition.extensions.filter((extName) => extName !== "")) {
                    stats.extensions[extName] = Reflect.has(stats.extensions, extName) ? ++stats.extensions[extName] : 1;
                }

                if (typeof license === "string") {
                    stats.licenses.Unknown++;
                }
                else {
                    for (const licenseName of license.uniqueLicenseIds) {
                        stats.licenses[licenseName] = Reflect.has(stats.licenses, licenseName) ?
                            ++stats.licenses[licenseName] : 1;
                    }
                }

                const parsedAuthor = parseNsecureAuthor(author);
                if (parsedAuthor !== null && "email" in parsedAuthor) {
                    stats.authors.add(parsedAuthor.email);
                }

                curr.versions.add(localVersion);
                const hasIndirectDependencies = descriptor[localVersion].flags.hasIndirectDependencies;
                if (hasIndirectDependencies) {
                    stats.hasTransitiveDeps.add(`${name}@${localVersion}`);
                }
                curr[localVersion] = { hasIndirectDependencies };
            }
        }
    }

    // Calcule the number of internal dep!
    stats.slimioPackagesCount = Object.keys(stats.packages).length - stats.thirdPartyPackagesCount;

    return stats;
}

function parseNsecureAuthor(author) {
    if (author === "N/A") {
        return null;
    }
    if (typeof author === "string") {
        return parseAuthor(author);
    }
    if (typeof author.name !== "string") {
        return null;
    }

    return { name: author.name, email: author.email || null, url: author.url || null };
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
    fetchStatsFromNsecurePayloads,
    cloneGITRepository,
    formatBytes,
    nsecure: Object.freeze({
        onPackage, onLocalDirectory
    })
};
