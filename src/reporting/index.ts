// Import Third-party Dependencies
import kleur from "kleur";

// Import Internal Dependencies
import * as utils from "../utils/index.ts";
import * as localStorage from "../localStorage.ts";

// Import Reporters
import { HTML, type HTMLReportData } from "./html.ts";
import { PDF } from "./pdf.ts";

export async function proceed(
  data: HTMLReportData,
  verbose = true
): Promise<void> {
  const reportHTMLPath = await utils.runInSpinner(
    {
      title: `[Reporter: ${kleur.yellow().bold("HTML")}]`,
      start: "Building template and assets",
      verbose
    },
    async() => HTML(data)
  );

  const { reporters = [], title } = localStorage.getConfig().report!;
  if (!reporters.includes("pdf")) {
    return;
  }

  await utils.runInSpinner(
    {
      title: `[Reporter: ${kleur.yellow().bold("PDF")}]`,
      start: "Using puppeteer to convert HTML content to PDF",
      verbose
    },
    async() => PDF(reportHTMLPath, { title })
  );
}

export { HTML, PDF };
