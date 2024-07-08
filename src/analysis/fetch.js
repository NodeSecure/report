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

export async function fetchPackagesAndRepositoriesData(
  verbose = true
) {
  const config = localStorage.getConfig().report;

  const fetchNpm = config.npm?.packages.length > 0;
  const fetchGit = config.git?.repositories.length > 0;
  if (!fetchGit && !fetchNpm) {
    throw new Error(
      "No git repositories and no npm packages to fetch in the local configuration!"
    );
  }

  const pkgStats = fetchNpm ?
    await fetchPackagesStats(
      utils.formatNpmPackages(
        config.npm.organizationPrefix,
        config.npm.packages
      ),
      verbose
    ) :
    null;

  const { repositories, organizationUrl } = config.git;
  const repoStats = fetchGit ?
    await fetchRepositoriesStats(
      repositories,
      organizationUrl,
      verbose
    ) :
    null;

  return { pkgStats, repoStats };
}

async function fetchPackagesStats(
  packages,
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
  repositories,
  organizationUrl,
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
        repositories.map((repositoryName) => utils.cloneGITRepository(
          path.join(CONSTANTS.DIRS.CLONES, repositoryName),
          `${organizationUrl}/${repositoryName}.git`
        ))
      );
      spinner.text = "Fetching repositories metadata on the NPM Registry";

      return Promise.all(repos.map(scanner.cwd));
    }
  );

  return buildStatsFromNsecurePayloads(
    jsonFiles.filter((value) => value !== null)
  );
}
