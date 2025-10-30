// Import Node.js Dependencies
import { describe, it } from "node:test";
import assert from "node:assert";

// Import Internal Dependencies
import { cleanReportName } from "../../src/utils/index.ts";

describe("cleanReportName", () => {
  it("should remove invalid Windows characters", () => {
    const invalidStr = "<foo/bar>";

    assert.strictEqual(
      cleanReportName(invalidStr),
      "!foo!bar!"
    );
  });

  it("should add the extension if it's missing from the input", () => {
    const fileName = "foo*bar";

    assert.strictEqual(
      cleanReportName(fileName, ".png"),
      "foo!bar.png"
    );
  });
});
