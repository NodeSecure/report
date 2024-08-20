// Import Node.js Dependencies
import path from "node:path";
import { readFileSync } from "node:fs";

// Import Third-party Dependencies
import compile from "zup";

// Import Internal Dependencies
import * as utils from "../utils/index.js";
import * as CONSTANTS from "../constants.js";
import * as localStorage from "../localStorage.js";
import { type ReportStat } from "../analysis/extractScannerData.js";
import { } from "@nodesecure/rc";

interface TemplateGeneratorPayload {
  report_theme: string;
  report_title: string | undefined;
  report_logo: string | undefined;
  report_date: Intl.DateTimeFormat;
  npm_stats: ReportStat;
  git_stats: ReportStat;
  charts: ReportChart;
}

interface RenderOptions {
  asset_location?: string
}

const kHTMLStaticTemplate = readFileSync(
  path.join(CONSTANTS.DIRS.VIEWS, "template.html"),
  "utf8"
);

export class HTMLTemplateGenerator {
  constructor(
    private readonly payload: TemplateGeneratorPayload,
    private readonly config = null
  ) {
    this.payload = payload;
    this.config = config;
  }

  render(options: RenderOptions = {}) {
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
