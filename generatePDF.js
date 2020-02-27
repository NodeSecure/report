"use strict";

const { join } = require("path");
const puppeteer = require("puppeteer");

const report = join(__dirname, "/views/index.html");

async function main() {
    const browser = await puppeteer.launch();
    try {
        const page = await browser.newPage();
        await page.emulateMedia("print");

        await page.goto(`file:${report}`, { waitUntil: "networkidle2" });
        await page.pdf({
            path: "report.pdf",
            format: "A4",
            printBackground: true
        });
    }
    finally {
        browser.close();
    }
}
main().catch(console.error);
