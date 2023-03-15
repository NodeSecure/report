// Import Node.js Dependencies
import path from "node:path";
import { readdirSync, readFileSync } from "node:fs";
import fs from "node:fs/promises";

// Import Third-party Dependencies
import esbuild from "esbuild";
import compile from "zup";
import kleur from "kleur";
import { taggedString } from "@nodesecure/utils";

// Import Internal Dependencies
import { cleanReportName } from "../utils.js";
import * as CONSTANTS from "../constants.js";
import * as localStorage from "../localStorage.js";

// CONSTANTS
const kChartTemplate = taggedString`\tcreateChart("${0}", "${4}", { labels: [${1}], interpolate: ${3}, data: [${2}] });`;
const kDateFormatter = Intl.DateTimeFormat("en-GB", {
  day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "numeric", second: "numeric"
});

const kAvailableThemes = new Set(
  readdirSync(path.join(CONSTANTS.DIRS.PUBLIC, "css", "themes"))
    .map((file) => path.basename(file, ".css"))
);
const kHTMLTemplate = readFileSync(path.join(CONSTANTS.DIRS.VIEWS, "template.html"), "utf8");
const kTemplateGenerator = compile(kHTMLTemplate);

export async function HTML(data) {
  const { pkgStats, repoStats, spinner } = data;

  spinner.text = "Building view with zup";
  const config = localStorage.getConfig().report;

  const templatePayload = {
    report_theme: kAvailableThemes.has(config.theme) ? config.theme : "dark",
    report_title: config.title,
    report_logo: config.logoUrl,
    report_date: kDateFormatter.format(new Date()),
    npm_stats: pkgStats,
    git_stats: repoStats,
    charts: config.charts.filter((chart) => chart.display).map(({ name, help = null }) => {
      return { name, help };
    })
  };

  const charts = [...generateChartArray(pkgStats, repoStats)];
  const HTMLReport = kTemplateGenerator(templatePayload)
    .concat(`\n<script>\ndocument.addEventListener("DOMContentLoaded", () => {\n${charts.join("\n")}\n});\n</script>`);

  const reportHTMLPath = path.join(CONSTANTS.DIRS.REPORTS, cleanReportName(config.title, ".html"));
  await fs.writeFile(reportHTMLPath, HTMLReport);

  spinner.text = kleur.yellow().bold("Bundling assets with esbuild");
  await esbuild.build({
    allowOverwrite: true,
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
    outdir: path.join(process.cwd(), "public"),
    logLevel: "silent"
  });

  return reportHTMLPath;
}

// eslint-disable-next-line max-params
function toChart(baliseName, data, interpolateName, type = "bar") {
  const graphLabels = Object.keys(data).map((key) => `"${key}"`).join(",");

  return kChartTemplate(baliseName, graphLabels, Object.values(data).join(","), interpolateName, type);
}

function* generateChartArray(pkgStats, repoStats) {
  const config = localStorage.getConfig().report;
  const displayableCharts = config.charts.filter((chart) => chart.display);

  if (pkgStats !== null) {
    for (const chart of displayableCharts) {
      const name = chart.name.toLowerCase();
      yield toChart(`npm_${name}_canvas`, pkgStats[name], chart.interpolation, chart.type);
    }
  }
  if (repoStats !== null) {
    for (const chart of displayableCharts) {
      const name = chart.name.toLowerCase();
      yield toChart(`git_${name}_canvas`, repoStats[name], chart.interpolation, chart.type);
    }
  }
}
