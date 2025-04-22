// Import Node.js Dependencies
import path from "node:path";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";

// Import Third-party Dependencies
import open from "open";

// Import Internal Dependencies
import { HTMLTemplateGenerator } from "../src/reporting/template.js";
import { buildFrontAssets } from "../src/reporting/html.js";

// CONSTANTS
const kPreviewDir = path.join(import.meta.dirname, "..", "preview");

const { values: cliArgs } = parseArgs({
  options: {
    theme: {
      type: "string",
      short: "t",
      default: "light",
      multiple: false
    }
  },
  allowPositionals: true,
  strict: true
});
const { theme } = cliArgs;

rmSync(
  kPreviewDir,
  { force: true, recursive: true }
);
mkdirSync(
  kPreviewDir,
  { recursive: true }
);

const payload = (await import(
  "./nodesecure_payload.json",
  { with: { type: "json" } }
)).default;
payload.report_theme = theme;

const config = {
  theme: theme as ("light" | "dark"),
  includeTransitiveInternal: false,
  reporters: ["html" as const],
  npm: {
    organizationPrefix: "@nodesecure",
    packages: ["@nodesecure/js-x-ray"]
  },
  git: {
    organizationUrl: "https://github.com/NodeSecure",
    repositories: []
  },
  charts: [
    {
      name: "Extensions" as const,
      display: true,
      interpolation: "d3.interpolateRainbow",
      type: "bar" as const
    },
    {
      name: "Licenses" as const,
      display: true,
      interpolation: "d3.interpolateCool",
      type: "bar" as const
    },
    {
      name: "Warnings" as const,
      display: true,
      type: "horizontalBar" as const,
      interpolation: "d3.interpolateInferno"
    },
    {
      name: "Flags" as const,
      display: true,
      type: "horizontalBar" as const,
      interpolation: "d3.interpolateSinebow"
    }
  ],
  title: "nodesecure",
  logoUrl: "https://avatars0.githubusercontent.com/u/29552883?s=200&v=4",
  showFlags: true
};

const HTMLReport = new HTMLTemplateGenerator(
  payload,
  config
).render({ asset_location: "./dist" });

const previewLocation = path.join(kPreviewDir, "preview.html");
writeFileSync(
  previewLocation,
  HTMLReport
);

await buildFrontAssets(
  path.join(kPreviewDir, "dist"),
  { theme }
);

await open(previewLocation);
