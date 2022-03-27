/* eslint-disable max-depth */

// Import Third-party Dependencies
import { formatBytes } from "@nodesecure/utils";
import * as Flags from "@nodesecure/flags";

// CONSTANTS
const kWantedFlags = Flags.getFlags();

export async function fetchStatsFromNsecurePayloads(payloadFiles = []) {
  const stats = {
    size: {
      all: 0, internal: 0, external: 0
    },
    deps: {
      transitive: new Set(),
      node: new Set()
    },
    licenses: {
      Unknown: 0
    },
    flags: {},
    extensions: {},
    warnings: {},
    authors: {},
    packages: {},
    packages_count: {
      all: 0, internal: 0, external: 0
    }
  };

  for (const file of payloadFiles) {
    const buf = await promises.readFile(file);

    /** @type {NodeSecure.Payload} */
    const nsecurePayload = JSON.parse(buf.toString());

    for (const [name, descriptor] of Object.entries(nsecurePayload)) {
      const { versions, metadata } = descriptor;
      const isThird = config.npm_org_prefix === null ? true : !name.startsWith(`${config.npm_org_prefix}/`);

      for (const human of metadata.maintainers) {
        stats.authors[human.email] = Reflect.has(stats.authors, human.email) ? ++stats.authors[human.email] : 1;
      }

      if (!(name in stats.packages)) {
        if (isThird) {
          stats.packages_count.external++;
        }
        stats.packages[name] = { isThird, versions: new Set() };
      }

      const curr = stats.packages[name];
      for (const [localVersion, localDescriptor] of Object.entries(versions)) {
        if (curr.versions.has(localVersion)) {
          continue;
        }
        const { flags, size, composition, license, author, warnings = [] } = localDescriptor;

        stats.size.all += size;
        stats.size[isThird ? "external" : "internal"] += size;

        for (const { kind } of warnings) {
          stats.warnings[kind] = Reflect.has(stats.warnings, kind) ? ++stats.warnings[kind] : 1;
        }

        for (const flag of flags) {
          if (!kWantedFlags.has(flag)) {
            continue;
          }
          stats.flags[flag] = Reflect.has(stats.flags, flag) ? ++stats.flags[flag] : 1;
        }

        (composition.required_builtin || composition.required_nodejs)
          .forEach((dep) => stats.deps.node.add(dep));
        for (const extName of composition.extensions.filter((extName) => extName !== "")) {
          stats.extensions[extName] = Reflect.has(stats.extensions, extName) ? ++stats.extensions[extName] : 1;
        }

        if (typeof license === "string") {
          stats.licenses.Unknown++;
        }
        else {
          for (const licenseName of license.uniqueLicenseIds) {
            stats.licenses[licenseName] = Reflect.has(stats.licenses, licenseName) ?
              ++stats.licenses[licenseName] : 1;
          }
        }

        if ("email" in author) {
          stats.authors[author.email] = Reflect.has(stats.authors, author.email) ?
            ++stats.authors[author.email] : 1;
        }

        curr.versions.add(localVersion);
        const hasIndirectDependencies = flags.includes("hasIndirectDependencies");
        id: if (hasIndirectDependencies) {
          if (!config.include_transitive_internal && name.startsWith(config.npm_org_prefix)) {
            break id;
          }

          stats.deps.transitive.add(`${name}@${localVersion}`);
        }
        curr[localVersion] = { hasIndirectDependencies };
      }
    }
  }

  stats.packages_count.all = Object.keys(stats.packages).length;
  stats.packages_count.internal = stats.packages_count.all - stats.packages_count.external;
  stats.size.all = formatBytes(stats.size.all);
  stats.size.internal = formatBytes(stats.size.internal);
  stats.size.external = formatBytes(stats.size.external);

  return stats;
}

