#!/usr/bin/env node --no-warnings

// Import Node.js Dependencies
import fs from "node:fs";

// Import Third-party Dependencies
import sade from "sade";
import kleur from "kleur";

// Import Internal Dependencies
import * as commands from "./commands/index.ts";

console.log(kleur.grey().bold(`\n > Executing nreport at: ${kleur.yellow().bold(process.cwd())}\n`));

const { version } = JSON.parse(
  fs.readFileSync(new URL("../package.json", import.meta.url), "utf-8")
);
const cli = sade("nreport").version(version);

cli
  .command("execute")
  .option("-d, --debug", "Enable debug mode", false)
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
