/**
 * Auth page URLs: always absolute, anchored to site root via js/ location.
 * js/auth-paths.js lives one level below root, so import.meta.url works from
 * any page depth (index, modules/*, pages/*, or deeper paths later).
 *
 * window.location.origin alone is not enough on subpath deploys
 * (e.g. origin + "/pages/login.html" misses the /sql-tutorial/ prefix).
 */

const SITE_ROOT = new URL("../", import.meta.url);

export function getAuthPaths() {
  return {
    login: new URL("pages/login.html", SITE_ROOT).href,
    profile: new URL("pages/profile.html", SITE_ROOT).href,
  };
}

export function loginUrlWithReturn(returnTo) {
  const url = new URL(getAuthPaths().login);
  if (returnTo) {
    url.searchParams.set("returnTo", returnTo);
  }
  return url.href;
}

export function currentPathWithQuery() {
  return window.location.pathname + window.location.search + window.location.hash;
}
