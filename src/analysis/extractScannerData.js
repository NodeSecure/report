/* eslint-disable max-depth */
// Import Node.js Dependencies
import fs from "node:fs";

// Import Third-party Dependencies
import { formatBytes, getScoreColor, getVCSRepositoryPathAndPlatform } from "@nodesecure/utils";
import * as Flags from "@nodesecure/flags";
import * as scorecard from "@nodesecure/ossf-scorecard-sdk";

// Import Internal Dependencies
import * as localStorage from "../localStorage.js";

// CONSTANTS
const kFlagsList = Object.values(Flags.getManifest());
const kWantedFlags = Flags.getFlags();
const kScorecardVisualizerUrl = `https://kooltheba.github.io/openssf-scorecard-api-visualizer/#/projects`;
const kNodeVisualizerUrl = `https://nodejs.org/dist/latest/docs/api`;

function splitPackageWithOrg(pkg) {
  // reverse here so if there is no orgPrefix, its value will be undefined
  const [name, orgPrefix] = pkg.split("/").reverse();

  return { orgPrefix, name };
}

/**
 *
 * @param {string[] | NodeSecure.Payload | NodeSecure.Payload[]} payloadFiles
 * @param {object} options
 * @param {boolean} options.isJson
 * @returns
 */
export async function buildStatsFromNsecurePayloads(payloadFiles = [], options = Object.create(null)) {
  const { isJson = false, reportConfig } = options;

  const config = reportConfig ?? localStorage.getConfig().report;
  const stats = {
    size: {
      all: 0, internal: 0, external: 0
    },
    deps: {
      transitive: {},
      node: {}
    },
    licenses: {
      Unknown: 0
    },
    flags: {},
    flagsList: Object.fromEntries(kFlagsList.map((flag) => [flag.title, flag])),
    extensions: {},
    warnings: {},
    authors: {},
    packages: {},
    packages_count: {
      all: 0, internal: 0, external: 0
    },
    scorecards: {},
    showFlags: config.showFlags
  };

  /**
   * @param {string | NodeSecure.Payload} fileOrJson
   * @returns {NodeSecure.Payload}
   */
  function getJSONPayload(fileOrJson) {
    if (isJson) {
      return fileOrJson;
    }

    const buf = fs.readFileSync(fileOrJson);

    return JSON.parse(buf.toString());
  }

  const payloads = Array.isArray(payloadFiles) ? payloadFiles : [payloadFiles];
  for (const fileOrJson of payloads) {
    const nsecurePayload = getJSONPayload(fileOrJson);

    for (const [name, descriptor] of Object.entries(nsecurePayload)) {
      const { versions, metadata } = descriptor;
      const isThird = config.npm.organizationPrefix === null ? true : !name.startsWith(`${config.npm.organizationPrefix}/`);

      for (const human of metadata.maintainers) {
        stats.authors[human.email] = human.email in stats.authors ? ++stats.authors[human.email] : 1;
      }

      if (!(name in stats.packages)) {
        const { orgPrefix, name: splitName } = splitPackageWithOrg(name);
        const isGiven = config.npm?.packages.includes(splitName) && orgPrefix === config.npm?.organizationPrefix;
        if (isThird) {
          stats.packages_count.external++;
        }
        stats.packages[name] = { isThird, versions: new Set(), fullName: name, isGiven, flags: {} };
      }

      const curr = stats.packages[name];
      for (const [localVersion, localDescriptor] of Object.entries(versions)) {
        if (curr.versions.has(localVersion)) {
          continue;
        }
        const { flags, size, composition, license, author, warnings = [], links } = localDescriptor;

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
          stats.packages[name].flags[flag] = { ...stats.flagsList[flag] };
        }

        (composition.required_builtin || composition.required_nodejs)
          .forEach((dep) => (stats.deps.node[dep] = { visualizerUrl: `${kNodeVisualizerUrl}/${dep.replace("node:", "")}.html` }));
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

          stats.deps.transitive[`${name}@${localVersion}`] = { links };
        }
        curr[localVersion] = { hasIndirectDependencies };

        if (!curr.links) {
          Object.assign(curr, { links });
        }
      }
    }
  }

  const givenPackages = Object.values(stats.packages).filter((pkg) => pkg.isGiven);

  await Promise.all(givenPackages.map(async(pkg) => {
    const { fullName } = pkg;
    const { score } = await scorecard.result(fullName, { resolveOnVersionControl: false });
    const [repo, platform] = getVCSRepositoryPathAndPlatform(pkg.links?.repository) ?? [];
    stats.scorecards[fullName] = {
      score,
      color: getScoreColor(score),
      visualizerUrl: repo ? `${kScorecardVisualizerUrl}/${platform}/${repo}` : "#"
    };
  }));

  stats.packages_count.all = Object.keys(stats.packages).length;
  stats.packages_count.internal = stats.packages_count.all - stats.packages_count.external;
  stats.size.all = formatBytes(stats.size.all);
  stats.size.internal = formatBytes(stats.size.internal);
  stats.size.external = formatBytes(stats.size.external);

  return stats;
}

