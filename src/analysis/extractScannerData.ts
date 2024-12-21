/* eslint-disable max-depth */
// Import Node.js Dependencies
import fs from "node:fs";

// Import Third-party Dependencies
import { formatBytes, getScoreColor, getVCSRepositoryPathAndPlatform } from "@nodesecure/utils";
import { getManifest, getFlags } from "@nodesecure/flags/web";
import * as scorecard from "@nodesecure/ossf-scorecard-sdk";
import type { Payload } from "@nodesecure/scanner";
import type { RC } from "@nodesecure/rc";

// Import Internal Dependencies
import * as localStorage from "../localStorage.js";

// CONSTANTS
const kFlagsList = Object.values(getManifest());
const kWantedFlags = getFlags();
const kScorecardVisualizerUrl = `https://kooltheba.github.io/openssf-scorecard-api-visualizer/#/projects`;
const kNodeVisualizerUrl = `https://nodejs.org/dist/latest/docs/api`;

function splitPackageWithOrg(pkg: string) {
  // reverse here so if there is no orgPrefix, its value will be undefined
  const [name, orgPrefix] = pkg.split("/").reverse();

  return { orgPrefix, name };
}

export interface ReportStat {
  size: {
    all: string;
    internal: string;
    external: string;
  };
  deps: {
    transitive: Record<PropertyKey, any>;
    node: Record<PropertyKey, any>;
  };
  licenses: Record<PropertyKey, any>;
  flags: Record<PropertyKey, any>;
  flagsList: any;
  extensions: Record<PropertyKey, any>;
  warnings: Record<PropertyKey, any>;
  authors: Record<PropertyKey, any>;
  packages: Record<PropertyKey, any>;
  packages_count: {
    all: number;
    internal: number;
    external: number;
  };
  scorecards: Record<PropertyKey, any>;
  showFlags: boolean;
}

export interface BuildScannerStatsOptions {
  reportConfig?: RC["report"];
}

export async function buildStatsFromScannerDependencies(
  payloadFiles: string[] | Payload["dependencies"] = [],
  options: BuildScannerStatsOptions = Object.create(null)
): Promise<ReportStat> {
  const { reportConfig } = options;

  const config = reportConfig ?? localStorage.getConfig().report!;
  const sizeStats = {
    all: 0,
    internal: 0,
    external: 0
  };

  const stats: ReportStat = {
    size: {
      all: "",
      internal: "",
      external: ""
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
    showFlags: config.showFlags ?? true
  };

  function getPayloadDependencies(
    fileOrJson: string | Payload["dependencies"]
  ): Payload["dependencies"] {
    if (typeof fileOrJson === "string") {
      const buf = fs.readFileSync(fileOrJson);
      const dependencies = JSON.parse(
        buf.toString()
      ) as Payload["dependencies"];

      return dependencies;
    }

    return fileOrJson;
  }

  const payloads = Array.isArray(payloadFiles) ? payloadFiles : [payloadFiles];
  const npmConfig = config.npm!;
  for (const fileOrJson of payloads) {
    const dependencies = getPayloadDependencies(fileOrJson);

    for (const [name, descriptor] of Object.entries(dependencies)) {
      const { versions, metadata } = descriptor;
      const isThird = npmConfig.organizationPrefix === null ?
        true :
        !name.startsWith(`${npmConfig.organizationPrefix}/`);

      for (const human of metadata.maintainers) {
        if (human.email) {
          stats.authors[human.email] = human.email in stats.authors ?
            ++stats.authors[human.email] : 1;
        }
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
        const { flags, size, composition, uniqueLicenseIds, author, warnings = [], links = [] } = localDescriptor;

        sizeStats.all += size;
        sizeStats[isThird ? "external" : "internal"] += size;

        for (const { kind } of warnings) {
          stats.warnings[kind] = kind in stats.warnings ? ++stats.warnings[kind] : 1;
        }

        for (const flag of flags) {
          if (!(flag in kWantedFlags)) {
            continue;
          }
          stats.flags[flag] = flag in stats.flags ? ++stats.flags[flag] : 1;
          stats.packages[name].flags[flag] = { ...stats.flagsList[flag] };
        }

        (composition.required_nodejs)
          .forEach((dep) => (stats.deps.node[dep] = { visualizerUrl: `${kNodeVisualizerUrl}/${dep.replace("node:", "")}.html` }));
        for (const extName of composition.extensions.filter((extName) => extName !== "")) {
          stats.extensions[extName] = extName in stats.extensions ? ++stats.extensions[extName] : 1;
        }

        for (const licenseName of uniqueLicenseIds) {
          stats.licenses[licenseName] = licenseName in stats.licenses ?
            ++stats.licenses[licenseName] : 1;
        }

        if (author?.email) {
          stats.authors[author.email] = author.email in stats.authors ?
            ++stats.authors[author.email] : 1;
        }

        curr.versions.add(localVersion);
        const hasIndirectDependencies = flags.includes("hasIndirectDependencies");
        id: if (hasIndirectDependencies) {
          if (!config.includeTransitiveInternal && name.startsWith(npmConfig.organizationPrefix)) {
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
  stats.size.all = formatBytes(sizeStats.all);
  stats.size.internal = formatBytes(sizeStats.internal);
  stats.size.external = formatBytes(sizeStats.external);

  return stats;
}

