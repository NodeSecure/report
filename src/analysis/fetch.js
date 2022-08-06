// Import Third-party Dependencies
import kleur from "kleur";

// Import Internal Dependencies
import { cloneGITRepository } from "../utils.js";
import { buildStatsFromNsecurePayloads } from "./extractScannerData.js";
import * as scanner from "./scanner.js";
import * as localStorage from "../localStorage.js";
import * as utils from "../utils.js";

export async function fetchPackagesAndRepositoriesData() {
  const config = localStorage.getConfig().report;

  const fetchNpm = "npm" in config && config.npm.packages.length > 0;
  const fetchGit = "git" in config && config.git.repositories.length > 0;
  if (!fetchGit && !fetchNpm) {
    throw new Error(
      "No git repositories and no npm packages to fetch in the local configuration!"
    );
  }

  const pkgStats = fetchNpm ?
    await fetchPackagesStats(config.npm.packages) : null;

  const { repositories, organizationUrl } = config.git;
  const repoStats = fetchGit ?
    await fetchRepositoriesStats(repositories, organizationUrl) : null;

  return { pkgStats, repoStats };
}

async function fetchPackagesStats(packages) {
  const jsonFiles = await utils.runInSpinner(
    {
      title: `[Fetcher: ${kleur.yellow().bold("NPM")}]`,
      start: "Fetching data on the NPM Registry using NodeSecure scanner"
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
      spinner.text = "Fetching data on the NPM Registry using NodeSecure scanner";

      return Promise.all(repos.map(scanner.cwd));
    }
  );

  return buildStatsFromNsecurePayloads(
    jsonFiles.filter((value) => value !== null)
  );
}
