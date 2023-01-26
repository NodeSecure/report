// Import Node.js Dependencies
import path from "node:path";
import fs from "node:fs";

// Import Third-party Dependencies
import git from "isomorphic-git";
import http from "isomorphic-git/http/node/index.js";
import filenamify from "filenamify";
import { Spinner } from "@topcli/spinner";
import kleur from "kleur";

// Import Internal Dependencies
import * as CONSTANTS from "./constants.js";

/**
 * @async
 * @function cloneGITRepository
 * @description clone a given repository from github
 * @param {!string} repositoryName
 * @param {!string} organizationUrl
 * @returns {Promise<string>}
 */
export async function cloneGITRepository(repositoryName, organizationUrl) {
  const dir = path.join(CONSTANTS.DIRS.CLONES, repositoryName);
  const url = `${organizationUrl}/${repositoryName}.git`;

  await git.clone({
    fs, http, dir, url, token: process.env.GIT_TOKEN, singleBranch: true, oauth2format: "github"
  });

  return dir;
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

export async function runInSpinner(options, asyncHandler) {
  const { title, start = void 0 } = options;

  const spinner = new Spinner()
    .start(start, { withPrefix: `${kleur.gray().bold(title)} - ` });

  try {
    const response = await asyncHandler(spinner);

    const elapsed = `${spinner.elapsedTime.toFixed(2)}ms`;
    spinner.succeed(kleur.white().bold(`successfully executed in ${kleur.green().bold(elapsed)}`));

    return response;
  }
  catch (err) {
    spinner.failed(err.message);

    throw err;
  }
}
