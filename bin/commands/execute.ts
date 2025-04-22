// Import Node.js Dependencies
import fs from "node:fs/promises";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { inspect } from "node:util";

// Import Third-party Dependencies
import * as rc from "@nodesecure/rc";
import kleur from "kleur";

// Import Internal Dependencies
import { store } from "../../src/localStorage.js";

import { fetchPackagesAndRepositoriesData } from "../../src/analysis/fetch.js";
import * as CONSTANTS from "../../src/constants.js";
import * as reporting from "../../src/reporting/index.js";

// CONSTANTS
const kReadConfigOptions = {
  createIfDoesNotExist: false,
  createMode: "report"
} as const;

export interface ExecuteOptions {
  debug?: boolean;
}

export async function execute(options: ExecuteOptions = {}) {
  const { debug: debugMode } = options;

  if (debugMode) {
    console.log(kleur.bgMagenta().bold(" > Debug mode enabled \n"));
  }

  const [configResult] = await Promise.all([
    rc.read(process.cwd(), kReadConfigOptions),
    init()
  ]);

  const config = configResult.unwrap();
  const { report } = config;

  if (!report) {
    throw new Error("A valid configuration is required");
  }
  if (!report.reporters || report.reporters.length === 0) {
    throw new Error("At least one reporter must be selected (either 'HTML' or 'PDF')");
  }

  console.log(`>> title: ${kleur.cyan().bold(report.title)}`);
  console.log(`>> reporters: ${kleur.magenta().bold(report.reporters.join(","))}\n`);

  store.run(config, async() => {
    try {
      const data = await fetchPackagesAndRepositoriesData();
      if (debugMode) {
        debug(data);
      }
      await reporting.proceed(data);
      console.log(kleur.green().bold("\n>> Security report successfully generated! Enjoy 🚀.\n"));
    }
    catch (error) {
      console.error(error);
    }
    finally {
      await fs.rm(CONSTANTS.DIRS.CLONES, {
        recursive: true, force: true
      });
    }
  });
}

function init() {
  const directoriesToInitialize = [
    CONSTANTS.DIRS.JSON,
    CONSTANTS.DIRS.CLONES,
    CONSTANTS.DIRS.REPORTS
  ];

  return Promise.all(
    directoriesToInitialize.map((dir) => fs.mkdir(dir, { recursive: true }))
  );
}

function debug(obj: any) {
  const filePath = path.join(CONSTANTS.DIRS.REPORTS, "debug-pkg-repo.txt");
  writeFileSync(filePath, inspect(obj, { showHidden: true, depth: null }), "utf8");
}

