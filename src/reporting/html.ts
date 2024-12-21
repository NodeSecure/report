// Import Node.js Dependencies
import path from "node:path";
import { readdirSync, promises as fs } from "node:fs";

// Import Third-party Dependencies
import esbuild from "esbuild";
import type { RC } from "@nodesecure/rc";

// Import Internal Dependencies
import * as utils from "../utils/index.js";
import * as CONSTANTS from "../constants.js";
import * as localStorage from "../localStorage.js";
import { HTMLTemplateGenerator } from "./template.js";
import type { ReportStat } from "../analysis/extractScannerData.js";

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
} as const;

const kImagesDir = path.join(CONSTANTS.DIRS.PUBLIC, "img");
const kAvailableThemes = new Set<string | undefined>(
  readdirSync(CONSTANTS.DIRS.THEMES)
    .map((file) => path.basename(file, ".css"))
);

export interface HTMLReportData {
  pkgStats: ReportStat | null;
  repoStats: ReportStat | null;
}

export async function HTML(
  data: HTMLReportData,
  reportOptions: RC["report"] | null = null,
  reportOutputLocation = CONSTANTS.DIRS.REPORTS
): Promise<string> {
  const { pkgStats, repoStats } = data;

  const config = reportOptions ?? localStorage.getConfig().report!;
  const assetsOutputLocation = path.join(reportOutputLocation, "..", "dist");
  const reportTheme = config.theme && kAvailableThemes.has(config.theme) ? config.theme : "dark";
  const reportFinalOutputLocation = path.join(
    reportOutputLocation,
    utils.cleanReportName(config.title, ".html")
  );

  const charts = (config.charts ?? [])
    .flatMap(({ display, name }) => (display ? [{ name }] : []));

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
  outdir: string,
  options: { theme?: string; } = {}
): Promise<void> {
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
