/**
 * @param {!string} organizationPrefix
 * @param {string[]} packages
 *
 * @returns {string[]}
 */
export function formatNpmPackages(
  organizationPrefix,
  packages
) {
  if (organizationPrefix === "") {
    return packages;
  }

  // in case the user has already added the organization prefix
  return packages.map((pkg) => (pkg.startsWith(organizationPrefix) ?
    pkg :
    `${organizationPrefix}/${pkg}`)
  );
}
