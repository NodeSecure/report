import dotenv from "dotenv";
dotenv.config();

// Import Node.js Dependencies
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import path from "node:path";
import { beforeEach, describe, it } from "node:test";
import assert from "node:assert";

// Import Third-party Dependencies
import stripAnsi from "strip-ansi";

// Import Internal Dependencies
import { runProcess } from "../helpers/reportCommandRunner.ts";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const processDir = path.join(__dirname, "..", "fixtures");
const configFilePath = path.join(processDir, ".nodesecurerc");

describe("Report init command", async() => {
  beforeEach(async() => await fs.unlink(configFilePath));
  it("should create config if not exists", async() => {
    const lines = [
      /.*/,
      / > Executing nreport at: .*$/,
      /.*/,
      /Successfully generated NodeSecure runtime configuration at current location/,
      /.*/
    ];

    const processOptions = {
      cmd: "node",
      args: ["dist/bin/index.js", "initialize"],
      cwd: processDir
    };

    for await (const line of runProcess(processOptions)) {
      const regexp = lines.shift();
      assert.ok(regexp, "we are expecting this line");
      assert.ok(regexp.test(stripAnsi(line)), `line (${line}) matches ${regexp}`);
    }

    // to avoid false positive if no lines have been emitted from process
    assert.equal(lines.length, 0);
  });
});
