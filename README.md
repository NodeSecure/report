# Security

![version](https://img.shields.io/badge/dynamic/json.svg?style=for-the-badge&url=https://raw.githubusercontent.com/NodeSecure/report/master/package.json&query=$.version&label=Version)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg?style=for-the-badge)](https://github.com/NodeSecure/report/commit-activity)
[![OpenSSF
Scorecard](https://api.securityscorecards.dev/projects/github.com/NodeSecure/report/badge?style=for-the-badge)](https://api.securityscorecards.dev/projects/github.com/NodeSecure/report)
![MIT](https://img.shields.io/github/license/mashape/apistatus.svg?style=for-the-badge)
![size](https://img.shields.io/github/languages/code-size/NodeSecure/report?style=for-the-badge)
![known vulnerabilities](https://img.shields.io/snyk/vulnerabilities/github/NodeSecure/report?style=for-the-badge)

Project created to generate periodic security reports (HTML and PDF formats). It use [@nodesecure/scanner](https://github.com/NodeSecure/scanner) under the hood to fetch all required datas.

|               Screen1                |               Screen2                |
| :----------------------------------: | :----------------------------------: |
| ![](https://i.imgur.com/Jhr76Ef.jpg) | ![](https://i.imgur.com/OmV7Al6.jpg) |

## Features

- Automatically clone GIT projects for you.
- Have an overview of several projects (git or npm).
- Ability to visualize changes over weeks.

## Requirements

- [Node.js](https://nodejs.org/en/) v16 or higher.

## Getting Started

This package is available in the Node Package Repository and can be easily installed with [npm](https://docs.npmjs.com/getting-started/what-is-npm) or [yarn](https://yarnpkg.com).

```bash
$ git clone https://github.com/NodeSecure/report.git
$ cd report
$ npm ci
$ npm link
```

Then the nodesecure/report binary will be available in your terminal.

```bash
nreport initialize
nreport execute
```

## Environment Variables

To configure the project you have to register (set) environment variables on your system. These variables can be set in a **.env** file (that file must be created at the root of the project).

```
GIT_TOKEN=
NODE_SECURE_TOKEN=
```

To known how to get a **GIT_TOKEN** or how to register environment variables follow our [Governance Guide](https://github.com/SlimIO/Governance/blob/master/docs/tooling.md#environment-variables).

> For NODE_SECURE_TOKEN, please check the [nsecure documentation](https://github.com/ES-Community/nsecure#fetching-private-packages).

## Configuration example

Under the hood it use the official NodeSecure [runtime configuration](https://github.com/NodeSecure/rc).

```json
{
  "version": "1.0.0",
  "i18n": "english",
  "strategy": "npm",
  "report": {
    "theme": "light",
    "includeTransitiveInternal": false,
    "reporters": ["html", "pdf"],
    "npm": {
      "organizationPrefix": "@nodesecure",
      "packages": ["@nodesecure/js-x-ray"]
    },
    "git": {
      "organizationUrl": "https://github.com/NodeSecure",
      "repositories": []
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
    ],
    "title": "NodeSecure Security Report",
    "logoUrl": "https://avatars.githubusercontent.com/u/85318671?s=200&v=4"
  }
}
```

<details>
<summary>TypeScript definition</summary>

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
  logoUrl: string;
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
     * List of repositories (name are enough, no need to provide .git url or any equivalent)
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
```

</details>

---

The theme can be either `dark` or `light`. Themes are editable in _public/css/themes_ (feel free to PR new themes if you want).

> All D3 scale-chromatic for charts can be found [here](https://github.com/d3/d3-scale-chromatic/blob/master/README.md).

## Contributors ✨

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->

[![All Contributors](https://img.shields.io/badge/all_contributors-4-orange.svg?style=flat-square)](#contributors-)

<!-- ALL-CONTRIBUTORS-BADGE:END -->

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://www.linkedin.com/in/thomas-gentilhomme/"><img src="https://avatars.githubusercontent.com/u/4438263?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Gentilhomme</b></sub></a><br /><a href="https://github.com/NodeSecure/report/commits?author=fraxken" title="Code">💻</a> <a href="https://github.com/NodeSecure/report/commits?author=fraxken" title="Documentation">📖</a> <a href="https://github.com/NodeSecure/report/pulls?q=is%3Apr+reviewed-by%3Afraxken" title="Reviewed Pull Requests">👀</a> <a href="#security-fraxken" title="Security">🛡️</a> <a href="https://github.com/NodeSecure/report/issues?q=author%3Afraxken" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/Kawacrepe"><img src="https://avatars.githubusercontent.com/u/40260517?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Vincent Dhennin</b></sub></a><br /><a href="https://github.com/NodeSecure/report/commits?author=Kawacrepe" title="Code">💻</a> <a href="https://github.com/NodeSecure/report/commits?author=Kawacrepe" title="Documentation">📖</a> <a href="https://github.com/NodeSecure/report/pulls?q=is%3Apr+reviewed-by%3AKawacrepe" title="Reviewed Pull Requests">👀</a></td>
    <td align="center"><a href="https://github.com/Rossb0b"><img src="https://avatars.githubusercontent.com/u/39910164?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Nicolas Hallaert</b></sub></a><br /><a href="https://github.com/NodeSecure/report/commits?author=Rossb0b" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/Max2810"><img src="https://avatars.githubusercontent.com/u/53535185?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Max</b></sub></a><br /><a href="https://github.com/NodeSecure/report/commits?author=Max2810" title="Code">💻</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

## License

MIT
