// Import Node.js Dependencies
import path from "node:path";

// Import Third-party Dependencies
import kleur from "kleur";

// Import Internal Dependencies
import { buildStatsFromScannerDependencies } from "./extractScannerData.ts";
import * as scanner from "./scanner.ts";
import * as localStorage from "../localStorage.ts";
import * as utils from "../utils/index.ts";
import * as CONSTANTS from "../constants.ts";

export async function fetchPackagesAndRepositoriesData(
  verbose = true
) {
  const config = localStorage.getConfig().report!;

  const fetchNpm = (config.npm?.packages ?? []).length > 0;
  const fetchGit = (config.git?.repositories ?? []).length > 0;
  if (!fetchGit && !fetchNpm) {
    throw new Error(
      "No git repositories and no npm packages to fetch in the local configuration!"
    );
  }

  const pkgStats = fetchNpm && config.npm ?
    await fetchPackagesStats(
      utils.formatNpmPackages(
        config.npm.organizationPrefix,
        config.npm.packages
      ),
      verbose
    ) :
    null;

  const repoStats = fetchGit && config.git ?
    await fetchRepositoriesStats(
      config.git.repositories,
      config.git.organizationUrl,
      verbose
    ) :
    null;

  return {
    pkgStats,
    repoStats
  };
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

  return buildStatsFromScannerDependencies(
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

  return buildStatsFromScannerDependencies(
    jsonFiles.filter((value) => value !== null)
  );
}
