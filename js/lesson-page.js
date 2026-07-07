/**
 * LessonPage — wires up the SQL editor sandbox on lesson pages.
 * Reads exercise config from data-exercise JSON on the container element.
 */
const LessonPage = (function () {
  async function init(container) {
    const configRaw = container.dataset.exercise;
    if (!configRaw) return;

    const config = JSON.parse(configRaw);
    const editor = container.querySelector(".sql-editor");
    const runBtn = container.querySelector(".btn-run");
    const checkBtn = container.querySelector(".btn-check");
    const resetBtn = container.querySelector(".btn-reset");
    const outputEl = container.querySelector(".sql-output");
    const feedbackEl = container.querySelector(".sql-feedback");
    const tablesEl = container.querySelector(".sql-tables");

    const dbPath = config.database.startsWith("/")
      ? config.database
      : `../data/databases/${config.database}`;

    let runner;
    let validator;
    const starterSql = config.starterSql || "";

    try {
      container.querySelector(".sql-loading")?.classList.remove("d-none");
      runner = await SqlRunner.createFromFile(dbPath);
      validator = new Exercise.Validator(runner);

      if (tablesEl) {
        const tables = runner.getTableNames();
        tablesEl.textContent = tables.length ? tables.join(", ") : "none";
      }
    } catch (err) {
      feedbackEl.innerHTML = `<div class="alert alert-danger mb-0">Failed to load database: ${err.message}</div>`;
      return;
    } finally {
      container.querySelector(".sql-loading")?.classList.add("d-none");
    }

    if (editor && !editor.value) editor.value = starterSql;

    runBtn?.addEventListener("click", () => {
      feedbackEl.innerHTML = "";
      try {
        const sql = editor.value.trim();
        if (!sql) return;

        if (Exercise.isMutation(sql)) {
          runner.db.run(sql);
          const tables = runner.getTableNames();
          const preview = tables.map((t) => {
            const r = runner.query(`SELECT * FROM ${t}`);
            return { table: t, ...r };
          });
          outputEl.innerHTML = preview
            .map(
              (r) =>
                `<h6 class="mt-2 mb-1">${r.table}</h6>` +
                `<div class="result-block" data-table="${r.table}"></div>`
            )
            .join("");
          preview.forEach((r) => {
            const block = outputEl.querySelector(`[data-table="${r.table}"]`);
            Exercise.renderResultTable(block, r);
          });
        } else {
          const result = runner.query(sql);
          Exercise.renderResultTable(outputEl, result);
        }
      } catch (err) {
        feedbackEl.innerHTML = `<div class="alert alert-danger mb-0">${err.message}</div>`;
      }
    });

    checkBtn?.addEventListener("click", async () => {
      feedbackEl.innerHTML = "";
      try {
        const sql = editor.value.trim();
        if (!sql) {
          feedbackEl.innerHTML = '<div class="alert alert-warning mb-0">Write a query first.</div>';
          return;
        }

        const freshRunner = await SqlRunner.createFromFile(dbPath);
        const freshValidator = new Exercise.Validator(freshRunner);
        const result = freshValidator.validate(sql, config.validation);

        if (result.passed) {
          feedbackEl.innerHTML = `<div class="alert alert-success mb-0"><i class="bi bi-check-circle me-1"></i>${result.message}</div>`;
        } else {
          feedbackEl.innerHTML = `<div class="alert alert-danger mb-0"><i class="bi bi-x-circle me-1"></i>${result.message}</div>`;
        }

        if (result.actual) {
          Exercise.renderResultTable(outputEl, result.actual);
        }
      } catch (err) {
        feedbackEl.innerHTML = `<div class="alert alert-danger mb-0">${err.message}</div>`;
      }
    });

    resetBtn?.addEventListener("click", async () => {
      feedbackEl.innerHTML = "";
      outputEl.innerHTML = "";
      editor.value = starterSql;
      runner?.close();
      runner = await SqlRunner.createFromFile(dbPath);
      validator = new Exercise.Validator(runner);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-exercise]").forEach((el) => init(el));
  });

  return { init };
})();
