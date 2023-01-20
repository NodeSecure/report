// Import Node.js Dependencies
import path from "node:path";

// Import Third-party Dependencies
import puppeteer from "puppeteer";

// Import Internal Dependencies
import * as CONSTANTS from "../constants.js";
import * as utils from "../utils.js";

export async function PDF(reportHTMLPath, options) {
  const { title } = options;

  const browser = await puppeteer.launch();

  try {
    const page = await browser.newPage();
    await page.emulateMediaType("print");
    await page.goto(`file:${reportHTMLPath}`, {
      waitUntil: "networkidle0",
      timeout: 60_000
    });

    await page.pdf({
      path: path.join(
        CONSTANTS.DIRS.REPORTS,
        utils.cleanReportName(title, ".pdf")
      ),
      format: "A4",
      printBackground: true
    });

    return path;
  }
  finally {
    await browser.close();
  }
}

