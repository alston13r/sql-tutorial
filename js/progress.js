import { supabase } from "./supabase-client.js";

const STORAGE_KEY = "sql-tutorial-progress-v1";

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { exercises: {} };
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : { exercises: {} };
  } catch {
    return { exercises: {} };
  }
}

function writeStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function exerciseKey(record) {
  return `${record.module_id}:${record.lesson_id}:${record.exercise_id}`;
}

function mergeStatus(existingStatus, nextStatus) {
  if (existingStatus === "completed") return "completed";
  if (nextStatus === "completed") return "completed";
  if (existingStatus === "in_progress" || nextStatus === "in_progress") return "in_progress";
  return nextStatus || existingStatus || "not_started";
}

function upsertLocalExercise(record) {
  const store = readStore();
  const key = exerciseKey(record);
  const existing = store.exercises[key] || {};
  const merged = {
    ...existing,
    ...record,
    status: mergeStatus(existing.status, record.status),
    updated_at: new Date().toISOString(),
  };
  if (merged.status === "completed" && !merged.completed_at) {
    merged.completed_at = new Date().toISOString();
  }
  store.exercises[key] = merged;
  writeStore(store);
  return merged;
}

async function currentUser() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user || null;
}

async function syncExerciseRecord(record) {
  const user = await currentUser();
  if (!user) return { synced: false, user: null };

  const payload = {
    user_id: user.id,
    module_id: record.module_id,
    lesson_id: record.lesson_id,
    exercise_id: record.exercise_id,
    status: record.status,
    completed_at: record.completed_at || null,
    updated_at: record.updated_at || new Date().toISOString(),
  };

  const { error } = await supabase.from("exercise_progress").upsert(payload);
  if (error) throw error;
  return { synced: true, user };
}

async function saveExerciseProgress(record) {
  const local = upsertLocalExercise(record);
  try {
    await syncExerciseRecord(local);
  } catch (error) {
    console.warn("Progress sync failed; keeping local progress only.", error);
  }
  return local;
}

async function syncLocalProgressForCurrentUser() {
  const user = await currentUser();
  if (!user) return false;

  const store = readStore();
  const records = Object.values(store.exercises || {});
  for (const record of records) {
    await syncExerciseRecord(record);
  }
  return true;
}

function getLocalExercise(record) {
  const store = readStore();
  return store.exercises[exerciseKey(record)] || null;
}

function getLocalExerciseStatus(record) {
  return getLocalExercise(record)?.status || "not_started";
}

function clearLocalProgress() {
  writeStore({ exercises: {} });
}

// Requires a Supabase RLS DELETE policy on exercise_progress for auth.uid() = user_id.
async function resetRemoteProgress(user) {
  const { error } = await supabase.from("exercise_progress").delete().eq("user_id", user.id);
  if (error) throw error;
}

async function resetAllProgress() {
  clearLocalProgress();
  const user = await currentUser();
  if (!user) {
    return { localCleared: true, remoteCleared: false };
  }

  try {
    await resetRemoteProgress(user);
    return { localCleared: true, remoteCleared: true };
  } catch (error) {
    console.warn("Remote progress reset failed; local progress was cleared.", error);
    return { localCleared: true, remoteCleared: false, error };
  }
}

window.ProgressTracker = {
  saveExerciseProgress,
  syncLocalProgressForCurrentUser,
  getLocalExercise,
  getLocalExerciseStatus,
  clearLocalProgress,
  resetAllProgress,
};

