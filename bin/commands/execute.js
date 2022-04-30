// Import Third-party Dependencies
import * as rc from "@nodesecure/rc";

// Import Internal Dependencies
import * as localStorage from "../../src/localStorage.js";
import * as nreport from "../../index.js";

export async function execute() {
  const configLocation = process.cwd();

  const runtimeConfiguration = (
    await rc.read(configLocation)
  ).unwrap();

  localStorage.run(runtimeConfiguration, executeInAsyncHooks);
}

async function executeInAsyncHooks() {
  await nreport.main();
}
