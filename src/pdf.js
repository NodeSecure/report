"use strict";

// Require Node.js Dependencies
const { join } = require("path");
const { mkdir } = require("fs").promises;

// Require Third-party Dependencies
const puppeteer = require("puppeteer");

// Require Internal Dependencies
const config = require("../data/config.json");
const { cleanReportName } = require("./utils.js");

// CONSTANTS
const kDistDir = join(__dirname, "..", "reports");

async function generatePDF(reportHTMLPath, name = config.report_title) {
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

        const path = join(kDistDir, cleanName);
        await page.pdf({
            path, format: "A4", printBackground: true
        });

        return path;
    }
    finally {
        browser.close();
    }
}

module.exports = { generatePDF };
