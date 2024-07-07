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

  return packages.map((pkg) => {
    // in case the user has already added the organization prefix
    return pkg.startsWith(organizationPrefix) ?
      pkg :
      `${organizationPrefix}/${pkg}`;
  });
}
