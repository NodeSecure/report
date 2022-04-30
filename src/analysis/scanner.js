// Import Node.js Dependencies
import path from "path";
import fs from "fs/promises";

// Import Third-party Dependencies
import Lock from "@slimio/lock";
import * as scanner from "@nodesecure/scanner";

// Import Internal Dependencies
import * as CONSTANTS from "../constants.js";

const kMaxAnalysisLock = new Lock({ maxConcurrent: 2 });

/**
 * @async
 * @function from
 * @description run nsecure on a given npm package (on the npm registry).
 * @param {!string} packageName
 * @returns {Promise<string>}
 */
export async function from(packageName) {
  await kMaxAnalysisLock.acquireOne();

  try {
    const name = `${packageName}.json`;
    const { dependencies } = await scanner.from(packageName, {
      maxDepth: 4, verbose: false
    });

    const filePath = path.join(CONSTANTS.DIRS.JSON, name);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(dependencies, null, 2));

    return filePath;
  }
  catch (error) {
    return null;
  }
  finally {
    kMaxAnalysisLock.freeOne();
  }
}

/**
 * @async
 * @function cwd
 * @description run nsecure on a local directory
 * @param {!string} dir
 * @returns {Promise<string>}
 */
export async function cwd(dir) {
  await kMaxAnalysisLock.acquireOne();

  try {
    const name = `${path.basename(dir)}.json`;
    const { dependencies } = await scanner.cwd(dir, {
      maxDepth: 4, verbose: false, usePackageLock: false
    });

    const filePath = path.join(CONSTANTS.DIRS.JSON, name);
    await fs.writeFile(filePath, JSON.stringify(dependencies, null, 2));

    return filePath;
  }
  catch (error) {
    return null;
  }
  finally {
    kMaxAnalysisLock.freeOne();
  }
}
