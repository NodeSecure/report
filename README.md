<p align="center">
  <img src="https://user-images.githubusercontent.com/4438263/226182740-5da22495-8a32-4d5e-b5b3-95cafcd13d38.jpg" alt="@nodesecure/report">
</p>

<div align="center">

![version](https://img.shields.io/badge/dynamic/json.svg?style=for-the-badge&url=https://raw.githubusercontent.com/NodeSecure/report/master/package.json&query=$.version&label=Version)
[![OpenSSF
Scorecard](https://api.securityscorecards.dev/projects/github.com/NodeSecure/report/badge?style=for-the-badge)](https://api.securityscorecards.dev/projects/github.com/NodeSecure/report)
![MIT](https://img.shields.io/github/license/NodeSecure/report.svg?style=for-the-badge)
![size](https://img.shields.io/github/languages/code-size/NodeSecure/report?style=for-the-badge)

</div>

This project is designed to generate periodic security reports in both HTML and PDF formats. It leverages the [@nodesecure/scanner](https://github.com/NodeSecure/scanner) to retrieve all necessary data.

|               Screen1                |               Screen2                |
| :----------------------------------: | :----------------------------------: |
| ![](https://i.imgur.com/Jhr76Ef.jpg) | ![](https://i.imgur.com/OmV7Al6.jpg) |

## Features

- Automatically clones and scans Git repositories using **scanner.cwd**.
- Provides a visual overview of **security threats** and quality issues for multiple Git or NPM packages.
- Facilitates visualization of changes over time.
- Generates reports in both **HTML** and **PDF** formats.

## Requirements

- [Node.js](https://nodejs.org/en/) v24 or higher.

## Getting Started

This package is available in the Node Package Repository and can be easily installed with [npm](https://docs.npmjs.com/getting-started/what-is-npm) or [yarn](https://yarnpkg.com).

```bash
$ git clone https://github.com/NodeSecure/report.git
$ cd report
$ npm i
$ npm run build
$ npm link
```

After installation, the `nreport` binary will be available in your terminal.

```bash
nreport initialize
nreport execute
```

> [!CAUTION]
> Please read the following sections to understand how to properly set up the configuration. The **initialize** command generates an incomplete basic template.

### Environment Variables

To configure the project you have to register (set) environment variables on your system. These variables can be set in a **.env** file (that file must be created at the root of the project).

```
GIT_TOKEN=
NODE_SECURE_TOKEN=
```

To known how to get a **GIT_TOKEN** or how to register environment variables follow our [Governance Guide](https://github.com/SlimIO/Governance/blob/master/docs/tooling.md#environment-variables).

> [!NOTE]
> For NODE_SECURE_TOKEN, please check the [NodeSecure CLI documentation](https://github.com/NodeSecure/cli?tab=readme-ov-file#private-registry--verdaccio).

### Configuration Example (.nodesecurerc)

This uses the official NodeSecure [runtime configuration](https://github.com/NodeSecure/rc) (`@nodesecure/rc`) under the hood.

```json
{
  "version": "1.0.0",
  "i18n": "english",
  "strategy": "github-advisory",
  "report": {
    "title": "NodeSecure Security Report",
    "logoUrl": "https://avatars.githubusercontent.com/u/85318671?s=200&v=4",
    "theme": "light",
    "includeTransitiveInternal": false,
    "reporters": ["html", "pdf"],
    "npm": {
      "organizationPrefix": "@nodesecure",
      "packages": ["@nodesecure/js-x-ray"]
    },
    "git": {
      "organizationUrl": "https://github.com/NodeSecure",
      "repositories": ["vulnera"]
    },
    "charts": [
      {
        "name": "Extensions",
        "display": true,
        "interpolation": "d3.interpolateRainbow",
        "type": "bar"
      },
      {
        "name": "Licenses",
        "display": true,
        "interpolation": "d3.interpolateCool",
        "type": "bar"
      },
      {
        "name": "Warnings",
        "display": true,
        "type": "horizontalBar",
        "interpolation": "d3.interpolateInferno"
      },
      {
        "name": "Flags",
        "display": true,
        "type": "horizontalBar",
        "interpolation": "d3.interpolateSinebow"
      }
    ]
  }
}
```

The theme can be either `dark` or `light`. Themes are editable in _public/css/themes_ (feel free to PR new themes if you want).

> [!NOTE]
> All D3 scale-chromatic for charts can be found [here](https://github.com/d3/d3-scale-chromatic/blob/master/README.md).

## API

> [!CAUTION]
> The API is ESM only

### report

```ts
function report(
  scannerDependencies: Scanner.Payload["dependencies"],
  reportConfig: ReportConfiguration,
  reportOptions?: ReportOptions
): Promise<Buffer>;
```

Generates and returns a PDF Buffer based on the provided report options and scanner payload.

```ts
/**
 * Configuration dedicated for NodeSecure Report
 * @see https://github.com/NodeSecure/report
 */
export interface ReportConfiguration {
  /**
   * @default `light`
   */
  theme?: "light" | "dark";
  title: string;
  /**
   * URL to a logo to show on the final HTML/PDF Report
   */
  logoUrl?: string;
  /**
   * Show/categorize internal dependencies as transitive
   * @default false
   */
  includeTransitiveInternal?: boolean;
  npm?: {
    /**
     * NPM organization prefix starting with @
     * @example `@nodesecure`
     */
    organizationPrefix: string;
    packages: string[];
  };
  git?: {
    /**
     * GitHub organization URL
     * @example `https://github.com/NodeSecure`
     */
    organizationUrl: string;
    /**
     * List of repositories
     * name are enough, no need to provide .git URL or any equivalent
     */
    repositories: string[];
  };
  /**
   * @default html,pdf
   */
  reporters?: ("html" | "pdf")[];
  charts?: ReportChart[];
}

export interface ReportChart {
  /**
   * List of available charts.
   */
  name: "Extensions" | "Licenses" | "Warnings" | "Flags";
  /**
   * @default true
   */
  display?: boolean;
  /**
   * Chart.js chart type.
   *
   * @see https://www.chartjs.org/docs/latest/charts
   * @default `bar`
   */
  type?: "bar" | "horizontalBar" | "polarArea" | "doughnut";
  /**
   * D3 Interpolation color. Will be picked randomly by default if not provided.
   * @see https://github.com/d3/d3-scale-chromatic/blob/main/README.md
   */
  interpolation?: string;
}

export interface ReportOptions {
  /**
   * Location where the report will be saved.
   * 
   * If not provided, default to cwd if HTML or PDF is saved on disk, or a temp directory else.
   */
  reportOutputLocation?: string | null;
  /**
   * Save the PDF on disk
   * @default false
   */
  savePDFOnDisk?: boolean;
  /**
   * Save the HTML on disk
   * @default false
   */
  saveHTMLOnDisk?: boolean;
}
```

## Scripts

You can generate a preview of a report using the following NPM scripts

```bash
$ npm run preview:light
$ npm run preview:dark
```

## Debug mode

You can write in the file "reports/debug-pkg-repo.txt", all data generated from NPM package and GIT repository scanners using the following option. Usefull if you want to get a preview from this data set.

```bash
$ nreport exec --debug
```

## Contributors ✨

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-11-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://www.linkedin.com/in/thomas-gentilhomme/"><img src="https://avatars.githubusercontent.com/u/4438263?v=4?s=100" width="100px;" alt="Gentilhomme"/><br /><sub><b>Gentilhomme</b></sub></a><br /><a href="https://github.com/NodeSecure/report/commits?author=fraxken" title="Code">💻</a> <a href="https://github.com/NodeSecure/report/commits?author=fraxken" title="Documentation">📖</a> <a href="https://github.com/NodeSecure/report/pulls?q=is%3Apr+reviewed-by%3Afraxken" title="Reviewed Pull Requests">👀</a> <a href="#security-fraxken" title="Security">🛡️</a> <a href="https://github.com/NodeSecure/report/issues?q=author%3Afraxken" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Kawacrepe"><img src="https://avatars.githubusercontent.com/u/40260517?v=4?s=100" width="100px;" alt="Vincent Dhennin"/><br /><sub><b>Vincent Dhennin</b></sub></a><br /><a href="https://github.com/NodeSecure/report/commits?author=Kawacrepe" title="Code">💻</a> <a href="https://github.com/NodeSecure/report/commits?author=Kawacrepe" title="Documentation">📖</a> <a href="https://github.com/NodeSecure/report/pulls?q=is%3Apr+reviewed-by%3AKawacrepe" title="Reviewed Pull Requests">👀</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Rossb0b"><img src="https://avatars.githubusercontent.com/u/39910164?v=4?s=100" width="100px;" alt="Nicolas Hallaert"/><br /><sub><b>Nicolas Hallaert</b></sub></a><br /><a href="https://github.com/NodeSecure/report/commits?author=Rossb0b" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Max2810"><img src="https://avatars.githubusercontent.com/u/53535185?v=4?s=100" width="100px;" alt="Max"/><br /><sub><b>Max</b></sub></a><br /><a href="https://github.com/NodeSecure/report/commits?author=Max2810" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/fabnguess"><img src="https://avatars.githubusercontent.com/u/72697416?v=4?s=100" width="100px;" alt="Kouadio Fabrice Nguessan"/><br /><sub><b>Kouadio Fabrice Nguessan</b></sub></a><br /><a href="#maintenance-fabnguess" title="Maintenance">🚧</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/halcin"><img src="https://avatars.githubusercontent.com/u/7302407?v=4?s=100" width="100px;" alt="halcin"/><br /><sub><b>halcin</b></sub></a><br /><a href="https://github.com/NodeSecure/report/issues?q=author%3Ahalcin" title="Bug reports">🐛</a> <a href="https://github.com/NodeSecure/report/commits?author=halcin" title="Code">💻</a> <a href="#a11y-halcin" title="Accessibility">️️️️♿️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/PierreDemailly"><img src="https://avatars.githubusercontent.com/u/39910767?v=4?s=100" width="100px;" alt="PierreDemailly"/><br /><sub><b>PierreDemailly</b></sub></a><br /><a href="https://github.com/NodeSecure/report/commits?author=PierreDemailly" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/lilleeleex"><img src="https://avatars.githubusercontent.com/u/55240847?v=4?s=100" width="100px;" alt="Lilleeleex"/><br /><sub><b>Lilleeleex</b></sub></a><br /><a href="https://github.com/NodeSecure/report/commits?author=lilleeleex" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.linkedin.com/in/nk-3906b7206/"><img src="https://avatars.githubusercontent.com/u/46855953?v=4?s=100" width="100px;" alt="Nishi"/><br /><sub><b>Nishi</b></sub></a><br /><a href="https://github.com/NodeSecure/report/commits?author=Nishi46" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/orlando1108"><img src="https://avatars.githubusercontent.com/u/22614778?v=4?s=100" width="100px;" alt="Erwan Raulo"/><br /><sub><b>Erwan Raulo</b></sub></a><br /><a href="https://github.com/NodeSecure/report/commits?author=orlando1108" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://jmclery.dev"><img src="https://avatars.githubusercontent.com/u/1759179?v=4?s=100" width="100px;" alt="Jean-Marie Cléry"/><br /><sub><b>Jean-Marie Cléry</b></sub></a><br /><a href="https://github.com/NodeSecure/report/commits?author=jmpp" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

## License

MIT
