# Security
![version](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/SlimIO/security/master/package.json&query=$.version&label=Version)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/SlimIO/security/commit-activity)
![MIT](https://img.shields.io/github/license/mashape/apistatus.svg)
![dep](https://img.shields.io/david/SlimIO/security)
![size](https://img.shields.io/github/languages/code-size/SlimIO/Security)
![known vulnerabilities](https://img.shields.io/snyk/vulnerabilities/github/SlimIO/Security)
[![Build Status](https://travis-ci.com/SlimIO/Security.svg?branch=master)](https://travis-ci.com/SlimIO/Security)

Project created to generate periodic security reports (HTML and PDF formats). It use [Node-secure](https://github.com/ES-Community/nsecure) under the hood to fetch all required datas.

Screen1             |  Screen2
:-------------------------:|:-------------------------:
![](https://i.imgur.com/Jhr76Ef.jpg)  |  ![](https://i.imgur.com/OmV7Al6.jpg)

## Goals
- Automatically clone GIT projects for you.
- Have an overview of several projects (git or npm).
- Ability to visualize changes over weeks.
- Being able to go back down to a more complete view (**not yet implemented**).

## Requirements
- [Node.js](https://nodejs.org/en/) v12 or higher.

## Getting Started

This package is available in the Node Package Repository and can be easily installed with [npm](https://docs.npmjs.com/getting-started/what-is-npm) or [yarn](https://yarnpkg.com).

```bash
$ git clone https://github.com/SlimIO/Security.git
$ cd Security
$ npm ci
$ npm link
```

Then the nodesecure/report binary will be available in your terminal. Give it a try with our preconfigured configuration, this will automatically generate pdf/html in your current working directory.

```bash
nreport run
```

## Environment Variables

To configure the project you have to register (set) environment variables on your system. These variables can be set in a **.env** file (that file must be created at the root of the project).
```
GIT_TOKEN=
NODE_SECURE_TOKEN=
```

To known how to get a **GIT_TOKEN** or how to register environment variables follow our [Governance Guide](https://github.com/SlimIO/Governance/blob/master/docs/tooling.md#environment-variables).

> For NODE_SECURE_TOKEN, please check the [nsecure documentation](https://github.com/ES-Community/nsecure#fetching-private-packages).

## Configuration example (for SlimIO)

To generate your own report just edit the `data/config.json` file.

```json
{
    "theme": "dark",
    "report_title": "SlimIO Security Report",
    "report_logo": "https://avatars0.githubusercontent.com/u/29552883?s=200&v=4",
    "npm_org_prefix": "@slimio",
    "npm_packages": [
        "@slimio/addon",
        "@slimio/scheduler",
        "@slimio/config",
        "@slimio/core",
        "@slimio/arg-parser",
        "@slimio/profiles",
        "@slimio/queue",
        "@slimio/sqlite-transaction",
        "@slimio/alert",
        "@slimio/metrics",
        "@slimio/units",
        "@slimio/ipc",
        "@slimio/safe-emitter"
    ],
    "git_url": "https://github.com/SlimIO",
    "git_repositories": [
        "Aggregator",
        "Alerting",
        "Socket",
        "Gate",
        "ihm"
    ],
    "charts": [
        {
            "name": "Extensions",
            "display": true,
            "interpolation": "d3.interpolateRainbow"
        },
        {
            "name": "Licenses",
            "display": true,
            "interpolation": "d3.interpolateCool"
        },
        {
            "name": "Warnings",
            "display": true,
            "interpolation": "d3.interpolateInferno"
        },
        {
            "name": "Flags",
            "display": true,
            "interpolation": "d3.interpolateWarm"
        }
    ]
}
```

The theme can be either `dark` or `light`. Themes are editable in *public/css/themes* (feel free to PR new themes if you want).

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
