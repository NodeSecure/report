// Import Node.js Dependencies
import path from "node:path";
import { readFileSync } from "node:fs";

// Import Third-party Dependencies
import compile from "zup";
import type { RC } from "@nodesecure/rc";

// Import Internal Dependencies
import * as utils from "../utils/index.ts";
import * as CONSTANTS from "../constants.ts";
import * as localStorage from "../localStorage.ts";
import type { ReportStat } from "../analysis/extractScannerData.ts";

const kHTMLStaticTemplate = readFileSync(
  path.join(CONSTANTS.DIRS.VIEWS, "template.html"),
  "utf8"
);

export interface HTMLTemplateGeneratorPayload {
  report_theme: string;
  report_title: string;
  report_logo: string | undefined;
  report_date: string;
  npm_stats: ReportStat | null;
  git_stats: ReportStat | null;
  charts: any[];
}

export interface HTMLTemplateGenerationRenderOptions {
  asset_location?: string;
}

export class HTMLTemplateGenerator {
  public payload: HTMLTemplateGeneratorPayload;
  public config: RC["report"] | null;

  constructor(
    payload: HTMLTemplateGeneratorPayload,
    config: RC["report"] | null = null
  ) {
    this.payload = payload;
    this.config = config;
  }

  render(
    options: HTMLTemplateGenerationRenderOptions = {}
  ) {
    const { asset_location = "../dist" } = options;

    const config = this.config ?? localStorage.getConfig().report;
    const compiledTemplate = compile(kHTMLStaticTemplate);

    const html = compiledTemplate({
      ...this.payload,
      asset_location
    }) as string;

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
