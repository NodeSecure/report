// Import Node.js Dependencies
import path from "node:path";

// Import Third-party Dependencies
import filenamify from "filenamify";

/**
 * @function cleanReportName
 * @description clean the report name
 * @param {!string} name
 * @param {string} [extension=null]
 * @returns {string}
 */
export function cleanReportName(
  name,
  extension = null
) {
  const cleanName = filenamify(name);
  if (extension === null) {
    return cleanName;
  }

  return path.extname(cleanName) === extension ?
    cleanName :
    `${cleanName}${extension}`;
}
