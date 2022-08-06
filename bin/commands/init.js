// Import Third-party Dependencies
import * as rc from "@nodesecure/rc";

export async function init() {
  const configLocation = process.cwd();

  const { ok } = await rc.read(configLocation, {
    createIfDoesNotExist: true,
    createMode: "report"
  });

  if (!ok) {
    throw new Error(
      `Unable to initialize NodeSecure runtime configuration at '${configLocation}'`
    );
  }
}
