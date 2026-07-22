const NAV_CONTEXTS = {
  home: {
    brandHref: "index.html",
    links: [
      { href: "pages/practice.html", label: "Practice" },
      { href: "index-path.html", label: "Learning path view", muted: true },
    ],
  },
  path: {
    brandHref: "index.html",
    links: [
      { href: "pages/practice.html", label: "Practice" },
      { href: "index.html", label: "Card grid view", muted: true },
    ],
  },
  module: {
    brandHref: "../index.html",
    links: [{ href: "../pages/practice.html", label: "Practice" }],
  },
  practice: {
    brandHref: "../index.html",
    links: [
      { href: "../index.html", label: "Modules", muted: true },
      { href: "../index-path.html", label: "Learning path", muted: true },
      { href: "practice.html", label: "Practice", active: true },
    ],
  },
  profile: {
    brandHref: "../index.html",
    links: [{ href: "practice.html", label: "Practice" }],
  },
};

function renderNavLink(link) {
  const classes = ["nav-link"];
  if (link.muted) classes.push("text-white-50");
  if (link.active) classes.push("active");
  return `<a class="${classes.join(" ")}" href="${link.href}">${link.label}</a>`;
}

export function renderSiteNav(context) {
  const config = NAV_CONTEXTS[context] || NAV_CONTEXTS.module;
  const links = config.links.map(renderNavLink).join("\n        ");

  return `
  <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
    <div class="container">
      <a class="navbar-brand" href="${config.brandHref}"><i class="bi bi-database me-2"></i>SQLite Tutorial</a>
      <div class="navbar-nav ms-auto align-items-lg-center">
        ${links}
        <a class="nav-link" href="${context === "profile" ? "login.html" : context === "module" || context === "practice" ? "../pages/login.html" : "pages/login.html"}" id="nav-auth-login">Log in</a>
        <a class="nav-link d-none" href="${context === "profile" ? "profile.html" : context === "module" || context === "practice" ? "../pages/profile.html" : "pages/profile.html"}" id="nav-auth-profile">Profile</a>
        <a class="nav-link d-none" href="#" id="nav-auth-logout">Log out</a>
        <span class="navbar-text text-white-50 ms-lg-2 d-none d-lg-inline" id="nav-auth-email"></span>
      </div>
    </div>
  </nav>`;
}

export function mountSiteNav() {
  const mount = document.getElementById("site-nav");
  if (!mount) return;

  const context = mount.dataset.navContext || "module";
  mount.outerHTML = renderSiteNav(context);
}
