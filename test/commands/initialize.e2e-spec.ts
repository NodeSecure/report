// Import Node.js Dependencies
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { before, describe, it } from "node:test";
import assert from "node:assert";
import { stripVTControlCharacters } from "node:util";

// Import Internal Dependencies
import { runProcess } from "../helpers/reportCommandRunner.js";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kBinDir = path.join(__dirname, "../..", "dist/bin/index.js");
const kProcessDir = os.tmpdir();
const kConfigFilePath = path.join(kProcessDir, ".nodesecurerc");

describe("Report init command if config does not exists", () => {
  before(() => {
    if (fs.existsSync(kConfigFilePath)) {
      fs.unlinkSync(kConfigFilePath);
    }
  });

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
      args: [kBinDir, "initialize"],
      cwd: kProcessDir
    };

    for await (const line of runProcess(processOptions)) {
      const regexp = lines.shift();
      assert.ok(regexp, "we are expecting this line");
      assert.ok(regexp.test(stripVTControlCharacters(line)), `line (${line}) matches ${regexp}`);
    }

    // to prevent false positive if no lines have been emitted from process
    assert.equal(lines.length, 0);
  });
});
