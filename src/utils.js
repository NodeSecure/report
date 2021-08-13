/* eslint-disable max-depth */
// Require Node.js Dependencies
import path from "path";
import fs, { promises } from "fs";
import { fileURLToPath } from "url";

// Require Third-party Dependencies
import Lock from "@slimio/lock";
import git from "isomorphic-git";
import http from "isomorphic-git/http/node/index.js";
import filenamify from "filenamify";
import { from, cwd } from "nsecure";

// Require Internal Dependencies
const config = JSON.parse(
    fs.readFileSync(new URL("../data/config.json", import.meta.url))
);

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLONE_DIR = path.join(__dirname, "..", "clones");
const JSON_DIR = path.join(__dirname, "..", "json");
// TODO get from nodesecure/flags
const kWantedFlags = new Set([
    "isDeprecated",
    "hasMultipleLicenses",
    "hasMinifiedCode",
    "hasCustomResolvers",
    "hasExternalCapacity",
    "hasMissingOrUnusedDependency",
    "hasOutdatedDependency",
    "hasScript",
    "hasBannedFile"
]);
const kFlagConverter = Object.freeze({
    isDeprecated: "⛔️",
    hasMultipleLicenses: "📚",
    hasMinifiedCode: "🔬",
    hasCustomResolvers: "💎",
    hasExternalCapacity: "🌍",
    hasMissingOrUnusedDependency: "👀",
    hasOutdatedDependency: "⌚️",
    hasScript: "📦",
    hasBannedFile: "⚔️"
});

// VARS
const token = process.env.GIT_TOKEN;
const securityLock = new Lock({ maxConcurrent: 2 });

function formatBytes(bytes, decimals) {
    if (bytes === 0) {
        return "0 B";
    }
    const dm = decimals <= 0 ? 0 : decimals || 2;
    const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const id = Math.floor(Math.log(bytes) / Math.log(1024));

    return parseFloat((bytes / Math.pow(1024, id)).toFixed(dm)) + " " + sizes[id];
}

export async function fetchStatsFromNsecurePayloads(payloadFiles = []) {
    const stats = {
        size: {
            all: 0, internal: 0, external: 0
        },
        deps: {
            transitive: new Set(),
            node: new Set()
        },
        licenses: {
            Unknown: 0
        },
        flags: {},
        extensions: {},
        warnings: {},
        authors: {},
        packages: {},
        packages_count: {
            all: 0, internal: 0, external: 0
        }
    };

    for (const file of payloadFiles) {
        const buf = await promises.readFile(file);

        /** @type {NodeSecure.Payload} */
        const nsecurePayload = JSON.parse(buf.toString());

        for (const [name, descriptor] of Object.entries(nsecurePayload)) {
            const { versions, metadata } = descriptor;
            const isThird = config.npm_org_prefix === null ? true : !name.startsWith(`${config.npm_org_prefix}/`);

            for (const human of metadata.maintainers) {
                stats.authors[human.email] = Reflect.has(stats.authors, human.email) ? ++stats.authors[human.email] : 1;
            }

            if (!(name in stats.packages)) {
                if (isThird) {
                    stats.packages_count.external++;
                }
                stats.packages[name] = { isThird, versions: new Set() };
            }

            const curr = stats.packages[name];
            for (const localVersion of versions) {
                if (curr.versions.has(localVersion)) {
                    continue;
                }
                const { flags, size, composition, license, author, warnings = [] } = descriptor[localVersion];

                stats.size.all += size;
                stats.size[isThird ? "external" : "internal"] += size;

                for (const { kind } of warnings) {
                    stats.warnings[kind] = Reflect.has(stats.warnings, kind) ? ++stats.warnings[kind] : 1;
                }

                for (const [flagName, boolValue] of Object.entries(flags)) {
                    if (!kWantedFlags.has(flagName) || !boolValue) {
                        continue;
                    }
                    const cFlagName = kFlagConverter[flagName];
                    stats.flags[cFlagName] = Reflect.has(stats.flags, cFlagName) ? ++stats.flags[cFlagName] : 1;
                }

                (composition.required_builtin || composition.required_nodejs)
                    .forEach((dep) => stats.deps.node.add(dep));
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
                    stats.authors[parsedAuthor.email] = Reflect.has(stats.authors, parsedAuthor.email) ?
                        ++stats.authors[parsedAuthor.email] : 1;
                }

                curr.versions.add(localVersion);
                const hasIndirectDependencies = descriptor[localVersion].flags.hasIndirectDependencies;
                id: if (hasIndirectDependencies) {
                    if (!config.include_transitive_internal && name.startsWith(config.npm_org_prefix)) {
                        break id;
                    }

                    stats.deps.transitive.add(`${name}@${localVersion}`);
                }
                curr[localVersion] = { hasIndirectDependencies };
            }
        }
    }

    stats.packages_count.all = Object.keys(stats.packages).length;
    stats.packages_count.internal = stats.packages_count.all - stats.packages_count.external;
    stats.size.all = formatBytes(stats.size.all);
    stats.size.internal = formatBytes(stats.size.internal);
    stats.size.external = formatBytes(stats.size.external);

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

function authorRegex() {
    return /^([^<(]+?)?[ \t]*(?:<([^>(]+?)>)?[ \t]*(?:\(([^)]+?)\)|$)/gm;
}

function parseAuthor(str) {
    if (typeof str !== "string") {
        throw new TypeError("expected author to be a string");
    }

    if (!str || !/\w/.test(str)) {
        return {};
    }

    const match = authorRegex().exec(str);
    if (!match) {
        return {};
    }
    const author = Object.create(null);

    if (match[1]) {
        author.name = match[1];
    }

    for (let id = 2; id < match.length; id++) {
        const val = match[id] || "";

        if (val.includes("@")) {
            author.email = val;
        }
        else if (val.includes("http")) {
            author.url = val;
        }
    }

    return author;
}

/**
 * @async
 * @function cloneGITRepository
 * @description clone a given repository from github
 * @param {!string} repositoryName
 * @returns {Promise<string>}
 */
export async function cloneGITRepository(repositoryName) {
    const dir = path.join(CLONE_DIR, repositoryName);
    const url = `${config.git_url}/${repositoryName}.git`;

    await git.clone({
        fs, http, dir, url, token, singleBranch: true, oauth2format: "github"
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
export async function onPackage(packageName) {
    await securityLock.acquireOne();

    try {
        const name = `${packageName}.json`;
        const { dependencies } = await from(packageName, {
            maxDepth: 4, verbose: false
        });

        const filePath = join(JSON_DIR, name);
        await promises.mkdir(dirname(filePath), { recursive: true });
        await promises.writeFile(filePath, JSON.stringify(dependencies, null, 2));

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
export async function onLocalDirectory(dir) {
    await securityLock.acquireOne();

    try {
        const name = `${basename(dir)}.json`;
        const { dependencies } = await cwd(dir, {
            maxDepth: 4, verbose: false, usePackageLock: false
        });

        const filePath = join(JSON_DIR, name);
        await promises.writeFile(filePath, JSON.stringify(dependencies, null, 2));

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
 * @function cleanReportName
 * @description clean the report name
 * @param {!string} name
 * @param {string} [format=null]
 * @returns {string}
 */
export function cleanReportName(name, format = null) {
    const cleanName = filenamify(name);
    if (format === null) {
        return cleanName;
    }

    return path.extname(cleanName) === format ? cleanName : `${cleanName}${format}`;
}

export const nsecure = Object.freeze({
    onPackage, onLocalDirectory
});
