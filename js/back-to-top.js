const SHOW_AFTER_PX = 400;

function getScrollRoot() {
  return document.querySelector(".site-scroll") || window;
}

function getScrollTop(root) {
  if (root === window) {
    return window.scrollY || document.documentElement.scrollTop || 0;
  }
  return root.scrollTop;
}

function scrollToTop(root) {
  if (root === window) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    root.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function createButton() {
  const button = document.createElement("button");
  button.type = "button";
  button.id = "back-to-top";
  button.className = "btn btn-primary back-to-top";
  button.setAttribute("aria-label", "Back to top");
  button.hidden = true;
  button.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">' +
    '<path fill-rule="evenodd" d="M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5"/>' +
    "</svg>";
  return button;
}

export function mountBackToTop() {
  if (document.getElementById("back-to-top")) return;

  const root = getScrollRoot();
  const button = createButton();
  document.body.appendChild(button);

  const updateVisibility = () => {
    button.hidden = getScrollTop(root) < SHOW_AFTER_PX;
  };

  button.addEventListener("click", () => scrollToTop(root));
  root.addEventListener("scroll", updateVisibility, { passive: true });
  updateVisibility();
}

document.addEventListener("DOMContentLoaded", () => {
  mountBackToTop();
});
