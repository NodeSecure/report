"use strict";

// Require Node.js Dependencies
const { readFile } = require("fs").promises;

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

                result.set(name, ref);
            }
        }
    }

    return result;
}

module.exports = { linkPackages };
