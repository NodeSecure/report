"use strict";

// Require Node.js Dependencies
const { join, extname } = require("path");
const { mkdir } = require("fs").promises;

// Require Third-party Dependencies
const puppeteer = require("puppeteer");
const filenamify = require("filenamify");

// Require Internal Dependencies
const config = require("../data/config.json");

// CONSTANTS
const kDistDir = join(__dirname, "..", "reports");

async function generatePDF(reportHTMLPath, name = config.report_title) {
    await mkdir(kDistDir, { recursive: true });
    const cleanName = filenamify(name);

    const browser = await puppeteer.launch();
    try {
        const page = await browser.newPage();
        await page.emulateMedia("print");

        await page.goto(`file:${reportHTMLPath}`, {
            waitUntil: "networkidle2"
        });
        await page.waitForFunction("window.isReadyForPDF");

        const path = join(kDistDir, extname(cleanName) === ".pdf" ? cleanName : `${cleanName}.pdf`);
        await page.pdf({
            path,
            format: "A4",
            printBackground: true
        });

        return path;
    }
    finally {
        browser.close();
    }
}

module.exports = { generatePDF };
