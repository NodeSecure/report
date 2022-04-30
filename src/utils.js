// Import Node.js Dependencies
import path from "path";
import fs from "fs";

// Import Third-party Dependencies
import git from "isomorphic-git";
import http from "isomorphic-git/http/node/index.js";
import filenamify from "filenamify";

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
