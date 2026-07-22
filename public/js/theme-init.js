(function () {
  const STORAGE_KEY = "sql-tutorial-theme";

  function getStoredTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "auto") {
      return stored;
    }
    return "auto";
  }

  function getSystemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function resolveTheme(mode) {
    return mode === "auto" ? getSystemTheme() : mode;
  }

  const mode = getStoredTheme();
  const resolved = resolveTheme(mode);

  document.documentElement.setAttribute("data-bs-theme", resolved);
  document.documentElement.setAttribute("data-theme-mode", mode);
})();
