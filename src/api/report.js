// Import Node.js Dependencies
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";

// Import Internal Dependencies
import { buildStatsFromNsecurePayloads } from "../analysis/extractScannerData.js";
import { HTML, PDF } from "../reporting/index.js";

export async function report(
  scannerDependencies,
  reportConfig,
  reportOptions = Object.create(null)
) {
  const {
    reportOutputLocation = null,
    savePDFOnDisk = false
  } = reportOptions;
  const [pkgStats, finalReportLocation] = await Promise.all([
    buildStatsFromNsecurePayloads(scannerDependencies, {
      isJson: true,
      reportConfig
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
      reportConfig,
      finalReportLocation
    );

    if (reportConfig.reporters.includes("pdf")) {
      return PDF(reportHTMLPath, {
        title: reportConfig.title,
        saveOnDisk: savePDFOnDisk,
        reportOutputLocation: finalReportLocation
      });
    }

    return reportHTMLPath;
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
