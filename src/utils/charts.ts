// Import Third-party Dependencies
import { taggedString } from "@nodesecure/utils";
import type { RC } from "@nodesecure/rc";

// Import Internal Dependencies
import type { ReportStat } from "../analysis/extractScannerData.js";

// CONSTANTS
const kChartTemplate = taggedString`\tcreateChart("${0}", "${4}", { labels: [${1}], interpolate: ${3}, data: [${2}] });`;

// eslint-disable-next-line max-params
function toChart(
  baliseName: string,
  data: object,
  interpolateName: string | undefined,
  type = "bar"
) {
  const graphLabels = Object
    .keys(data)
    .map((key) => `"${key}"`)
    .join(",");

  return kChartTemplate(
    baliseName,
    graphLabels,
    Object.values(data).join(","),
    interpolateName!,
    type
  );
}

export function* generateChartArray(
  pkgStats: ReportStat | null,
  repoStats: ReportStat | null,
  config: RC["report"]
) {
  const displayableCharts = config?.charts?.filter((chart) => chart.display) ?? [];

  if (pkgStats !== null) {
    for (const chart of displayableCharts) {
      const name = chart.name.toLowerCase();

      yield toChart(
        `npm_${name}_canvas`,
        pkgStats[name],
        chart.interpolation,
        chart.type
      );
    }
  }
  if (repoStats !== null) {
    for (const chart of displayableCharts) {
      const name = chart.name.toLowerCase();

      yield toChart(
        `git_${name}_canvas`,
        repoStats[name],
        chart.interpolation,
        chart.type
      );
    }
  }
}
