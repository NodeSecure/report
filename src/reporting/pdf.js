// Require Node.js Dependencies
import path from "path";

// Require Third-party Dependencies
import puppeteer from "puppeteer";

// Require Internal Dependencies
import * as CONSTANTS from "../constants.js";

export async function generatePDF(reportHTMLPath, name) {
  const browser = await puppeteer.launch();

  try {
    const page = await browser.newPage();
    await page.emulateMediaType("print");
    await page.goto(`file:${reportHTMLPath}`, {
      waitUntil: "networkidle2"
    });

    await page.pdf({
      path: path.join(CONSTANTS.DIRS.REPORTS, `${name}${CONSTANTS.EXTENSIONS.PDF}`),
      format: "A4",
      printBackground: true
    });

    return path;
  }
  finally {
    browser.close();
  }
}

