import { supabase } from "./supabase-client.js";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
const USERNAME_FORMAT_ERROR =
  "Usernames can only contain letters, numbers, and underscores (3–20 characters).";
const LOGIN_ERROR = "Invalid email/username or password.";

export function isEmailLike(input) {
  return String(input || "").includes("@");
}

export function normalizeUsername(username) {
  return String(username || "").trim().toLowerCase();
}

export function validateUsername(username) {
  const trimmed = String(username || "").trim();
  if (!trimmed) return "Username is required.";
  if (!USERNAME_REGEX.test(trimmed)) return USERNAME_FORMAT_ERROR;
  return null;
}

export function getDisplayName(profile, user) {
  if (profile?.username) return `@${profile.username}`;
  return user?.email || "";
}

export async function resolveLoginEmail(identifier) {
  const value = String(identifier || "").trim();
  if (!value) return null;

  if (isEmailLike(value)) {
    return value;
  }

  const formatError = validateUsername(value);
  if (formatError) return null;

  const { data, error } = await supabase.rpc("get_email_for_username", {
    p_username: value,
  });

  if (error) {
    console.warn("Username lookup failed:", error);
    return null;
  }

  return data || null;
}

export async function signInWithIdentifier(identifier, password) {
  const email = await resolveLoginEmail(identifier);
  if (!email) {
    return { data: null, error: { message: LOGIN_ERROR } };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { data: null, error: { message: LOGIN_ERROR } };
  }

  return { data, error: null };
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, username")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function ensureProfile(user) {
  let profile = await getProfile(user.id);
  if (profile) return profile;

  const { data, error } = await supabase
    .from("profiles")
    .insert({ id: user.id, email: user.email || "" })
    .select("id, email, username")
    .single();

  if (error) throw error;
  return data;
}

export async function isUsernameAvailable(username, currentUsername = null) {
  const normalized = normalizeUsername(username);
  const currentNormalized = currentUsername ? normalizeUsername(currentUsername) : null;

  if (currentNormalized && normalized === currentNormalized) {
    return true;
  }

  const formatError = validateUsername(username);
  if (formatError) return false;

  const { data, error } = await supabase.rpc("is_username_available", {
    p_username: username,
  });

  if (error) {
    console.warn("Username availability check failed:", error);
    throw error;
  }

  return Boolean(data);
}

export async function saveUsername(userId, username, currentUsername = null) {
  const formatError = validateUsername(username);
  if (formatError) {
    return { profile: null, error: formatError };
  }

  const normalized = normalizeUsername(username);
  const available = await isUsernameAvailable(normalized, currentUsername);
  if (!available) {
    return { profile: null, error: "That username is already taken." };
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      username: normalized,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("id, email, username")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { profile: null, error: "That username is already taken." };
    }
    if (error.code === "23514") {
      return { profile: null, error: USERNAME_FORMAT_ERROR };
    }
    throw error;
  }

  return { profile: data, error: null };
}
