// Import Node.js Dependencies
import path from "path";
import { readdirSync } from "fs";
import fs from "fs/promises";
import timers from "timers/promises";
import { fileURLToPath } from "url";

// Import Third-party Dependencies
import kleur from "kleur";
import esbuild from "esbuild";
import compile from "zup";
import Spinner from "@slimio/async-cli-spinner";
import { taggedString } from "@nodesecure/utils";
Spinner.DEFAULT_SPINNER = "dots";

// Import Internal Dependencies
import { cloneGITRepository, cleanReportName } from "./src/utils.js";
import { fetchStatsFromNsecurePayloads } from "./src/analysis/extraction/extract.js";
import * as scanner from "./src/analysis/scanner.js";
import { generatePDF } from "./src/pdf.js";
import * as localStorage from "./src/localStorage.js";
import * as CONSTANTS from "./src/constants.js";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const kChartTemplate = taggedString`\tcreateChart("${0}", "${4}", { labels: [${1}], interpolate: ${3}, data: [${2}] });`;
const kAvailableThemes = new Set(
  readdirSync(path.join(__dirname, "public", "css", "themes")).map((file) => path.basename(file, ".css"))
);

async function fetchPackagesStats() {
  const config = localStorage.getConfig().report;
  console.log(config.npm.packages);

  const spinner = new Spinner({
    prefixText: kleur.white().bold("Fetching packages stats on nsecure")
  }).start();

  try {
    const jsonFiles = await Promise.all(config.npm.packages.map(scanner.from));
    const elapsed = `${spinner.elapsedTime.toFixed(2)}ms`;
    spinner.succeed(`Successfully done in ${kleur.cyan().bold(elapsed)}`);

    return fetchStatsFromNsecurePayloads(jsonFiles.filter((value) => value !== null));
  }
  catch (error) {
    spinner.failed(error.message);
    throw error;
  }
}

async function fetchRepositoriesStats() {
  const config = localStorage.getConfig().report;

  const spinner = new Spinner({
    prefixText: kleur.white().bold("Clone and analyze built-in addons")
  }).start("clone repositories...");

  try {
    const repos = await Promise.all(config.git.repositories.map(cloneGITRepository));
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

// eslint-disable-next-line max-params
function toChart(baliseName, data, interpolateName, type = "bar") {
  const graphLabels = Object.keys(data).map((key) => `"${key}"`).join(",");

  return kChartTemplate(baliseName, graphLabels, Object.values(data).join(","), interpolateName, type);
}

function generateChartArray(pkgStats, repoStats) {
  const charts = [];
  const config = localStorage.getConfig().report;
  const displayableCharts = config.charts.filter((chart) => chart.display);

  if (pkgStats !== null) {
    for (const chart of displayableCharts) {
      const name = chart.name.toLowerCase();
      charts.push(toChart(`npm_${name}_canvas`, pkgStats[name], chart.interpolation, chart.type));
    }
  }
  if (repoStats !== null) {
    for (const chart of displayableCharts) {
      const name = chart.name.toLowerCase();
      charts.push(toChart(`git_${name}_canvas`, repoStats[name], chart.interpolation, chart.type));
    }
  }

  return charts;
}

export async function main() {
  const config = localStorage.getConfig().report;

  await Promise.all([
    fs.mkdir(CONSTANTS.DIRS.JSON, { recursive: true }),
    fs.mkdir(CONSTANTS.DIRS.CLONES, { recursive: true }),
    fs.mkdir(CONSTANTS.DIRS.REPORTS, { recursive: true })
  ]);

  try {
    const generationDate = Intl.DateTimeFormat("en-GB", {
      day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "numeric", second: "numeric"
    }).format(new Date());

    const pkgStats = await (config.npm.packages.length === 0 ? Promise.resolve(null) : fetchPackagesStats());
    const repoStats = await (config.git.repositories.length === 0 ? Promise.resolve(null) : fetchRepositoriesStats());
    if (pkgStats === null && repoStats === null) {
      console.log("No git repositories and no npm packages to fetch in the local configuration!");
      process.exit(0);
    }

    console.log("Start generating template!");
    const HTMLTemplateStr = await fs.readFile(path.join(CONSTANTS.DIRS.VIEWS, "template.html"), "utf8");
    const templateGenerator = compile(HTMLTemplateStr);

    const templatePayload = {
      report_theme: kAvailableThemes.has(config.theme) ? config.theme : "dark",
      report_title: config.title,
      report_logo: config.logoUrl,
      report_date: generationDate,
      npm_stats: pkgStats,
      git_stats: repoStats,
      charts: config.charts.filter((chart) => chart.display).map(({ name, help = null }) => {
        return { name, help };
      })
    };

    const charts = generateChartArray(pkgStats, repoStats);
    const HTMLReport = templateGenerator(templatePayload)
      .concat(`\n<script>\ndocument.addEventListener("DOMContentLoaded", () => {\n${charts.join("\n")}\n});\n</script>`);

    const reportHTMLPath = path.join(CONSTANTS.DIRS.REPORTS, cleanReportName(config.title, ".html"));
    await fs.writeFile(reportHTMLPath, HTMLReport);

    await esbuild.build({
      entryPoints: [
        path.join(CONSTANTS.DIRS.PUBLIC, "scripts", "main.js"),
        path.join(CONSTANTS.DIRS.PUBLIC, "css", "style.css"),
        path.join(CONSTANTS.DIRS.PUBLIC, "css", "themes", `${templatePayload.report_theme}.css`)
      ],
      loader: {
        ".jpg": "file",
        ".png": "file",
        ".woff": "file",
        ".woff2": "file",
        ".eot": "file",
        ".ttf": "file",
        ".svg": "file"
      },
      platform: "browser",
      bundle: true,
      sourcemap: true,
      treeShaking: true,
      outdir: path.join(process.cwd(), "public")
    });

    await timers.setTimeout(100);
    console.log("HTML Report writted on disk!");

    await generatePDF(reportHTMLPath, config.title);
    console.log("Report sucessfully generated!");
  }
  catch (error) {
    console.log(error);
  }
  finally {
    await timers.setTimeout(100);
    await fs.rm(CONSTANTS.DIRS.CLONES, { recursive: true, force: true });

    process.exit(0);
  }
}
