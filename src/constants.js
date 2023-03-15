
// Import Node.js Dependencies
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

// TODO: replace this is rc.homedir()
export const homedir = path.join(os.homedir(), "nodesecure");

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DIRS = Object.freeze({
  JSON: path.join(homedir, "json"),
  CLONES: path.join(homedir, "clones"),
  PUBLIC: path.join(__dirname, "..", "public"),
  VIEWS: path.join(__dirname, "..", "views"),
  REPORTS: path.join(process.cwd(), "reports")
});

export const EXTENSIONS = Object.freeze({
  PDF: ".pdf"
});
