// Import Node.js Dependencies
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";

// Import Internal Dependencies
import { buildStatsFromNsecurePayloads } from "../analysis/extractScannerData.js";
import { HTML, PDF } from "../reporting/index.js";

export async function report(
  reportOptions,
  scannerPayload
) {
  const [pkgStats, reportOutputLocation] = await Promise.all([
    buildStatsFromNsecurePayloads(scannerPayload, {
      isJson: true,
      reportOptions
    }),
    fs.mkdtemp(
      path.join(os.tmpdir(), "nsecure-report-")
    )
  ]);

  const reportHTMLPath = await HTML(
    {
      pkgStats,
      repoStats: null
    },
    reportOptions,
    reportOutputLocation
  );

  return PDF(reportHTMLPath, {
    title: reportOptions.title,
    saveOnDisk: false
  });
}
