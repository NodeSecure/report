// Import Node.js Dependencies
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
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

describe("(API) report", () => {
  test("Given a scanner Payload it should successfully generate a PDF", async() => {
    const reportLocation = await fs.mkdtemp(
      path.join(os.tmpdir(), "test-runner-report-pdf-")
    );

    const payload = await from("sade");

    const generatedPDF = await report(
      payload.dependencies,
      structuredClone(kReportPayload),
      reportLocation
    );
    try {
      assert.ok(Buffer.isBuffer(generatedPDF));
      assert.ok(isPDF(generatedPDF));

      const files = (await fs.readdir(reportLocation, { withFileTypes: true }))
        .flatMap((dirent) => (dirent.isFile() ? [dirent.name] : []));
      assert.deepEqual(
        files,
        ["test_runner.html"]
      );
    }
    finally {
      await fs.rm(reportLocation, { force: true, recursive: true });
    }
  });
});

function isPDF(buf) {
  return (
    Buffer.isBuffer(buf) && buf.lastIndexOf("%PDF-") === 0 && buf.lastIndexOf("%%EOF") > -1
  );
}
