// Import Third-party Dependencies
import kleur from "kleur";

// Import Internal Dependencies
import { cloneGITRepository } from "../utils.js";
import { buildStatsFromNsecurePayloads } from "./extractScannerData.js";
import * as scanner from "./scanner.js";
import * as localStorage from "../localStorage.js";
import * as utils from "../utils.js";

function formatNpmPackages(organizationPrefix, packages) {
  if (organizationPrefix === "") {
    return packages;
  }

  return packages.map((pkg) => {
    // in case the user has already added the organization prefix
    if (pkg.startsWith(organizationPrefix)) {
      return pkg;
    }

    return `${organizationPrefix}/${pkg}`;
  });
}

export async function fetchPackagesAndRepositoriesData() {
  const config = localStorage.getConfig().report;

  const fetchNpm = config.npm?.packages.length > 0;
  const fetchGit = config.git?.repositories.length > 0;
  if (!fetchGit && !fetchNpm) {
    throw new Error(
      "No git repositories and no npm packages to fetch in the local configuration!"
    );
  }

  const pkgStats = fetchNpm ?
    await fetchPackagesStats(formatNpmPackages(config.npm.organizationPrefix, config.npm.packages)) : null;

  const { repositories, organizationUrl } = config.git;
  const repoStats = fetchGit ?
    await fetchRepositoriesStats(repositories, organizationUrl) : null;

  return { pkgStats, repoStats };
}

async function fetchPackagesStats(packages) {
  const jsonFiles = await utils.runInSpinner(
    {
      title: `[Fetcher: ${kleur.yellow().bold("NPM")}]`,
      start: "Fetching NPM packages metadata on the NPM Registry"
    },
    async() => Promise.all(packages.map(scanner.from))
  );

  return buildStatsFromNsecurePayloads(
    jsonFiles.filter((value) => value !== null)
  );
}

async function fetchRepositoriesStats(repositories, organizationUrl) {
  const jsonFiles = await utils.runInSpinner(
    {
      title: `[Fetcher: ${kleur.yellow().bold("GIT")}]`,
      start: "Cloning GIT repositories"
    },
    async(spinner) => {
      const repos = await Promise.all(
        repositories.map((repositoryName) => cloneGITRepository(repositoryName, organizationUrl))
      );
      spinner.text = "Fetching repositories metadata on the NPM Registry";

      return Promise.all(repos.map(scanner.cwd));
    }
  );

  return buildStatsFromNsecurePayloads(
    jsonFiles.filter((value) => value !== null)
  );
}
