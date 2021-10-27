#!/usr/bin/env node

// Import Node.js Dependencies
import fs from "fs";

// Import Third-party Dependencies
import sade from "sade";
import kleur from "kleur";
import Spinner from "@slimio/async-cli-spinner";

// Import internal dependencies
import * as i18n from "@nodesecure/i18n";
import * as nreport from "../index.js";

// Constants
const version = JSON.parse(
  fs.readFileSync(new URL("../package.json", import.meta.url))
);

// Process scripts args
const prog = sade("nodesecure/report").version(version);

async function runNodesecureReport() {
  console.log(kleur.grey().bold(`\n > Nreport starting at: ${kleur.yellow().bold(process.cwd())}\n`));

  try {
    await nreport.main();
  }
  catch (err) {
    console.error(err);
  }
}

prog
  .command("run")
  .describe("Run nodesecure/report")
  .example("nreport run")
  .action(runNodesecureReport);

prog.parse(process.argv);
