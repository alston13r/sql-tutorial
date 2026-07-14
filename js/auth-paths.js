/**
 * Resolve login/profile links relative to the current page location.
 * Site layout: index*.html at root, modules/*.html, pages/login.html + pages/profile.html
 */
export function getAuthPaths() {
  const path = window.location.pathname.replace(/\\/g, "/");

  if (path.includes("/modules/")) {
    return {
      login: "../pages/login.html",
      profile: "../pages/profile.html",
    };
  }

  if (path.includes("/pages/")) {
    return {
      login: "./login.html",
      profile: "./profile.html",
    };
  }

  return {
    login: "pages/login.html",
    profile: "pages/profile.html",
  };
}

export function authPageUrl(relativePath) {
  return new URL(relativePath, window.location.href).href;
}

export function loginUrlWithReturn(returnTo) {
  const url = new URL(getAuthPaths().login, window.location.href);
  if (returnTo) {
    url.searchParams.set("returnTo", returnTo);
  }
  return url.href;
}

export function currentPathWithQuery() {
  return window.location.pathname + window.location.search + window.location.hash;
}
