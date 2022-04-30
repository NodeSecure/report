// Import Node.js Dependencies
import fs from "fs/promises";

// Import Third-party Dependencies
import kleur from "kleur";
import Spinner from "@slimio/async-cli-spinner";
Spinner.DEFAULT_SPINNER = "dots";

// Import Internal Dependencies
import { cloneGITRepository, cleanReportName } from "./utils.js";
import { generatePDF } from "./reporting/pdf.js";
import { generateHTML } from "./reporting/html.js";
import { fetchStatsFromNsecurePayloads } from "./analysis/extraction/extract.js";
import * as scanner from "./analysis/scanner.js";
import * as localStorage from "./localStorage.js";
import * as CONSTANTS from "./constants.js";

async function fetchPackagesStats(packages) {
  const spinner = new Spinner({
    prefixText: kleur.white().bold("Fetching packages stats on nsecure")
  }).start();

  try {
    const jsonFiles = await Promise.all(packages.map(scanner.from));
    const elapsed = `${spinner.elapsedTime.toFixed(2)}ms`;
    spinner.succeed(`Successfully done in ${kleur.cyan().bold(elapsed)}`);

    return fetchStatsFromNsecurePayloads(jsonFiles.filter((value) => value !== null));
  }
  catch (error) {
    spinner.failed(error.message);
    throw error;
  }
}

async function fetchRepositoriesStats(repositories, organizationUrl) {
  const spinner = new Spinner({
    prefixText: kleur.white().bold("Clone and analyze built-in addons")
  }).start("clone repositories...");

  try {
    const repos = await Promise.all(
      repositories.map((repositoryName) => cloneGITRepository(repositoryName, organizationUrl))
    );
    spinner.text = "Run node-secure analyze";

    const jsonFiles = await Promise.all(repos.map(scanner.cwd));
    const elapsed = `${spinner.elapsedTime.toFixed(2)}ms`;
    spinner.succeed(`Successfully done in ${kleur.cyan().bold(elapsed)}`);

    return fetchStatsFromNsecurePayloads(jsonFiles.filter((value) => value !== null));
  }
  catch (error) {
    spinner.failed(error.message);
    throw error;
  }
}

export async function execute() {
  // Create mandatory directories
  await Promise.all([
    fs.mkdir(CONSTANTS.DIRS.JSON, { recursive: true }),
    fs.mkdir(CONSTANTS.DIRS.CLONES, { recursive: true }),
    fs.mkdir(CONSTANTS.DIRS.REPORTS, { recursive: true })
  ]);

  const config = localStorage.getConfig().report;
  const reporters = new Set(config.reporters);
  const reportName = cleanReportName(config.title);

  try {
    const fetchNpm = "npm" in config && config.npm.packages.length > 0;
    const fetchGit = "git" in config && config.git.repositories.length > 0;
    if (!fetchGit && !fetchNpm) {
      console.log("No git repositories and no npm packages to fetch in the local configuration!");

      return;
    }

    const pkgStats = fetchNpm ? await fetchPackagesStats(config.npm.packages) : null;
    const repoStats = fetchGit ? await fetchRepositoriesStats(config.git.repositories, config.git.organizationUrl) : null;

    const reportHTMLPath = await generateHTML({ pkgStats, repoStats });

    if (reporters.has("pdf")) {
      await generatePDF(reportHTMLPath, reportName);
    }
  }
  catch (error) {
    console.log(error);
  }
  finally {
    await fs.rm(CONSTANTS.DIRS.CLONES, { recursive: true, force: true });
  }
}
