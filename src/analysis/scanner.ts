// Import Node.js Dependencies
import path from "path";
import fs from "fs/promises";

// Import Third-party Dependencies
import { Mutex } from "@openally/mutex";
import * as scanner from "@nodesecure/scanner";

// Import Internal Dependencies
import * as CONSTANTS from "../constants.js";

// CONSTANTS
const kMaxAnalysisLock = new Mutex({ concurrency: 2 });

/**
 * @async
 * @function from
 * @description run nsecure on a given npm package (on the npm registry).
 * @param {!string} packageName
 * @returns {Promise<string>}
 */
export async function from(packageName: string): Promise<string | null> {
  const release = await kMaxAnalysisLock.acquire();

  try {
    const name = `${packageName}.json`;
    const { dependencies } = await scanner.from(packageName, {
      maxDepth: 4, vulnerabilityStrategy: "none"
    });

    const filePath = path.join(CONSTANTS.DIRS.JSON, name);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(dependencies, null, 2));

    return filePath;
  }
  catch {
    return null;
  }
  finally {
    release();
  }
}

/**
 * @async
 * @function cwd
 * @description run nsecure on a local directory
 * @param {!string} dir
 * @returns {Promise<string>}
 */
export async function cwd(dir: string): Promise<string | null> {
  const release = await kMaxAnalysisLock.acquire();

  try {
    const name = `${path.basename(dir)}.json`;
    const { dependencies } = await scanner.cwd(dir, {
      maxDepth: 4, vulnerabilityStrategy: "none"
    });

    const filePath = path.join(CONSTANTS.DIRS.JSON, name);
    await fs.writeFile(filePath, JSON.stringify(dependencies, null, 2));

    return filePath;
  }
  catch {
    return null;
  }
  finally {
    release();
  }
}
