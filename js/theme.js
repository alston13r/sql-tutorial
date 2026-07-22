const STORAGE_KEY = "sql-tutorial-theme";

const THEME_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "auto", label: "Auto" },
];

const ICONS = {
  light: `${import.meta.env.BASE_URL}icons/theme-light.svg`,
  dark: `${import.meta.env.BASE_URL}icons/theme-dark.svg`,
  auto: `${import.meta.env.BASE_URL}icons/theme-auto.svg`,
};

let mediaQuery = null;

export function getStoredTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "auto") {
    return stored;
  }
  return "auto";
}

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolveTheme(mode = getStoredTheme()) {
  return mode === "auto" ? getSystemTheme() : mode;
}

export function applyTheme(mode = getStoredTheme()) {
  const resolved = resolveTheme(mode);
  document.documentElement.setAttribute("data-bs-theme", resolved);
  document.documentElement.setAttribute("data-theme-mode", mode);
}

function updateSwitcherUI(mode) {
  const switcher = document.getElementById("theme-switcher");
  if (!switcher) return;

  const activeIcon = switcher.querySelector(".theme-icon-active");
  if (activeIcon) {
    activeIcon.src = ICONS[mode];
    activeIcon.alt = `${mode} theme`;
  }

  document.querySelectorAll("[data-theme-value]").forEach((button) => {
    const isActive = button.getAttribute("data-theme-value") === mode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

function bindSystemThemeListener() {
  if (mediaQuery) {
    mediaQuery.removeEventListener("change", onSystemThemeChange);
  }

  mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", onSystemThemeChange);
}

function onSystemThemeChange() {
  if (getStoredTheme() === "auto") {
    applyTheme("auto");
  }
}

export function setTheme(mode) {
  if (!THEME_OPTIONS.some((option) => option.value === mode)) return;
  localStorage.setItem(STORAGE_KEY, mode);
  applyTheme(mode);
  updateSwitcherUI(mode);
  bindSystemThemeListener();
}

function createThemeSwitcher() {
  const wrapper = document.createElement("div");
  wrapper.className = "dropdown theme-switcher ms-lg-2";
  wrapper.innerHTML = `
    <button
      class="btn btn-link nav-link py-2 px-0 px-lg-2 dropdown-toggle d-flex align-items-center"
      id="theme-switcher"
      type="button"
      data-bs-toggle="dropdown"
      aria-expanded="false"
      aria-label="Theme"
      data-bs-display="static"
    >
      <img class="theme-icon theme-icon-active" width="16" height="16" alt="">
    </button>
    <ul class="dropdown-menu dropdown-menu-end shadow" aria-labelledby="theme-switcher">
      ${THEME_OPTIONS.map(
        (option) => `
        <li>
          <button
            type="button"
            class="dropdown-item d-flex align-items-center"
            data-theme-value="${option.value}"
          >
            <img class="theme-icon me-2" src="${ICONS[option.value]}" width="16" height="16" alt="">
            ${option.label}
          </button>
        </li>`
      ).join("")}
    </ul>
  `;

  wrapper.querySelectorAll("[data-theme-value]").forEach((button) => {
    button.addEventListener("click", () => {
      setTheme(button.getAttribute("data-theme-value"));
    });
  });

  return wrapper;
}

export function mountThemeSwitcher() {
  const nav = document.querySelector(".navbar-nav.ms-auto");
  if (!nav || document.getElementById("theme-switcher")) return;

  nav.appendChild(createThemeSwitcher());
  updateSwitcherUI(getStoredTheme());
  bindSystemThemeListener();
}

import "./back-to-top.js";
