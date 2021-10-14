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
console.log(kleur.grey().bold(`\n > ${i18n.getToken("cli.executing_at")}: ${kleur.yellow().bold(process.cwd())}\n`));


prog
  .command("run")
  .describe("Run nodesecure/report")
  .action(runNodesecureReport);

async function runNodesecureReport() {
  const spinner = new Spinner({
    text: kleur.white().bold("Nodesecure/report started", kleur.yellow().bold("nodesecure/report"))
  }).start();

  try {
    await nreport.main();

    const elapsedTime = kleur.cyan(ms(Number(spinner.elapsedTime.toFixed(2))));
    spinner.succeed(white().bold("Nodesecure succeed", elapsedTime));
  }
  catch (err) {
    spinner.failed(err.message);
  }
}
