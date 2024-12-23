// Import Node.js Dependencies
import path from "node:path";
import { fileURLToPath } from "node:url";

// Import Node.js Dependencies
import * as rc from "@nodesecure/rc";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DIRS = Object.freeze({
  JSON: path.join(rc.homedir(), "json"),
  CLONES: path.join(rc.homedir(), "clones"),
  PUBLIC: path.join(__dirname, "..", "public"),
  THEMES: path.join(__dirname, "..", "public", "css", "themes"),
  VIEWS: path.join(__dirname, "..", "views"),
  REPORTS: path.join(process.cwd(), "reports")
});
