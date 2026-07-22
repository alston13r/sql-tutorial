import { supabase } from "./supabase-client.js";
import { getProfile, getDisplayName } from "./auth-helpers.js";
import {
  getAuthPaths,
  loginUrlWithReturn,
  currentPathWithQuery,
} from "./auth-paths.js";
import { mountSiteNav } from "./site-nav.js";
import { mountSiteFooter } from "./site-footer.js";
import { mountThemeSwitcher } from "./theme.js";

function mountSiteChrome() {
  mountSiteNav();
  mountSiteFooter();
  mountThemeSwitcher();
}

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

export async function hydrateAuthUI() {
  const { data } = await supabase.auth.getSession();
  const session = data?.session ?? null;
  const user = session?.user ?? null;

  const paths = getAuthPaths();
  const authLogin = el("nav-auth-login");
  const authProfile = el("nav-auth-profile");
  const authLogout = el("nav-auth-logout");
  const authEmail = el("nav-auth-email");

  if (authLogin) {
    authLogin.setAttribute("href", loginUrlWithReturn(currentPathWithQuery()));
  }

  if (authProfile) {
    authProfile.setAttribute("href", paths.profile);
  }

  setHidden(authLogin, Boolean(user));
  setHidden(authProfile, !user);
  setHidden(authLogout, !user);

  if (user) {
    try {
      const profile = await getProfile(user.id);
      safeSetText(authEmail, getDisplayName(profile, user));
    } catch (err) {
      console.warn("Failed to load profile for navbar:", err);
      safeSetText(authEmail, user.email ?? "");
    }
  } else {
    safeSetText(authEmail, "");
  }

  if (authLogout && !authLogout.dataset.bound) {
    authLogout.dataset.bound = "true";
    authLogout.addEventListener("click", async (e) => {
      e.preventDefault();
      await supabase.auth.signOut();
      window.location.href = paths.login;
    });
  }

  return { session, user };
}

document.addEventListener("DOMContentLoaded", () => {
  mountSiteChrome();
  hydrateAuthUI().catch((err) => console.error(err));
});
