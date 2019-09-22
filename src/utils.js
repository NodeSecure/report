"use strict";

// Require Node.js Dependencies
const { readFile } = require("fs").promises;

// Require Third-party Dependencies
const { yellow } = require("kleur");

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

module.exports = { linkPackages, stats };
