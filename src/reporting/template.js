// Import Node.js Dependencies
import path from "node:path";
import { readFileSync } from "node:fs";

// Import Third-party Dependencies
import compile from "zup";

// Import Internal Dependencies
import * as utils from "../utils/index.js";
import * as CONSTANTS from "../constants.js";
import * as localStorage from "../localStorage.js";

const kHTMLStaticTemplate = readFileSync(
  path.join(CONSTANTS.DIRS.VIEWS, "template.html"),
  "utf8"
);

export class HTMLTemplateGenerator {
  constructor(
    payload,
    config = null
  ) {
    this.payload = payload;
    this.config = config;
  }

  render(options = {}) {
    const { asset_location = "../asset" } = options;

    const config = this.config ?? localStorage.getConfig().report;
    const compiledTemplate = compile(kHTMLStaticTemplate);

    /** @type {string} */
    const html = compiledTemplate({
      ...this.payload,
      asset_location
    });

    const charts = [
      ...utils.generateChartArray(
        this.payload.npm_stats,
        this.payload.git_stats,
        config
      )
    ].join("\n");

    return html
      .concat(`\n<script>\ndocument.addEventListener("DOMContentLoaded", () => {\n${charts}\n});\n</script>`);
  }
}
