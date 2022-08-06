// Import Node.js Dependencies
import fs from "node:fs/promises";

// Import Third-party Dependencies
import kleur from "kleur";

// Import Internal Dependencies
import { fetchPackagesAndRepositoriesData } from "./analysis/fetch.js";
import * as localStorage from "./localStorage.js";
import * as CONSTANTS from "./constants.js";
import * as reporting from "./reporting/index.js";

export async function execute(options = Object.create(null)) {
  const { exitOnError = true } = options;

  try {
    await prepareExecute();

    const config = localStorage.getConfig().report;
    if (config.reporters.length === 0) {
      throw new Error("At least one reporter must be selected (either 'HTML' or 'PDF')");
    }

    console.log(`>> ${kleur.cyan().bold(config.title)}`);
    console.log(`>> reporters: ${kleur.magenta().bold(config.reporters.join(","))}\n`);

    const data = await fetchPackagesAndRepositoriesData();
    await reporting.proceed(data);

    console.log(kleur.green().bold("\n>> Security report successfully generated! Enjoy 🚀.\n"));
  }
  catch (error) {
    console.log(kleur.bold().red(error.message));

    if (!exitOnError) {
      throw error;
    }
    setImmediate(() => process.exit(0));
  }
  finally {
    await fs.rm(CONSTANTS.DIRS.CLONES, {
      recursive: true, force: true
    });
  }
}

async function prepareExecute() {
  const directoriesToInitialize = [
    CONSTANTS.DIRS.JSON, CONSTANTS.DIRS.CLONES, CONSTANTS.DIRS.REPORTS
  ];

  await Promise.all(
    directoriesToInitialize.map((dir) => fs.mkdir(dir, { recursive: true }))
  );
}
