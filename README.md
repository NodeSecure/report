# Security
![version](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/SlimIO/security/master/package.json&query=$.version&label=Version)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/SlimIO/security/commit-activity)
![MIT](https://img.shields.io/github/license/mashape/apistatus.svg)
![dep](https://img.shields.io/david/SlimIO/security)
![size](https://img.shields.io/github/languages/code-size/SlimIO/Security)
![known vulnerabilities](https://img.shields.io/snyk/vulnerabilities/github/SlimIO/Security)
[![Build Status](https://travis-ci.com/SlimIO/Security.svg?branch=master)](https://travis-ci.com/SlimIO/Security)

This project has been created to analyze and detect dependencies security issues with the help of nsecure.

## Requirements
- [Node.js](https://nodejs.org/en/) v12 or higher

## Getting Started

This package is available in the Node Package Repository and can be easily installed with [npm](https://docs.npmjs.com/getting-started/what-is-npm) or [yarn](https://yarnpkg.com).

```bash
$ git clone https://github.com/SlimIO/Security.git
$ cd Security
$ npm ci
$ npm start
```

## Environment Variables

To configure the project you have to register (set) environment variables on your system. These variables can be set in a **.env** file (that file must be created at the root of the project).
```
GIT_TOKEN=
NODE_SECURE_TOKEN=
```

To known how to get a **GIT_TOKEN** or how to register environment variables follow our [Governance Guide](https://github.com/SlimIO/Governance/blob/master/docs/tooling.md#environment-variables).

> For NODE_SECURE_TOKEN, please check the [nsecure documentation](https://github.com/ES-Community/nsecure#fetching-private-packages).

## Dependencies

|Name|Refactoring|Security Risk|Usage|
|---|---|---|---|
|[@slimio/async-cli-spinner](https://github.com/SlimIO/Async-cli-spinner)|Minor|Low|Elegant Asynchronous Terminal (CLI) Spinner|
|[@slimio/lock](https://github.com/SlimIO/Lock)|Minor|Low|Semaphore for async/await|
|[dotenv](https://github.com/motdotla/dotenv)|Minor|Low|Loads environment variables from .env|
|[isomorphic-git](https://isomorphic-git.org/)|Minor|High|A pure JavaScript implementation of git for node and browsers!|
|[kleur](https://github.com/lukeed/kleur)|Minor|Low|The fastest Node.js library for formatting terminal text with ANSI colors|
|[make-promises-safe](https://github.com/mcollina/make-promises-safe)|⚠️Major|Low|Force Node.js [DEP00018](https://nodejs.org/dist/latest-v8.x/docs/api/deprecations.html#deprecations_dep0018_unhandled_promise_rejections)|
|[nsecure](https://github.com/ES-Community/node-secure#readme)|Minor|High|Node.js security CLI / API that allow you to deeply analyze the dependency tree of a given package / directory|

## License
MIT
