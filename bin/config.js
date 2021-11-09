/* eslint-disable no-sync */
// Require Node.js Dependencies
import fs, { promises } from "fs";
import Ajv from "ajv";

const ajv = new Ajv();

const config = fs.readFileSync(new URL("../data/config.json", import.meta.url));
const schema = JSON.parse(fs.readFileSync(new URL("../src/schema/config.json", import.meta.url)));

const KConfigName = "nreport-config.json";

export async function createConfigFile() {
  try {
    promises.writeFile(`${process.cwd()}/${KConfigName}`, config);
  }
  catch (err) {
    console.error(err);
  }
}

export function isValidConfiguration() {
  // check if there is a config file
  if (!fs.existsSync(`${process.cwd()}/${KConfigName}`)) {
    throw new Error("There is no config file, please run `nreport generate-config`");
  }

  // does this file respect the json schema
  const validate = ajv.compile(schema);

  if (validate(config)) {
    return true;
  }

  throw new Error(validate.errors);
}
