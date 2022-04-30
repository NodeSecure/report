// Require Node.js Dependencies
import fs from "fs/promises";
import path from "path";

// Require Third-party Dependencies
import puppeteer from "puppeteer";

// Require Internal Dependencies
import { cleanReportName } from "./utils.js";

// CONSTANTS
const kDistDir = path.join(process.cwd(), "reports");

export async function generatePDF(reportHTMLPath, name) {
  await fs.mkdir(kDistDir, { recursive: true });
  const cleanName = cleanReportName(name, ".pdf");

  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();
    await page.emulateMediaType("print");
    await page.goto(`file:${reportHTMLPath}`, {
      waitUntil: "networkidle2"
    });

    await page.pdf({
      path: path.join(kDistDir, cleanName),
      format: "A4",
      printBackground: true
    });

    return path;
  }
  finally {
    browser.close();
  }
}

