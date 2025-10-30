// Import Node.js Dependencies
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert";
import { stripVTControlCharacters } from "node:util";

// Import Internal Dependencies
import { filterProcessStdout } from "../helpers/reportCommandRunner.ts";
import * as CONSTANTS from "../../src/constants.ts";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kProcessDir = path.join(__dirname, "../..");

describe("Report execute command", () => {
  afterEach(async() => await fs.rm(CONSTANTS.DIRS.CLONES, {
    recursive: true, force: true
  }));

  it("should execute command on fixture '.nodesecurerc'", async() => {
    const options = {
      cmd: "node",
      args: ["dist/bin/index.ts", "execute"],
      cwd: kProcessDir
    };

    function byMessage(buffer) {
      const message = ".*";
      const afterNonAlphaNum = String.raw`?<=[^a-zA-Z\d\s:]\s`;
      const beforeTime = String.raw`?=\s\d{1,5}.\d{1,4}ms`;
      const withoutDuplicates = String.raw`(?![\s\S]*\1)`;

      const matchMessage = `(${afterNonAlphaNum})(${message})(${beforeTime})|(${afterNonAlphaNum})(${message})`;
      const reg = new RegExp(`(${matchMessage})${withoutDuplicates}`, "g");

      const matchedMessages = stripVTControlCharacters(buffer.toString()).match(reg);

      return matchedMessages ?? [""];
    }

    const expectedLines = [
      `Executing nreport at: ${kProcessDir}`,
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

    const actualLines = await filterProcessStdout(options, byMessage);
    assert.deepEqual(actualLines, expectedLines, "we are expecting these lines");
  });
});
