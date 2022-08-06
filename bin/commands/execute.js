// Import Third-party Dependencies
import * as rc from "@nodesecure/rc";

// Import Internal Dependencies
import { store } from "../../src/localStorage.js";
import * as nreport from "../../src/index.js";

export async function execute() {
  const config = await rc.read(
    process.cwd()
  );

  store.run(config.unwrap(), () => {
    nreport
      .execute()
      .catch(console.error);
  });
}
