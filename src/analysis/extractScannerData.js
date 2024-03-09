/* eslint-disable max-depth */
// Import Node.js Dependencies
import fs from "fs/promises";

// Import Third-party Dependencies
import { formatBytes } from "@nodesecure/utils";
import * as Flags from "@nodesecure/flags";
import * as scorecard from "@nodesecure/ossf-scorecard-sdk";

// Import Internal Dependencies
import * as localStorage from "../localStorage.js";
import { getScoreColor } from "../utils.js";

// CONSTANTS
const kWantedFlags = Flags.getFlags();

export async function buildStatsFromNsecurePayloads(payloadFiles = []) {
  const config = localStorage.getConfig().report;
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
    },
    scorecards: {}
  };

  for (const file of payloadFiles) {
    const buf = await fs.readFile(file);

    /** @type {NodeSecure.Payload} */
    const nsecurePayload = JSON.parse(buf.toString());

    for (const [name, descriptor] of Object.entries(nsecurePayload)) {
      const { versions, metadata } = descriptor;
      const isThird = config.npm.organizationPrefix === null ? true : !name.startsWith(`${config.npm.organizationPrefix}/`);

      for (const human of metadata.maintainers) {
        stats.authors[human.email] = human.email in stats.authors ? ++stats.authors[human.email] : 1;
      }

      if (!(name in stats.packages)) {
        const isGiven = config.npm?.packages.includes(name);
        const fullName = isGiven ? `${config.npm.organizationPrefix}/${name}` : name;
        if (isThird) {
          stats.packages_count.external++;
        }
        stats.packages[name] = { isThird, versions: new Set(), fullName, isGiven };
      }

      const curr = stats.packages[name];
      for (const [localVersion, localDescriptor] of Object.entries(versions)) {
        if (curr.versions.has(localVersion)) {
          continue;
        }
        const { flags, size, composition, license, author, warnings = [] } = localDescriptor;

        stats.size.all += size;
        stats.size[isThird ? "external" : "internal"] += size;

        for (const { kind } of warnings) {
          stats.warnings[kind] = kind in stats.warnings ? ++stats.warnings[kind] : 1;
        }

        for (const flag of flags) {
          if (!kWantedFlags.has(flag)) {
            continue;
          }
          stats.flags[flag] = flag in stats.flags ? ++stats.flags[flag] : 1;
        }

        (composition.required_builtin || composition.required_nodejs)
          .forEach((dep) => stats.deps.node.add(dep));
        for (const extName of composition.extensions.filter((extName) => extName !== "")) {
          stats.extensions[extName] = extName in stats.extensions ? ++stats.extensions[extName] : 1;
        }

        if (typeof license === "string") {
          stats.licenses.Unknown++;
        }
        else {
          for (const licenseName of license.uniqueLicenseIds) {
            stats.licenses[licenseName] = licenseName in stats.licenses ?
              ++stats.licenses[licenseName] : 1;
          }
        }

        if (author?.email) {
          stats.authors[author.email] = author.email in stats.authors ?
            ++stats.authors[author.email] : 1;
        }

        curr.versions.add(localVersion);
        const hasIndirectDependencies = flags.includes("hasIndirectDependencies");
        id: if (hasIndirectDependencies) {
          if (!config.includeTransitiveInternal && name.startsWith(config.npm.organizationPrefix)) {
            break id;
          }

          stats.deps.transitive.add(`${name}@${localVersion}`);
        }
        curr[localVersion] = { hasIndirectDependencies };
      }
    }
  }

  const givenPackages = Object.values(stats.packages).filter((pkg) => pkg.isGiven);

  await Promise.all(givenPackages.map(async(pkg) => {
    const { fullName } = pkg;
    const { score } = await scorecard.result(fullName, { resolveOnVersionControl: false });
    stats.scorecards[fullName] = {
      score,
      color: getScoreColor(score)
    };
  }));

  stats.packages_count.all = Object.keys(stats.packages).length;
  stats.packages_count.internal = stats.packages_count.all - stats.packages_count.external;
  stats.size.all = formatBytes(stats.size.all);
  stats.size.internal = formatBytes(stats.size.internal);
  stats.size.external = formatBytes(stats.size.external);

  return stats;
}

