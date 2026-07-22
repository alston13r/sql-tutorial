export function renderSiteFooter() {
  return `
  <footer class="bg-light py-3 mt-auto border-top">
    <div class="container text-center text-muted small">
      SQLite Tutorial &mdash; MIT License<br>
      <a href="https://github.com/alston13r/sql-tutorial" class="link-secondary">GitHub Repository</a>
    </div>
  </footer>`;
}

export function mountSiteFooter() {
  const mount = document.getElementById("site-footer");
  if (!mount) return;
  mount.outerHTML = renderSiteFooter();
}
