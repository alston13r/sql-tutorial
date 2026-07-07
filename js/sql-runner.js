/**
 * SqlRunner — thin wrapper around sql.js for in-browser SQLite.
 * Works on GitHub Pages: loads WASM from CDN, seeds DB from .sql files via fetch.
 */
const SqlRunner = (function () {
  const SQL_JS_CDN = "https://cdn.jsdelivr.net/npm/sql.js@1.12.0/dist";
  let sqlJsPromise = null;

  function loadSqlJs() {
    if (sqlJsPromise) return sqlJsPromise;

    sqlJsPromise = new Promise((resolve, reject) => {
      if (window.initSqlJs) {
        initSqlJs({ locateFile: (file) => `${SQL_JS_CDN}/${file}` })
          .then(resolve)
          .catch(reject);
        return;
      }

      const script = document.createElement("script");
      script.src = `${SQL_JS_CDN}/sql-wasm.js`;
      script.onload = () => {
        initSqlJs({ locateFile: (file) => `${SQL_JS_CDN}/${file}` })
          .then(resolve)
          .catch(reject);
      };
      script.onerror = () => reject(new Error("Failed to load sql.js"));
      document.head.appendChild(script);
    });

    return sqlJsPromise;
  }

  async function fetchSql(relativePath) {
    const url = new URL(relativePath, window.location.href);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load ${relativePath}: HTTP ${response.status}`);
    return response.text();
  }

  class Runner {
  constructor(db) {
      this.db = db;
    }

    run(sql) {
      const results = [];
      this.db.run(sql);
      return results;
    }

    exec(sql) {
      return this.db.exec(sql);
    }

    query(sql) {
      const stmt = this.db.prepare(sql);
      const columns = stmt.getColumnNames();
      const values = [];
      while (stmt.step()) {
        values.push(stmt.get());
      }
      stmt.free();
      return { columns, values };
    }

    getTableNames() {
      const { values } = this.query(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      );
      return values.map((row) => row[0]);
    }

    close() {
      this.db.close();
    }
  }

  async function createFromSql(sqlScript) {
    const SQL = await loadSqlJs();
    const db = new SQL.Database();
    db.run(sqlScript);
    return new Runner(db);
  }

  async function createFromFile(relativePath) {
    const sqlScript = await fetchSql(relativePath);
    return createFromSql(sqlScript);
  }

  function resultsToTable(execResults) {
    if (!execResults || execResults.length === 0) return { columns: [], values: [] };
    const { columns, values } = execResults[0];
    return { columns, values };
  }

  return {
    loadSqlJs,
    createFromSql,
    createFromFile,
    resultsToTable,
  };
})();

if (typeof module !== "undefined") module.exports = SqlRunner;
