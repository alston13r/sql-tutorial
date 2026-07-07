import { supabase } from "./supabase-client.js";

function el(id) {
  return document.getElementById(id);
}

function safeSetText(node, text) {
  if (!node) return;
  node.textContent = text;
}

function setHidden(node, hidden) {
  if (!node) return;
  node.classList.toggle("d-none", hidden);
}

function currentPathWithQuery() {
  return window.location.pathname + window.location.search + window.location.hash;
}

export async function hydrateAuthUI() {
  const { data } = await supabase.auth.getSession();
  const session = data?.session ?? null;
  const user = session?.user ?? null;

  // Navbar targets (optional, depending on page)
  const authLogin = el("nav-auth-login");
  const authProfile = el("nav-auth-profile");
  const authLogout = el("nav-auth-logout");
  const authEmail = el("nav-auth-email");

  if (authLogin) {
    const loginUrl = new URL("./pages/login.html", window.location.href);
    loginUrl.searchParams.set("returnTo", currentPathWithQuery());
    authLogin.setAttribute("href", loginUrl.toString());
  }

  setHidden(authLogin, Boolean(user));
  setHidden(authProfile, !user);
  setHidden(authLogout, !user);
  safeSetText(authEmail, user?.email ?? "");

  if (authLogout) {
    authLogout.addEventListener("click", async (e) => {
      e.preventDefault();
      await supabase.auth.signOut();
      // Re-render UI to logged-out state.
      await hydrateAuthUI();
    });
  }

  return { session, user };
}

// Auto-run if included with type=module
document.addEventListener("DOMContentLoaded", () => {
  hydrateAuthUI().catch((err) => console.error(err));
});

