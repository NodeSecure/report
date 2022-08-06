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
import { buildStatsFromNsecurePayloads } from "./analysis/extraction/extract.js";
import * as scanner from "./analysis/scanner.js";
import * as localStorage from "./localStorage.js";
import * as CONSTANTS from "./constants.js";

// CONSTANTS
const kColoredScanner = kleur.magenta().bold("NodeSecure/scanner");

async function fetchPackagesStats(packages) {
  const spinner = new Spinner({
    prefixText: kleur.white().bold("Fetching npm packages stats with ") + kColoredScanner
  }).start();

  try {
    const jsonFiles = await Promise.all(packages.map(scanner.from));
    const elapsed = `${spinner.elapsedTime.toFixed(2)}ms`;
    spinner.succeed(kleur.green().bold(`done in ${kleur.cyan().bold(elapsed)}`));

    return buildStatsFromNsecurePayloads(jsonFiles.filter((value) => value !== null));
  }
  catch (error) {
    spinner.failed(error.message);

    throw error;
  }
}

async function fetchRepositoriesStats(repositories, organizationUrl) {
  const spinner = new Spinner({
    prefixText: kleur.white().bold("Fetching git repositories stats with ") + kColoredScanner
  }).start("Cloning repositories...");

  try {
    const repos = await Promise.all(
      repositories.map((repositoryName) => cloneGITRepository(repositoryName, organizationUrl))
    );
    spinner.text = "Runing CWD...";

    const jsonFiles = await Promise.all(repos.map(scanner.cwd));
    const elapsed = `${spinner.elapsedTime.toFixed(2)}ms`;
    spinner.succeed(kleur.green().bold(`done in ${kleur.cyan().bold(elapsed)}`));

    return buildStatsFromNsecurePayloads(jsonFiles.filter((value) => value !== null));
  }
  catch (error) {
    spinner.failed(error.message);

    throw error;
  }
}

function exit(message) {
  console.log(kleur.bold().red(message));

  process.exit(0);
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
  if (reporters.size === 0) {
    exit("At least one reporter must be selected (either 'HTML' or 'PDF')");
  }

  const reportName = cleanReportName(config.title);
  console.log(`Starting report: ${kleur.cyan().bold(config.title)}`);
  console.log(`Reporters selected: ${kleur.magenta().bold(config.reporters.join(","))}\n`);

  try {
    const fetchNpm = "npm" in config && config.npm.packages.length > 0;
    const fetchGit = "git" in config && config.git.repositories.length > 0;
    if (!fetchGit && !fetchNpm) {
      exit("No git repositories and no npm packages to fetch in the local configuration!");
    }

    const pkgStats = fetchNpm ? await fetchPackagesStats(config.npm.packages) : null;
    const repoStats = fetchGit ? await fetchRepositoriesStats(config.git.repositories, config.git.organizationUrl) : null;

    const reportHTMLPath = await generateHTML({
      pkgStats,
      repoStats,
      writeOnDisk: reporters.has("html")
    });

    if (reporters.has("pdf")) {
      const spinner = new Spinner({
        prefixText: kleur.white().bold("Generate PDF report with puppeteer")
      }).start("");

      try {
        await generatePDF(reportHTMLPath, reportName);

        const elapsed = `${spinner.elapsedTime.toFixed(2)}ms`;
        spinner.succeed(kleur.green().bold(`done in ${kleur.cyan().bold(elapsed)}`));
      }
      catch (err) {
        spinner.failed(err.message);

        throw err;
      }
    }

    console.log(kleur.gray().bold("\n >> Security report successfully generated! Enjoy.\n"));
  }
  catch (error) {
    console.log(error);
  }
  finally {
    await fs.rm(CONSTANTS.DIRS.CLONES, { recursive: true, force: true });
  }
}
