// Import Node.js Dependencies
import path from "node:path";
import fs from "node:fs/promises";

// Import Third-party Dependencies
import { Mutex } from "@openally/mutex";
import * as scanner from "@nodesecure/scanner";

// Import Internal Dependencies
import * as CONSTANTS from "../constants.ts";

// CONSTANTS
const kMaxAnalysisLock = new Mutex({ concurrency: 2 });

export async function from(
  packageName: string
): Promise<string | null> {
  const release = await kMaxAnalysisLock.acquire();

  try {
    const name = `${packageName}.json`;
    const { dependencies } = await scanner.from(packageName, {
      maxDepth: 4,
      vulnerabilityStrategy: "none"
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

export async function cwd(
  dir: string
): Promise<string | null> {
  const release = await kMaxAnalysisLock.acquire();

  try {
    const name = `${path.basename(dir)}.json`;
    const { dependencies } = await scanner.cwd(dir, {
      maxDepth: 4,
      vulnerabilityStrategy: "none"
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
