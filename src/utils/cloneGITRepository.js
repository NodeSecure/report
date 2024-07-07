// Import Node.js Dependencies
import fs from "node:fs";

// Import Third-party Dependencies
import git from "isomorphic-git";
import http from "isomorphic-git/http/node/index.js";

/**
 * @async
 * @function cloneGITRepository
 * @description clone a given repository from github
 * @param {!string} dir
 * @param {!string} url
 *
 * @returns {Promise<string>}
 */
export async function cloneGITRepository(
  dir,
  url
) {
  await git.clone({
    fs,
    http,
    dir,
    url,
    token: process.env.GIT_TOKEN,
    singleBranch: true,
    oauth2format: "github"
  });

  return dir;
}
