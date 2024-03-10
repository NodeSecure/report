// Import Node.js Dependencies
import path from "node:path";

// Import Third-party Dependencies
import puppeteer from "puppeteer";

// Import Internal Dependencies
import * as CONSTANTS from "../constants.js";
import * as utils from "../utils.js";

export async function PDF(reportHTMLPath, options) {
  const { title, saveOnDisk = true } = options;

  const browser = await puppeteer.launch();

  try {
    const page = await browser.newPage();
    await page.emulateMediaType("print");
    await page.goto(`file:${reportHTMLPath}`, {
      waitUntil: "networkidle0",
      timeout: 60_000
    });

    const pdfBuffer = await page.pdf({
      path: saveOnDisk ? path.join(
        CONSTANTS.DIRS.REPORTS,
        utils.cleanReportName(title, ".pdf")
      ) : undefined,
      format: "A4",
      printBackground: true
    });

    return saveOnDisk ? path : pdfBuffer;
  }
  finally {
    await browser.close();
  }
}

