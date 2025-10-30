// Import Node.js Dependencies
import { describe, test } from "node:test";
import assert from "node:assert";

// Import Internal Dependencies
import { formatNpmPackages } from "../../src/utils/index.ts";

describe("formatNpmPackages", () => {
  test("If no organizationPrefix is provided, it should return the packages list as is.", () => {
    const packages = [
      "@nodesecure/js-x-ray"
    ];
    const formatedPackages = formatNpmPackages("", packages);

    assert.strictEqual(
      formatedPackages,
      packages
    );
  });

  test(`Given an organizationPrefix, it must add the prefix to the packages where it is missing
    and ignore those who already have the prefix.`, () => {
    const packages = [
      "@nodesecure/js-x-ray",
      "scanner"
    ];
    const formatedPackages = formatNpmPackages("@nodesecure", packages);

    assert.notStrictEqual(
      formatedPackages,
      packages
    );
    assert.deepEqual(
      formatedPackages,
      [
        "@nodesecure/js-x-ray",
        "@nodesecure/scanner"
      ]
    );
  });
});
