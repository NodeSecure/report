import dotenv from "dotenv";
dotenv.config();

// Import Node.js Dependencies
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert";

// Import Third-party Dependencies
import stripAnsi from "strip-ansi";

// Import Internal Dependencies
import { filterProcessStdout } from "../helpers/reportCommandRunner.js";
import * as CONSTANTS from "../../src/constants.js";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const processDir = path.join(__dirname, "../..");

describe("Report execute command", async() => {
  afterEach(async() => await fs.rm(CONSTANTS.DIRS.CLONES, {
    recursive: true, force: true
  }));

  it("should execute command on fixture '.nodesecurerc'", async() => {
    const options = {
      cmd: "node",
      args: ["dist/bin/index.js", "execute"],
      cwd: processDir
    };

    function byMessage(buffer) {
      const message = `.*`;
      const afterNonAlphaNum = String.raw`?<=[^a-zA-Z\d\s:]\s`;
      const beforeTime = String.raw`?=\s\d{1,5}.\d{1,4}ms`;
      const withoutDuplicates = String.raw`(?![\s\S]*\1)`;

      const matchMessage = `(${afterNonAlphaNum})(${message})(${beforeTime})|(${afterNonAlphaNum})(${message})`;
      const reg = new RegExp(`(${matchMessage})${withoutDuplicates}`, "g");

      const matchedMessages = stripAnsi(buffer.toString()).match(reg);

      return matchedMessages ?? [""];
    }

    const expectedLines = [
      "Executing nreport at: C:\\PERSO\\dev\\report",
      "title: Default report title",
      "reporters: html,pdf",
      "[Fetcher: NPM] - Fetching NPM packages metadata on the NPM Registry",
      "",
      "[Fetcher: NPM] - successfully executed in",
      "[Fetcher: GIT] - Cloning GIT repositories",
      "[Fetcher: GIT] - Fetching repositories metadata on the NPM Registry",
      "[Fetcher: GIT] - successfully executed in",
      "[Reporter: HTML] - Building template and assets",
      "[Reporter: HTML] - successfully executed in",
      "[Reporter: PDF] - Using puppeteer to convert HTML content to PDF",
      "[Reporter: PDF] - successfully executed in",
      "Security report successfully generated! Enjoy 🚀."
    ];

    let actualLines: string[] = [];

    try {
      actualLines = await filterProcessStdout(options, byMessage);
    }
    catch (error) {
      console.log(error);

      assert.fail("Execute command should not throw");
    }

    assert.deepEqual(actualLines, expectedLines, "we are expecting these lines");
  });
});
