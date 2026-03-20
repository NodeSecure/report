// Import Node.js Dependencies
import path from "node:path";

// Import Third-party Dependencies
import * as rc from "@nodesecure/rc";

export const DIRS = Object.freeze({
  JSON: path.join(rc.homedir(), "json"),
  CLONES: path.join(rc.homedir(), "clones"),
  PUBLIC: path.join(import.meta.dirname, "..", "public"),
  THEMES: path.join(import.meta.dirname, "..", "public", "css", "themes"),
  VIEWS: path.join(import.meta.dirname, "..", "views"),
  REPORTS: path.join(process.cwd(), "reports")
});
