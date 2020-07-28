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
$ npm start
```

The report will be generated in the root folder `reports`.

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

> All D3 scale-chromatic can be found [here](https://github.com/d3/d3-scale-chromatic/blob/master/README.md).

## Dependencies

|Name|Refactoring|Security Risk|Usage|
|---|---|---|---|
|[@slimio/async-cli-spinner](https://github.com/SlimIO/Async-cli-spinner)|Minor|Low|Elegant Asynchronous Terminal (CLI) Spinner|
|[@slimio/lock](https://github.com/SlimIO/Lock)|Minor|Low|Semaphore for async/await|
|[@slimio/utils](https://github.com/SlimIO/Utils)|Minor|Low|Bunch of useful functions for SlimIO|
|[dotenv](https://github.com/motdotla/dotenv)|Minor|Low|Loads environment variables from .env|
|[filenamify](https://github.com/sindresorhus/filenamify#readme)|Minor|High|Convert a string to a valid safe filename|
|[isomorphic-git](https://isomorphic-git.org/)|Minor|High|A pure JavaScript implementation of git for node and browsers!|
|[kleur](https://github.com/lukeed/kleur)|Minor|Low|The fastest Node.js library for formatting terminal text with ANSI colors|
|[make-promises-safe](https://github.com/mcollina/make-promises-safe)|⚠️Major|Low|Force Node.js [DEP00018](https://nodejs.org/dist/latest-v8.x/docs/api/deprecations.html#deprecations_dep0018_unhandled_promise_rejections)|
|[nsecure](https://github.com/ES-Community/node-secure#readme)|Minor|High|Node.js security CLI / API that allow you to deeply analyze the dependency tree of a given package / directory|
|[puppeteer](https://github.com/puppeteer/puppeteer#readme)|Minor|High|Puppeteer is a Node library which provides a high-level API to control Chrome or Chromium|
|[zup](https://github.com/mscdex/zup#readme)|Minor|Low|A simple and fast template engine for Node.js|

## License
MIT
