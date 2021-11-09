// Require Node.js Dependencies
import fs, { promises } from "fs";

export const config = fs.readFileSync(new URL("../data/config.json", import.meta.url));
export const KConfigName = "nreport-config.json";

export async function createConfigFile() {
  try {
    promises.writeFile(`${process.cwd()}/${KConfigName}`, config);
  }
  catch (err) {
    console.error(err);
  }
}

