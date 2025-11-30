// Import Node.js Dependencies
import * as path from "node:path";
import * as os from "node:os";
import * as fs from "node:fs/promises";

// Import Third-party Dependencies
import { type Payload } from "@nodesecure/scanner";
import { type RC } from "@nodesecure/rc";

// Import Internal Dependencies
import { buildStatsFromScannerDependencies, buildGivenPackagesScorecards } from "../analysis/extractScannerData.ts";
import { HTML, PDF } from "../reporting/index.ts";

export interface ReportLocationOptions {
  includesPDF: boolean;
  savePDFOnDisk: boolean;
  saveHTMLOnDisk: boolean;
}

/**
 * Determine the final location of the report (on current working directory or in a temporary directory)
 */
async function reportLocation(
  location: string | null,
  options: ReportLocationOptions
): Promise<string> {
  const {
    includesPDF,
    savePDFOnDisk,
    saveHTMLOnDisk
  } = options;

  if (location) {
    return location;
  }

  if ((includesPDF && savePDFOnDisk) || saveHTMLOnDisk) {
    return process.cwd();
  }

  return fs.mkdtemp(path.join(os.tmpdir(), "nsecure-report-"));
}

export interface ReportOptions {
  reportOutputLocation?: string;
  savePDFOnDisk?: boolean;
  saveHTMLOnDisk?: boolean;
}

export async function report(
  scannerDependencies: Payload["dependencies"],
  reportConfig: NonNullable<RC["report"]>,
  reportOptions: ReportOptions = Object.create(null)
): Promise<string | Buffer> {
  const {
    reportOutputLocation = null,
    savePDFOnDisk = false,
    saveHTMLOnDisk = false
  } = reportOptions;
  const includesPDF = reportConfig.reporters?.includes("pdf") ?? false;
  const includesHTML = reportConfig.reporters?.includes("html") ?? false;
  if (!includesPDF && !includesHTML) {
    throw new Error("At least one reporter must be enabled (pdf or html)");
  }

  const pkgStats = buildStatsFromScannerDependencies(scannerDependencies, {
    reportConfig
  });

  pkgStats.scorecards = await buildGivenPackagesScorecards(pkgStats);

  const finalReportLocation = await reportLocation(reportOutputLocation, { includesPDF, savePDFOnDisk, saveHTMLOnDisk });

  let reportHTMLPath: string | undefined;
  try {
    reportHTMLPath = await HTML(
      {
        pkgStats,
        repoStats: null
      },
      reportConfig,
      finalReportLocation
    );

    if (includesPDF) {
      return await PDF(reportHTMLPath, {
        title: reportConfig.title,
        saveOnDisk: savePDFOnDisk,
        reportOutputLocation: finalReportLocation
      });
    }

    return reportHTMLPath;
  }
  finally {
    if (reportHTMLPath && (!includesHTML || saveHTMLOnDisk === false)) {
      await fs.rm(reportHTMLPath, {
        force: true,
        recursive: true
      });
    }
  }
}
