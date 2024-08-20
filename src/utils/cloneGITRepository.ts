// Import Node.js Dependencies
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFilePromise = promisify(execFile);
/**
 * @async
 * @function cloneGITRepository
 * @description clone a given repository from github
 * @param {!string} dir
 * @param {!string} url
 *
 * @returns {Promise<string>}
 */
export async function cloneGITRepository(dir: string, url: string): Promise<string> {
  const oauthUrl = url.replace("https://", `https://oauth2:${process.env.GIT_TOKEN}@`);

  await execFilePromise("git", ["clone", oauthUrl, dir]);

  return dir;
}
