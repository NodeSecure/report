// Import Node.js Dependencies
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";

// Import Internal Dependencies
import { buildStatsFromNsecurePayloads } from "../analysis/extractScannerData.js";
import { HTML, PDF } from "../reporting/index.js";

export async function report(
  scannerDependencies,
  reportOptions,
  reportOutputLocation = null
) {
  const [pkgStats, finalReportLocation] = await Promise.all([
    buildStatsFromNsecurePayloads(scannerDependencies, {
      isJson: true,
      reportOptions
    }),
    reportOutputLocation === null ?
      fs.mkdtemp(path.join(os.tmpdir(), "nsecure-report-")) :
      Promise.resolve(reportOutputLocation)
  ]);

  try {
    const reportHTMLPath = await HTML(
      {
        pkgStats,
        repoStats: null
      },
      reportOptions,
      finalReportLocation
    );

    return await PDF(reportHTMLPath, {
      title: reportOptions.title,
      saveOnDisk: false
    });
  }
  finally {
    if (reportOutputLocation === null) {
      await fs.rm(finalReportLocation, {
        force: true,
        recursive: true
      });
    }
  }
}
