// Require Node.js Dependencies
import { mkdir } from "fs/promises";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Require Third-party Dependencies
import puppeteer from "puppeteer";
// Require Internal Dependencies
import { cleanReportName } from "./utils.js";
const config = JSON.parse(
  fs.readFileSync(new URL("../data/config.json", import.meta.url))
);

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kDistDir = path.join(__dirname, "..", "reports");

export async function generatePDF(reportHTMLPath, name = config.report_title) {
  await mkdir(kDistDir, { recursive: true });
  const cleanName = cleanReportName(name, ".pdf");

  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();
    await page.emulateMediaType("print");

    await page.goto(`file:${reportHTMLPath}`, {
      waitUntil: "networkidle2"
    });
    await page.waitForFunction("window.isReadyForPDF");

    const path = path.join(kDistDir, cleanName);
    await page.pdf({
      path, format: "A4", printBackground: true
    });

    return path;
  }
  finally {
    browser.close();
  }
}

