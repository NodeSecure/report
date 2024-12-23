// Import Node.js Dependencies
import path from "node:path";

// Import Third-party Dependencies
import filenamify from "filenamify";

export function cleanReportName(
  name: string,
  extension: string | null = null
): string {
  const cleanName = filenamify(name);
  if (extension === null) {
    return cleanName;
  }

  return path.extname(cleanName) === extension ?
    cleanName :
    `${cleanName}${extension}`;
}
