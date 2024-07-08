// Import Node.js Dependencies
import fs from "node:fs/promises";

// Import Internal Dependencies
import { buildStatsFromNsecurePayloads } from "../analysis/extractScannerData.js";
import { HTML, PDF } from "../reporting/index.js";
import * as CONSTANTS from "../constants.js";

export async function report(
  scannerPayload,
  reportOptions,
  reportOutputLocation = CONSTANTS.DIRS.REPORTS,
) {
  await fs.mkdir(
    reportOutputLocation,
    { recursive: true }
  );

  const pkgStats = await buildStatsFromNsecurePayloads(scannerPayload, {
    isJson: true,
    reportOptions
  });

  const reportHTMLPath = await HTML(
    {
      pkgStats,
      repoStats: null,
      spinner: Object.create(null)
    },
    reportOptions,
    reportOutputLocation
  );

  return PDF(reportHTMLPath, {
    title: reportOptions.title,
    saveOnDisk: false
  });
}
