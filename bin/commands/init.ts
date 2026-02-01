// Import Third-party Dependencies
import * as rc from "@nodesecure/rc";

// Import Internal Dependencies
import * as utils from "../../src/utils/index.ts";

const { formatter } = utils;

export async function init() {
  const configLocation = process.cwd();

  const result = await rc.read(configLocation, {
    createIfDoesNotExist: true,
    createMode: "report"
  });

  if (result.ok) {
    console.log(formatter.green.bold(
      "Successfully generated NodeSecure runtime configuration at current location\n"
    ));
  }
  else {
    throw new Error(
      `Unable to initialize NodeSecure runtime configuration at '${configLocation}'`,
      { cause: result.val }
    );
  }
}
