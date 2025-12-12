// Import Node.js Dependencies
import fs from "node:fs";

// Import Third-party Dependencies
import { getScoreColor, getVCSRepositoryPathAndPlatform } from "@nodesecure/utils";
import { getManifest, getFlags } from "@nodesecure/flags/web";
import { Extractors, type Payload } from "@nodesecure/scanner";
import type { RC } from "@nodesecure/rc";

// Import Internal Dependencies
import * as localStorage from "../localStorage.ts";
import { fetchScorecardScore } from "./fetch.ts";

// CONSTANTS
const kFlagsList = Object.values(getManifest());
const kWantedFlags = getFlags();
const kScorecardVisualizerUrl = "https://kooltheba.github.io/openssf-scorecard-api-visualizer/#/projects";
const kNodeVisualizerUrl = "https://nodejs.org/dist/latest/docs/api";

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

export function buildStatsFromScannerDependencies(
  payloadFiles: string[] | Payload["dependencies"] = [],
  options: BuildScannerStatsOptions = Object.create(null)
): ReportStat {
  const { reportConfig } = options;

  const config = reportConfig ?? localStorage.getConfig().report!;

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

  const dependencies = payloads.reduce<Payload["dependencies"]>((acc, curr) => {
    const dep = getPayloadDependencies(curr);
    Object.assign(acc, dep);

    return acc;
  }, {});

  const extractor = new Extractors.Payload(dependencies, [
    new Extractors.Probes.Contacts(),
    new Extractors.Probes.Flags(),
    new Extractors.Probes.Licenses(),
    new Extractors.Probes.Warnings(),
    new Extractors.Probes.Size({ organizationPrefix: npmConfig.organizationPrefix }),
    new Extractors.Probes.Extensions(),
    new Extractors.Probes.NodeDependencies()
  ]);

  extractor.on("manifest", (spec: string, dependencyVersion, { name }) => {
    const { flags, links = [] } = dependencyVersion;
    const isThird = npmConfig.organizationPrefix === null ?
      true :
      !name.startsWith(`${npmConfig.organizationPrefix}/`);
    if (!(name in stats.packages)) {
      const { orgPrefix, name: splitName } = splitPackageWithOrg(name);
      const isGiven = config.npm?.packages.includes(splitName) && orgPrefix === config.npm?.organizationPrefix;
      if (isThird) {
        stats.packages_count.external++;
      }
      stats.packages[name] = { isThird, versions: new Set(), fullName: name, isGiven, flags: {} };
    }
    const curr = stats.packages[name];
    if (curr.versions.has(spec)) {
      return;
    }

    for (const flag of flags) {
      if (!(kWantedFlags.has(flag))) {
        continue;
      }
      stats.packages[name].flags[flag] = { ...stats.flagsList[flag] };
    }
    curr.versions.add(spec);
    const hasIndirectDependencies = flags.includes("hasIndirectDependencies");
    id: if (hasIndirectDependencies) {
      if (!config.includeTransitiveInternal && name.startsWith(npmConfig.organizationPrefix)) {
        break id;
      }

      stats.deps.transitive[`${name}@${spec}`] = { links };
    }
    curr[spec] = { hasIndirectDependencies };

    if (!curr.links) {
      Object.assign(curr, { links });
    }
  });

  const { contacts, licenses, flags, warnings, size, extensions, nodeDeps } = extractor.extractAndMerge();

  stats.authors = contacts;
  stats.licenses = { ...stats.licenses, ...licenses };
  stats.size = size;
  stats.flags = flags;
  stats.warnings = warnings.uniqueKinds;
  stats.extensions = extensions;
  stats.deps.node = nodeDeps.reduce((acc: ReportStat["deps"]["node"], curr) => {
    Object.assign(acc, { [curr]: { visualizerUrl: `${kNodeVisualizerUrl}/${curr.replace("node:", "")}.html` } });

    return acc;
  }, {});

  stats.packages_count.all = Object.keys(stats.packages).length;
  stats.packages_count.internal = stats.packages_count.all - stats.packages_count.external;
  stats.scorecards = {};

  return stats;
}

export async function buildGivenPackagesScorecards(stats: ReportStat): Promise<ReportStat["scorecards"]> {
  const givenPackages = Object.values(stats.packages).filter((pkg) => pkg.isGiven);
  const scorecards: ReportStat["scorecards"] = {};
  await Promise.all(givenPackages.map(async(pkg) => {
    const { fullName } = pkg;
    const score = await fetchScorecardScore(fullName);
    const [repo, platform] = getVCSRepositoryPathAndPlatform(pkg.links?.repository) ?? [];
    scorecards[fullName] = {
      score,
      color: getScoreColor(score),
      visualizerUrl: repo ? `${kScorecardVisualizerUrl}/${platform}/${repo}` : "#"
    };
  }));

  return scorecards;
}
