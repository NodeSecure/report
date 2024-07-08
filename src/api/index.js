// Import Node.js Dependencies
import fs from "node:fs/promises";

// Import Internal Dependencies
import { buildStatsFromNsecurePayloads } from "../analysis/extractScannerData.js";
import { HTML, PDF } from "../reporting/index.js";
import * as CONSTANTS from "../constants.js";

export async function report(
  reportOptions,
  scannerPayload
) {
  await fs.mkdir(
    CONSTANTS.DIRS.REPORTS,
    { recursive: true }
  );

  const pkgStats = await buildStatsFromNsecurePayloads(scannerPayload, {
    isJson: true,
    reportOptions
  });
  const fakeSpinner = Object.create(null);

  const reportHTMLPath = await HTML({
    pkgStats,
    repoStats: null,
    spinner: fakeSpinner
  }, reportOptions);

  return PDF(reportHTMLPath, {
    title: reportOptions.title,
    saveOnDisk: false
  });
}
