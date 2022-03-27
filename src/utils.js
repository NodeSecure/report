// Import Node.js Dependencies
import path from "path";
import fs, { promises } from "fs";
import { fileURLToPath } from "url";

// Import Third-party Dependencies
import Lock from "@slimio/lock";
import git from "isomorphic-git";
import http from "isomorphic-git/http/node/index.js";
import filenamify from "filenamify";
import { from, cwd } from "@nodesecure/scanner";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLONE_DIR = path.join(__dirname, "..", "clones");
const JSON_DIR = path.join(__dirname, "..", "json");

// VARS
const token = process.env.GIT_TOKEN;
const securityLock = new Lock({ maxConcurrent: 2 });

export const config = JSON.parse(
  fs.readFileSync(new URL("../data/config.json", import.meta.url))
);

/**
 * @async
 * @function cloneGITRepository
 * @description clone a given repository from github
 * @param {!string} repositoryName
 * @returns {Promise<string>}
 */
export async function cloneGITRepository(repositoryName) {
  const dir = path.join(CLONE_DIR, repositoryName);
  const url = `${config.git_url}/${repositoryName}.git`;

  await git.clone({
    fs, http, dir, url, token, singleBranch: true, oauth2format: "github"
  });

  return dir;
}

/**
 * @async
 * @function onPackage
 * @description run nsecure on a given npm package (on the npm registry).
 * @param {!string} packageName
 * @returns {Promise<string>}
 */
export async function onPackage(packageName) {
  await securityLock.acquireOne();

  try {
    const name = `${packageName}.json`;
    const { dependencies } = await from(packageName, {
      maxDepth: 4, verbose: false
    });

    const filePath = path.join(JSON_DIR, name);
    await promises.mkdir(path.dirname(filePath), { recursive: true });
    await promises.writeFile(filePath, JSON.stringify(dependencies, null, 2));

    return filePath;
  }
  catch (error) {
    return null;
  }
  finally {
    securityLock.freeOne();
  }
}

/**
 * @async
 * @function onLocalDirectory
 * @description run nsecure on a local directory
 * @param {!string} dir
 * @returns {Promise<string>}
 */
export async function onLocalDirectory(dir) {
  await securityLock.acquireOne();

  try {
    const name = `${path.basename(dir)}.json`;
    const { dependencies } = await cwd(dir, {
      maxDepth: 4, verbose: false, usePackageLock: false
    });

    const filePath = path.join(JSON_DIR, name);
    await promises.writeFile(filePath, JSON.stringify(dependencies, null, 2));

    return filePath;
  }
  catch (error) {
    return null;
  }
  finally {
    securityLock.freeOne();
  }
}

/**
 * @function cleanReportName
 * @description clean the report name
 * @param {!string} name
 * @param {string} [format=null]
 * @returns {string}
 */
export function cleanReportName(name, format = null) {
  const cleanName = filenamify(name);
  if (format === null) {
    return cleanName;
  }

  return path.extname(cleanName) === format ? cleanName : `${cleanName}${format}`;
}

export const nsecure = Object.freeze({
  onPackage, onLocalDirectory
});
