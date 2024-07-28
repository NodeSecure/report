// Import Node.js Dependencies
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import { describe, test } from "node:test";
import assert from "node:assert";

// Import Third-party Dependencies
import { from } from "@nodesecure/scanner";

// Import Internal Dependencies
import { report } from "../../src/index.js";

// CONSTANTS
const kReportPayload = {
  title: "test_runner",
  theme: "light",
  includeTransitiveInternal: false,
  npm: {
    organizationPrefix: null,
    packages: []
  },
  reporters: [
    "pdf"
  ],
  charts: [
    {
      name: "Extensions",
      display: true,
      interpolation: "d3.interpolateRainbow",
      type: "bar"
    },
    {
      name: "Licenses",
      display: true,
      interpolation: "d3.interpolateCool",
      type: "bar"
    },
    {
      name: "Warnings",
      display: true,
      type: "horizontalBar",
      interpolation: "d3.interpolateInferno"
    },
    {
      name: "Flags",
      display: true,
      type: "horizontalBar",
      interpolation: "d3.interpolateSinebow"
    }
  ]
};

describe("(API) report", { concurrency: 1 }, () => {
  test("it should successfully generate a PDF and should not save PDF or HTML", async() => {
    const reportOutputLocation = await fs.mkdtemp(
      path.join(os.tmpdir(), "test-runner-report-pdf-")
    );

    const payload = await from("sade");

    const generatedPDF = await report(
      payload.dependencies,
      structuredClone(kReportPayload),
      { reportOutputLocation }
    );
    try {
      assert.ok(Buffer.isBuffer(generatedPDF));
      assert.ok(isPDF(generatedPDF));

      const files = (await fs.readdir(reportOutputLocation, { withFileTypes: true }))
        .flatMap((dirent) => (dirent.isFile() ? [dirent.name] : []));
      assert.deepEqual(
        files,
        []
      );
    }
    finally {
      await fs.rm(reportOutputLocation, { force: true, recursive: true });
    }
  });

  test("should save HTML when saveHTMLOnDisk is truthy", async() => {
    const reportOutputLocation = await fs.mkdtemp(
      path.join(os.tmpdir(), "test-runner-report-pdf-")
    );

    const payload = await from("sade");

    const generatedPDF = await report(
      payload.dependencies,
      { ...kReportPayload, reporters: ["pdf", "html"] },
      { reportOutputLocation, saveHTMLOnDisk: true }
    );
    try {
      assert.ok(Buffer.isBuffer(generatedPDF));
      assert.ok(isPDF(generatedPDF));

      const files = (await fs.readdir(reportOutputLocation, { withFileTypes: true }))
        .flatMap((dirent) => (dirent.isFile() ? [dirent.name] : []));
      assert.deepEqual(
        files,
        ["test_runner.html"]
      );
    }
    finally {
      await fs.rm(reportOutputLocation, { force: true, recursive: true });
    }
  });

  test("should save PDF when savePDFOnDisk is truthy", async() => {
    const reportOutputLocation = await fs.mkdtemp(
      path.join(os.tmpdir(), "test-runner-report-pdf-")
    );

    const payload = await from("sade");

    const generatedPDFPath = await report(
      payload.dependencies,
      { ...kReportPayload, reporters: ["pdf", "html"] },
      { reportOutputLocation, savePDFOnDisk: true }
    );
    try {
      assert.ok(typeof generatedPDFPath === "string");
      assert.ok(fsSync.existsSync(generatedPDFPath), "when saving PDF, we return the path to the PDF instead of the buffer");

      const files = (await fs.readdir(reportOutputLocation, { withFileTypes: true }))
        .flatMap((dirent) => (dirent.isFile() ? [dirent.name] : []));
      assert.deepEqual(
        files,
        ["test_runner.pdf"]
      );
    }
    finally {
      await fs.rm(reportOutputLocation, { force: true, recursive: true });
    }
  });

  test("should throw when no reporter is enabled", async() => {
    const payload = await from("sade");

    await assert.rejects(
      () => report(payload.dependencies, { ...kReportPayload, reporters: [] }),
      { message: "At least one reporter must be enabled (pdf or html)" }
    );
  });
});

function isPDF(buf) {
  return (
    Buffer.isBuffer(buf) && buf.lastIndexOf("%PDF-") === 0 && buf.lastIndexOf("%%EOF") > -1
  );
}
