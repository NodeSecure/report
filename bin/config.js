// Require Node.js Dependencies
import { readFileSync, existsSync, promises as fs } from "fs";
import Ajv from "ajv";

const ajv = new Ajv();

const config = readFileSync(new URL("../data/config.json", import.meta.url));
const schema = JSON.parse(readFileSync(new URL("../src/schema/config.json", import.meta.url)));

const KConfigName = "nreport-config.json";

export async function createConfigFile() {
  try {
    fs.writeFile(`${process.cwd()}/${KConfigName}`, config);
  }
  catch (err) {
    console.error(err);
  }
}

export function isValidConfiguration() {
  // check if there is a config file
  if (!existsSync(`${process.cwd()}/${KConfigName}`)) {
    throw new Error("There is no config file, please run `nreport generate-config`");
  }

  // does this file respect the json schema
  const validate = ajv.compile(schema);

  if (validate(config)) {
    return true;
  }

  throw new Error(validate.errors);
}
