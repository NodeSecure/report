#!/usr/bin/env node --no-warnings

// Import Node.js Dependencies
import fs from "fs";

// Import Third-party Dependencies
import sade from "sade";
import kleur from "kleur";

// Import Internal Dependencies
import * as commands from "./commands/index.js";

// CONSTANTS
const kManifestFile = JSON.parse(
  fs.readFileSync(new URL("../package.json", import.meta.url))
);

console.log(kleur.grey().bold(`\n > Executing nreport at: ${kleur.yellow().bold(process.cwd())}\n`));

const cli = sade("report").version(kManifestFile.version);

cli
  .command("execute")
  .alias("exec")
  .describe("Execute report at the current working dir with current configuration.")
  .example("nreport exec")
  .action(commands.execute);

cli
  .command("initialize")
  .alias("init")
  .describe("Initialize default report configuration")
  .example("nreport init")
  .action(commands.init);

cli.parse(process.argv);
