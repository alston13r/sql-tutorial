(function () {
  const planUrl = new URL("data/lesson-plan.json", window.location.href);

  function sortModules(modules) {
    return [...modules].sort((a, b) => a.order - b.order);
  }

  function isComingSoon(module) {
    return module.status === "coming_soon";
  }

  function statusBadge(module) {
    if (module.status === "completed") {
      return '<span class="badge bg-success-subtle text-success">Completed</span>';
    }
    if (module.status === "coming_soon") {
      return '<span class="badge bg-secondary-subtle text-secondary">Coming soon</span>';
    }
    return '<span class="badge bg-success-subtle text-success">Available</span>';
  }

  function populateHero(plan) {
    const titleEl = document.getElementById("hero-title");
    const descEl = document.getElementById("hero-description");
    const countEl = document.getElementById("module-count");

    if (titleEl) titleEl.textContent = plan.title;
    if (descEl) descEl.textContent = plan.description;
    if (countEl) {
      const count = plan.modules.length;
      countEl.textContent = `${count} module${count === 1 ? "" : "s"}`;
    }
  }

  function renderGrid(modules) {
    const container = document.getElementById("module-grid");
    if (!container) return;

    container.innerHTML = sortModules(modules)
      .map((mod) => {
        const locked = isComingSoon(mod);
        const icon = mod.icon || "bi-book";
        const action = locked
          ? '<button class="btn btn-secondary btn-sm" disabled>Coming soon</button>'
          : `<a href="${mod.href}" class="btn btn-primary btn-sm">Start</a>`;

        return `
          <div class="col-md-6 col-lg-4">
            <div class="card h-100 shadow-sm${locked ? " opacity-75" : ""}">
              <div class="card-body d-flex flex-column">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <span class="badge bg-secondary">Module ${mod.order}</span>
                  <i class="bi ${icon} fs-4 text-primary"></i>
                </div>
                <h5 class="card-title">${mod.title}</h5>
                <p class="card-text text-muted flex-grow-1">${mod.description}</p>
                <div class="d-flex justify-content-between align-items-center mt-3">
                  <small class="text-muted"><i class="bi bi-clock me-1"></i>${mod.duration}</small>
                  ${action}
                </div>
              </div>
            </div>
          </div>`;
      })
      .join("");
  }

  function renderPath(modules) {
    const container = document.getElementById("module-path");
    const sidebarNav = document.getElementById("sidebar-nav");
    const progressBar = document.getElementById("progress-bar");
    const progressText = document.getElementById("progress-text");

    if (!container) return;

    const sorted = sortModules(modules);
    const completed = sorted.filter((m) => m.status === "completed").length;
    const total = sorted.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    if (progressBar) progressBar.style.width = `${pct}%`;
    if (progressText) {
      progressText.textContent = `${completed} of ${total} modules completed`;
    }

    if (sidebarNav) {
      sidebarNav.innerHTML = sorted
        .map((mod) => {
          const label = `${mod.order}. ${mod.title}`;
          if (isComingSoon(mod)) {
            return `<span class="nav-link py-1 text-muted">${label}</span>`;
          }
          return `<a class="nav-link py-1" href="#mod-${mod.id}">${label}</a>`;
        })
        .join("");
    }

    container.innerHTML = sorted
      .map((mod) => {
        const locked = isComingSoon(mod);
        const marker = locked
          ? '<div class="path-marker bg-secondary"><i class="bi bi-lock-fill text-white"></i></div>'
          : `<div class="path-marker"><span class="path-number">${mod.order}</span></div>`;

        const action = locked
          ? ""
          : `<a href="${mod.href}" class="btn btn-primary btn-sm ms-auto">Start Module</a>`;

        return `
          <div class="path-step${locked ? " opacity-75" : ""}" id="mod-${mod.id}">
            ${marker}
            <div class="card mb-4 shadow-sm${locked ? " border-secondary-subtle" : ""}">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                  <h5 class="card-title mb-1${locked ? " text-muted" : ""}">${mod.title}</h5>
                  ${statusBadge(mod)}
                </div>
                <p class="card-text text-muted mb-3">${mod.description}</p>
                <div class="d-flex gap-2 align-items-center">
                  <span class="badge text-bg-secondary"><i class="bi bi-clock"></i> ${mod.duration}</span>
                  ${action}
                </div>
              </div>
            </div>
          </div>`;
      })
      .join("");
  }

  async function init() {
    const mode = document.body.dataset.renderMode || "grid";

    try {
      const response = await fetch(planUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const plan = await response.json();

      populateHero(plan);

      if (mode === "path") {
        renderPath(plan.modules);
      } else {
        renderGrid(plan.modules);
      }
    } catch (err) {
      console.error("Failed to load lesson plan:", err);
      const target = document.getElementById("module-grid") || document.getElementById("module-path");
      if (target) {
        target.innerHTML =
          '<div class="col-12"><div class="alert alert-danger">Could not load lesson plan. Serve this site from a local web server.</div></div>';
      }
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
