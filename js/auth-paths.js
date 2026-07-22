/**
 * Auth page URLs: always absolute, using Vite's BASE_URL for subpath deploys
 * (e.g. https://alston13r.github.io/sql-tutorial/).
 */

function siteUrl(path) {
  const base = import.meta.env.BASE_URL;
  const normalized = path.replace(/^\//, "");
  return new URL(normalized, window.location.origin + base).href;
}

export function getAuthPaths() {
  return {
    login: siteUrl("pages/login.html"),
    profile: siteUrl("pages/profile.html"),
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
