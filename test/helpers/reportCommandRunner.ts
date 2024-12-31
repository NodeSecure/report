// Import Node.js Dependencies
import { ChildProcess, spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { stripVTControlCharacters } from "node:util";

export async function* runProcess(options) {
  const childProcess = spawnedProcess(options);
  try {
    if (!childProcess.stdout) {
      return;
    }

    const rStream = createInterface(childProcess.stdout);

    for await (const line of rStream) {
      yield stripVTControlCharacters(line);
    }
  }
  finally {
    childProcess.kill();
  }
}

export function filterProcessStdout(options, filter): Promise<string[]> {
  const { resolve, reject, promise } = Promise.withResolvers<string[]>();

  const childProcess = spawnedProcess(options);
  const output = new Set<string>();

  childProcess.stdout?.on("data", (buffer) => {
    filter(buffer).forEach((filteredData) => {
      output.add(filteredData);
    });
  });

  childProcess.on("close", () => {
    resolve(Array.from(output));
  });

  childProcess.on("error", (err) => {
    reject(err);
  });

  return promise;
}

function spawnedProcess(options): ChildProcess {
  const { cmd, args = [], cwd = process.cwd() } = options;

  return spawn(cmd, args, {
    stdio: ["ignore", "pipe", "pipe", "ipc"],
    cwd
  });
}
