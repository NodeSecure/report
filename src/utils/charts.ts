// Import Third-party Dependencies
import { taggedString } from "@nodesecure/utils";
import { type ReportStat } from "../analysis/extractScannerData.js";
import { type RC } from "@nodesecure/rc";

type ChartData = ReportStat["licenses"] | ReportStat["flags"] | ReportStat["warnings"] | ReportStat["extensions"];

// CONSTANTS
const kChartTemplate = taggedString`\tcreateChart("${0}", "${4}", { labels: [${1}], interpolate: ${3}, data: [${2}] });`;

// eslint-disable-next-line max-params
function toChart(baliseName: string, data: ChartData, interpolateName: string, type = "bar") {
  const graphLabels = Object
    .keys(data)
    .map((key) => `"${key}"`)
    .join(",");

  return kChartTemplate(
    baliseName,
    graphLabels,
    Object.values(data).join(","),
    interpolateName,
    type
  );
}

export function* generateChartArray(pkgStats: ReportStat, repoStats: ReportStat, config: RC["report"]) {
  const displayableCharts = config?.charts?.filter((chart) => chart.display);

  if (!displayableCharts) {
    return;
  }

  if (pkgStats !== null) {
    for (const chart of displayableCharts) {
      const name: Lowercase<ReportChart["name"]> = toLowerCaseChartName(chart.name);
      yield toChart(`npm_${name}_canvas`, pkgStats[name], chart.interpolation, chart.type);
    }
  }
  if (repoStats !== null) {
    for (const chart of displayableCharts) {
      const name = toLowerCaseChartName(chart.name);
      yield toChart(`git_${name}_canvas`, repoStats[name], chart.interpolation, chart.type);
    }
  }
}

function toLowerCaseChartName(chartName: ReportChart["name"]): Lowercase<NonNullable<RC["report"]>["charts"]["name"]> {
  return chartName.toLowerCase() as Lowercase<ReportChart["name"]>;
}
