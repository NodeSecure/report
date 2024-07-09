// Import Node.js Dependencies
import path from "node:path";
import { readdirSync, promises as fs } from "node:fs";

// Import Third-party Dependencies
import esbuild from "esbuild";

// Import Internal Dependencies
import * as utils from "../utils/index.js";
import * as CONSTANTS from "../constants.js";
import * as localStorage from "../localStorage.js";

import { HTMLTemplateGenerator } from "./template.js";

// CONSTANTS
const kDateFormatter = Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric"
});

const kStaticESBuildConfig = {
  allowOverwrite: true,
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
  logLevel: "silent"
};

const kImagesDir = path.join(CONSTANTS.DIRS.PUBLIC, "img");
const kAvailableThemes = new Set(
  readdirSync(CONSTANTS.DIRS.THEMES)
    .map((file) => path.basename(file, ".css"))
);

export async function HTML(
  data,
  reportOptions = null,
  reportOutputLocation = CONSTANTS.DIRS.REPORTS
) {
  const { pkgStats, repoStats } = data;

  const config = reportOptions ?? localStorage.getConfig().report;
  const assetsOutputLocation = path.join(reportOutputLocation, "..", "dist");
  const reportTheme = kAvailableThemes.has(config.theme) ? config.theme : "dark";
  const reportFinalOutputLocation = path.join(
    reportOutputLocation,
    utils.cleanReportName(config.title, ".html")
  );

  const charts = config.charts
    .flatMap(({ display, name, help = null }) => (display ? [{ name, help }] : []));

  const HTMLReport = new HTMLTemplateGenerator(
    {
      report_theme: reportTheme,
      report_title: config.title,
      report_logo: config.logoUrl,
      report_date: kDateFormatter.format(new Date()),
      npm_stats: pkgStats,
      git_stats: repoStats,
      charts
    },
    reportOptions
  ).render();

  await Promise.all([
    fs.writeFile(
      reportFinalOutputLocation,
      HTMLReport
    ),
    buildFrontAssets(
      assetsOutputLocation,
      { theme: reportTheme }
    )
  ]);

  return reportFinalOutputLocation;
}

export async function buildFrontAssets(
  outdir,
  options = {}
) {
  const { theme = "light" } = options;

  await esbuild.build({
    ...kStaticESBuildConfig,
    entryPoints: [
      path.join(CONSTANTS.DIRS.PUBLIC, "scripts", "main.js"),
      path.join(CONSTANTS.DIRS.PUBLIC, "css", "style.css"),
      path.join(CONSTANTS.DIRS.PUBLIC, "css", "themes", `${theme}.css`)
    ],
    outdir
  });

  const imagesFiles = await fs.readdir(kImagesDir);
  await Promise.all([
    ...imagesFiles.map((name) => fs.copyFile(
      path.join(kImagesDir, name),
      path.join(outdir, name)
    ))
  ]);
}
