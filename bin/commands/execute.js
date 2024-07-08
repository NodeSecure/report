// Import Node.js Dependencies
import fs from "node:fs/promises";

// Import Third-party Dependencies
import * as rc from "@nodesecure/rc";
import kleur from "kleur";

// Import Internal Dependencies
import { store } from "../../src/localStorage.js";

import { fetchPackagesAndRepositoriesData } from "../../src/analysis/fetch.js";
import * as CONSTANTS from "../../src/constants.js";
import * as reporting from "../../src/reporting/index.js";

export async function execute() {
  const [configResult] = await Promise.all([
    rc.read(
      process.cwd()
    ),
    init()
  ]);

  const config = configResult.unwrap();
  const { report } = config;
  if (report.reporters.length === 0) {
    throw new Error("At least one reporter must be selected (either 'HTML' or 'PDF')");
  }

  console.log(`>> title: ${kleur.cyan().bold(report.title)}`);
  console.log(`>> reporters: ${kleur.magenta().bold(report.reporters.join(","))}\n`);

  store.run(config, () => {
    fetchPackagesAndRepositoriesData()
      .then((data) => reporting.proceed(data))
      .catch((error) => {
        console.error(error);
        process.exit(0);
      })
      .finally(teardown);
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

function teardown() {
  console.log(kleur.green().bold("\n>> Security report successfully generated! Enjoy 🚀.\n"));

  return fs.rm(CONSTANTS.DIRS.CLONES, {
    recursive: true, force: true
  });
}
