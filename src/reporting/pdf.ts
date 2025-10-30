// Import Node.js Dependencies
import path from "node:path";
import { pathToFileURL } from "node:url";

// Import Third-party Dependencies
import puppeteer from "puppeteer";

// Import Internal Dependencies
import * as CONSTANTS from "../constants.ts";
import * as utils from "../utils/index.ts";

export interface PDFReportOptions {
  title: string;
  saveOnDisk?: boolean;
  reportOutputLocation?: string;
}

export async function PDF(
  reportHTMLPath: string,
  options: PDFReportOptions
): Promise<string | Buffer> {
  const {
    title,
    saveOnDisk = true,
    reportOutputLocation = CONSTANTS.DIRS.REPORTS
  } = options;

  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();

  try {
    await page.emulateMediaType("print");
    await page.goto(pathToFileURL(reportHTMLPath).href, {
      waitUntil: "networkidle0",
      timeout: 20_000
    });

    const reportPath = saveOnDisk ? path.join(
      reportOutputLocation,
      utils.cleanReportName(title, ".pdf")
    ) : undefined;
    const pdfUint8Array = await page.pdf({
      path: reportPath,
      format: "A4",
      printBackground: true
    });

    return saveOnDisk ?
      (reportPath as string) :
      Buffer.from(pdfUint8Array);
  }
  finally {
    await page.close();
    await browser.close();
  }
}

