// Import Third-party Dependencies
import kleur from "kleur";

// Import Internal Dependencies
import * as utils from "../utils/index.js";
import * as localStorage from "../localStorage.js";

// Import Reporters
import { HTML } from "./html.js";
import { hasPdfReporter, PDF } from "./pdf.js";
import { type ReportStat } from "../analysis/extractScannerData.js";

interface ReportingData {
  pkgStats: ReportStat | null;
  repoStats: ReportStat | null;
}

export async function proceed(
  data: ReportingData,
  verbose = true
) {
  const reportHTMLPath = await utils.runInSpinner(
    {
      title: `[Reporter: ${kleur.yellow().bold("HTML")}]`,
      start: "Building template and assets",
      verbose
    },
    async() => HTML(data)
  );

  const reportConfig = localStorage.getConfig().report;
  if (!hasPdfReporter(reportConfig)) {
    return;
  }

  await utils.runInSpinner(
    {
      title: `[Reporter: ${kleur.yellow().bold("PDF")}]`,
      start: "Using puppeteer to convert HTML content to PDF",
      verbose
    },
    async() => PDF(reportHTMLPath, { title: reportConfig.title })
  );
}

export { HTML, PDF };
