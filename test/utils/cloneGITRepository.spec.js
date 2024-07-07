// Import Node.js Dependencies
import { describe, it } from "node:test";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import assert from "node:assert";

// Import Internal Dependencies
import { cloneGITRepository } from "../../src/utils/index.js";

describe("cloneGITRepository", () => {
  it("should clone a remote GIT repository", async() => {
    const dest = await fs.mkdtemp(
      path.join(os.tmpdir(), "nsecure-report-git-")
    );

    try {
      const dir = await cloneGITRepository(
        dest,
        "https://github.com/NodeSecure/Governance.git"
      );

      assert.strictEqual(dir, dest);
      const files = (await fs.readdir(dest, { withFileTypes: true }))
        .flatMap((dirent) => dirent.isFile() ? [dirent.name] : []);

      assert.ok(files.includes("CODE_OF_CONDUCT.md"));
      assert.ok(files.includes("README.md"));
    }
    finally {
      await fs.rm(dest, { force: true, recursive: true });
    }
  });
});
