// Import Third-party Dependencies
import kleur from "kleur";

// Import Internal Dependencies
import * as utils from "../utils/index.js";
import * as localStorage from "../localStorage.js";

// Import Reporters
import { HTML } from "./html.js";
import { PDF } from "./pdf.js";

export async function proceed(data) {
  const reportHTMLPath = await utils.runInSpinner(
    { title: `[Reporter: ${kleur.yellow().bold("HTML")}]` },
    async(spinner) => HTML({ ...data, spinner })
  );

  const { reporters, title } = localStorage.getConfig().report;
  if (!reporters.includes("pdf")) {
    return;
  }

  await utils.runInSpinner(
    {
      title: `[Reporter: ${kleur.yellow().bold("PDF")}]`,
      start: "Using puppeteer to convert HTML content to PDF"
    },
    async() => PDF(reportHTMLPath, { title })
  );
}

export { HTML, PDF };
