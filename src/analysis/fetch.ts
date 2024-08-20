// Import Node.js Dependencies
import path from "node:path";

// Import Third-party Dependencies
import kleur from "kleur";

// Import Internal Dependencies
import { buildStatsFromNsecurePayloads } from "./extractScannerData.js";
import * as scanner from "./scanner.js";
import * as localStorage from "../localStorage.js";
import * as utils from "../utils/index.js";
import * as CONSTANTS from "../constants.js";
import { type RC } from "@nodesecure/rc";

export async function fetchPackagesAndRepositoriesData(
  verbose = true
) {
  const config = localStorage.getConfig()?.report;
  // TODO: handle undefined ?


  const fetchNpm = hasReportConfig(config) && canFetchNpm(config.npm);
  const fetchGit = hasReportConfig(config) && canFetchGit(config.git);

  if (!fetchGit && !fetchNpm) {
    throw new Error(
      "No git repositories and no npm packages to fetch in the local configuration!"
    );
  }

  const pkgStats = canFetchNpm(config.npm) ?
    await fetchPackagesStats(
      utils.formatNpmPackages(
        config.npm.organizationPrefix,
        config.npm.packages
      ),
      verbose
    ) :
    null;

  const repoStats = canFetchGit(config.git) ?
    await fetchRepositoriesStats(
      config.git.repositories,
      config.git.organizationUrl,
      verbose
    ) :
    null;

  return { pkgStats, repoStats };
}

async function fetchPackagesStats(
  packages: string[],
  verbose = true
) {
  const jsonFiles = await utils.runInSpinner(
    {
      title: `[Fetcher: ${kleur.yellow().bold("NPM")}]`,
      start: "Fetching NPM packages metadata on the NPM Registry",
      verbose
    },
    async() => Promise.all(packages.map(scanner.from))
  );

  return buildStatsFromNsecurePayloads(
    jsonFiles.filter((value) => value !== null)
  );
}

async function fetchRepositoriesStats(
  repositories: string[],
  organizationUrl: string,
  verbose = true
) {
  const jsonFiles = await utils.runInSpinner(
    {
      title: `[Fetcher: ${kleur.yellow().bold("GIT")}]`,
      start: "Cloning GIT repositories",
      verbose
    },
    async(spinner) => {
      const repos = await Promise.all(
        repositories.map((repositoryName) => {
          const trimmedRepositoryName = repositoryName.trim();

          return utils.cloneGITRepository(
            path.join(CONSTANTS.DIRS.CLONES, trimmedRepositoryName),
            `${organizationUrl}/${trimmedRepositoryName}.git`
          );
        })
      );
      spinner.text = "Fetching repositories metadata on the NPM Registry";

      return Promise.all(repos.map(scanner.cwd));
    }
  );

  return buildStatsFromNsecurePayloads(
    jsonFiles.filter((value) => value !== null)
  );
}

function hasReportConfig(config: RC["report"]): config is NonNullable<RC["report"]> {
  return config !== undefined;
}

function canFetchGit<T extends NonNullable<RC["report"]>["git"]>(gitConfig: T): gitConfig is NonNullable<T> {
  return gitConfig !== undefined && gitConfig.repositories.length > 0;
}

function canFetchNpm<T extends NonNullable<RC["report"]>["npm"]>(npmConfig: T): npmConfig is NonNullable<T> {
  return npmConfig !== undefined && npmConfig.packages.length > 0;
}
