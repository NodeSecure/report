// Import Node.js Dependencies
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFilePromise = promisify(execFile);

export async function cloneGITRepository(
  dir: string,
  url: string
): Promise<string> {
  const oauthUrl = url.replace("https://", `https://oauth2:${process.env.GIT_TOKEN}@`);

  await execFilePromise("git", ["clone", oauthUrl, dir]);

  return dir;
}
