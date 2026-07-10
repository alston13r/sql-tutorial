/**
 * SecurityLogin — intentionally vulnerable mock login for Module 14.
 * Concatenates username/password into SQL, previews the query, and runs it.
 */
const SecurityLogin = (function () {
  const TARGET_USER = "admin";
  const EXERCISE = {
    module_id: "14-security",
    lesson_id: "injection",
    exercise_id: "injection-01",
  };

  function escapeForDisplay(sql) {
    return sql
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function buildLoginSql(username, password) {
    // Keep the WHERE clause on one line so classic comment payloads like admin'-- work.
    return (
      "SELECT username FROM users\n" +
      "WHERE username = '" +
      username +
      "' AND password = '" +
      password +
      "';"
    );
  }

  function updateCompletionBanner() {
    const banner = document.getElementById("lesson-complete-alert");
    if (!banner || !window.ProgressTracker) return;

    const configs = Array.from(document.querySelectorAll("[data-exercise]"))
      .map((el) => {
        try {
          return JSON.parse(el.dataset.exercise || "{}");
        } catch {
          return null;
        }
      })
      .filter((config) => config && config.moduleId && config.lessonId && config.exerciseId);

    configs.push({
      moduleId: EXERCISE.module_id,
      lessonId: EXERCISE.lesson_id,
      exerciseId: EXERCISE.exercise_id,
    });

    if (configs.length === 0) {
      banner.classList.add("d-none");
      return;
    }

    const allCompleted = configs.every(
      (config) =>
        window.ProgressTracker.getLocalExerciseStatus({
          module_id: config.moduleId,
          lesson_id: config.lessonId,
          exercise_id: config.exerciseId,
        }) === "completed"
    );

    banner.classList.toggle("d-none", !allCompleted);
  }

  async function markChallengeComplete() {
    if (!window.ProgressTracker) return;
    await window.ProgressTracker.saveExerciseProgress({
      ...EXERCISE,
      status: "completed",
      completed_at: new Date().toISOString(),
    });
    updateCompletionBanner();
  }

  async function init(root) {
    if (!root) return;

    const usernameInput = root.querySelector("#login-username");
    const passwordInput = root.querySelector("#login-password");
    const form = root.querySelector("#login-form");
    const sqlPreview = root.querySelector("#generated-sql");
    const resultEl = root.querySelector("#login-result");
    const dbPath = "../data/databases/security_login.sql";

    let runner;

    function refreshSqlPreview() {
      const sql = buildLoginSql(usernameInput.value, passwordInput.value);
      sqlPreview.textContent = sql;
      return sql;
    }

    usernameInput.addEventListener("input", refreshSqlPreview);
    passwordInput.addEventListener("input", refreshSqlPreview);
    refreshSqlPreview();

    try {
      runner = await SqlRunner.createFromFile(dbPath);
    } catch (err) {
      resultEl.innerHTML = `<div class="alert alert-danger mb-0">Failed to load login database: ${err.message}</div>`;
      return;
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const sql = refreshSqlPreview();
      resultEl.innerHTML = "";

      try {
        runner?.close();
        runner = await SqlRunner.createFromFile(dbPath);
        const result = runner.query(sql);
        const usernames = (result.values || []).map((row) => row[0]);

        if (usernames.length === 0) {
          resultEl.innerHTML =
            '<div class="alert alert-warning mb-0">Login failed. No matching user.</div>';
          return;
        }

        const loggedInAs = usernames[0];
        if (loggedInAs === TARGET_USER) {
          resultEl.innerHTML =
            `<div class="alert alert-success mb-0">` +
            `<i class="bi bi-trophy me-1"></i>Challenge complete! Logged in as <strong>${escapeForDisplay(
              String(loggedInAs)
            )}</strong>.</div>`;
          await markChallengeComplete();
        } else {
          resultEl.innerHTML =
            `<div class="alert alert-info mb-0">Logged in as <strong>${escapeForDisplay(
              String(loggedInAs)
            )}</strong>. Try to log in as <code>${TARGET_USER}</code> without knowing that password.</div>`;
        }
      } catch (err) {
        resultEl.innerHTML = `<div class="alert alert-danger mb-0">SQL error: ${escapeForDisplay(
          err.message
        )}</div>`;
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    init(document.getElementById("security-login"));
  });

  return { init, buildLoginSql, TARGET_USER };
})();
