/**
 * Exercise — validates student SQL against expected outcomes.
 * Supports query exercises (result matching) and mutation exercises (state checks).
 */
const Exercise = (function () {
  function normalizeSql(sql, options = {}) {
    const {
      caseSensitive = false,
      collapseWhitespace = true,
      trim = true,
    } = options;

    let normalized = sql;
    if (collapseWhitespace) normalized = normalized.replace(/\s+/g, " ");
    if (trim) normalized = normalized.trim();
    if (!caseSensitive) normalized = normalized.toLowerCase();
    return normalized;
  }

  function normalizeRows(columns, values) {
    return values.map((row) => {
      const obj = {};
      columns.forEach((col, i) => {
        obj[col.toLowerCase()] = row[i];
      });
      return obj;
    });
  }

  function sortRows(rows) {
    return [...rows].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  }

  function rowsEqual(actual, expected) {
    if (actual.length !== expected.length) return false;
    const a = sortRows(actual);
    const e = sortRows(expected);
    return JSON.stringify(a) === JSON.stringify(e);
  }

  function rowsEqualInOrder(actual, expected) {
    if (actual.length !== expected.length) return false;
    return JSON.stringify(actual) === JSON.stringify(expected);
  }

  function isMutation(sql) {
    return /^\s*(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|REPLACE)\b/i.test(sql);
  }

  class Validator {
    constructor(runner) {
      this.runner = runner;
    }

    checkResultMatch(userSql, expectedQuery) {
      const actual = this.runner.query(userSql);
      const expected = this.runner.query(expectedQuery);
      const actualRows = normalizeRows(actual.columns, actual.values);
      const expectedRows = normalizeRows(expected.columns, expected.values);

      if (!rowsEqual(actualRows, expectedRows)) {
        return {
          passed: false,
          message: "Result does not match expected output.",
          actual: actual,
          expected: expected,
        };
      }
      return { passed: true, message: "Correct!", actual };
    }

    checkOrderedResultMatch(userSql, expectedQuery) {
      const actual = this.runner.query(userSql);
      const expected = this.runner.query(expectedQuery);
      const actualRows = normalizeRows(actual.columns, actual.values);
      const expectedRows = normalizeRows(expected.columns, expected.values);

      if (
        actual.columns.map((c) => c.toLowerCase()).join() !==
        expected.columns.map((c) => c.toLowerCase()).join()
      ) {
        return {
          passed: false,
          message: "Column names or order do not match expected output.",
          actual: actual,
          expected: expected,
        };
      }

      if (!rowsEqualInOrder(actualRows, expectedRows)) {
        return {
          passed: false,
          message: "Result does not match expected output (check row order).",
          actual: actual,
          expected: expected,
        };
      }
      return { passed: true, message: "Correct!", actual };
    }

    checkRowCount(userSql, expectedCount) {
      const result = this.runner.query(userSql);
      const count = result.values.length;
      if (count !== expectedCount) {
        return {
          passed: false,
          message: `Expected ${expectedCount} rows, got ${count}.`,
          actual: result,
        };
      }
      return { passed: true, message: "Correct!", actual: result };
    }

    checkExactSqlMatch(userSql, expectedSql, options = {}) {
      let actual;
      try {
        actual = this.runner.query(userSql);
      } catch (err) {
        return { passed: false, message: `SQL error: ${err.message}` };
      }

      const actualSql = normalizeSql(userSql, options);
      const targetSql = normalizeSql(expectedSql, options);

      if (actualSql !== targetSql) {
        return {
          passed: false,
          message: `For this exercise, use the exact command: ${expectedSql}`,
          actual,
        };
      }

      return { passed: true, message: "Correct!", actual };
    }

    checkMutation(userSql, verifyQuery, expectedQuery) {
      try {
        this.runner.db.run(userSql);
      } catch (err) {
        return { passed: false, message: `SQL error: ${err.message}` };
      }

      const verify = this.runner.query(verifyQuery);
      const expected = this.runner.query(expectedQuery);
      const actualRows = normalizeRows(verify.columns, verify.values);
      const expectedRows = normalizeRows(expected.columns, expected.values);

      if (!rowsEqual(actualRows, expectedRows)) {
        return {
          passed: false,
          message: "Mutation did not produce the expected database state.",
          actual: verify,
          expected: expected,
        };
      }
      return { passed: true, message: "Correct!", actual: verify };
    }

    validate(userSql, validation) {
      if (!validation || !validation.type) {
        return { passed: false, message: "No validation rules defined." };
      }

      switch (validation.type) {
        case "resultMatch":
          return this.checkResultMatch(userSql, validation.query);
        case "orderedResultMatch":
          return this.checkOrderedResultMatch(userSql, validation.query);
        case "rowCount":
          return this.checkRowCount(userSql, validation.count);
        case "exactSqlMatch":
          return this.checkExactSqlMatch(userSql, validation.expectedSql, validation.options);
        case "mutation": {
          const statements = userSql
            .split(";")
            .map((s) => s.trim())
            .filter(Boolean);
          for (const stmt of statements) {
            try {
              this.runner.db.run(stmt);
            } catch (err) {
              return { passed: false, message: `SQL error: ${err.message}` };
            }
          }
          return this.checkResultMatch(validation.verifyQuery, validation.expectedQuery);
        }
        default:
          return { passed: false, message: `Unknown validation type: ${validation.type}` };
      }
    }
  }

  function renderResultTable(container, result) {
    if (!result || !result.columns) {
      container.innerHTML = '<p class="text-muted mb-0">No results.</p>';
      return;
    }

    if (result.values.length === 0) {
      container.innerHTML = '<p class="text-muted mb-0">Query returned 0 rows.</p>';
      return;
    }

    const thead = result.columns.map((c) => `<th>${c}</th>`).join("");
    const tbody = result.values
      .map((row) => `<tr>${row.map((cell) => `<td>${cell === null ? "<em>NULL</em>" : cell}</td>`).join("")}</tr>`)
      .join("");

    container.innerHTML = `
      <div class="table-responsive">
        <table class="table table-sm table-striped table-bordered mb-0">
          <thead><tr>${thead}</tr></thead>
          <tbody>${tbody}</tbody>
        </table>
      </div>`;
  }

  return {
    Validator,
    renderResultTable,
    isMutation,
  };
})();

window.Exercise = Exercise;

if (typeof module !== "undefined") module.exports = Exercise;
