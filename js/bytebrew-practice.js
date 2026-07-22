/**
 * Byte Brew practice desk — session-only ticket game.
 * Depends on SqlRunner + Exercise (globals from sql-runner.js / exercise.js).
 */
(function () {
  const DATA_URL = "../data/bytebrew-game.json";
  const DB_BASE = "../data/databases/";

  const state = {
    catalog: null,
    rep: 0,
    mastery: {},
    forceUnlocked: {},
    purchased: {},
    hintTokens: 0,
    inboxSlots: 1,
    repMultiplier: 1,
    forceDiscount: 0,
    inbox: [],
    activeId: null,
    cleared: {},
    failCount: 0,
    runner: null,
    statusMsg: "",
  };

  const el = {};

  function skillById(id) {
    return state.catalog.skills.find((s) => s.id === id);
  }

  function isMastered(skillId) {
    const skill = skillById(skillId);
    if (!skill) return false;
    return (state.mastery[skillId] || 0) >= skill.quota;
  }

  function parentsMastered(skill) {
    if (!skill.parents || skill.parents.length === 0) return true;
    if (skill.parentMode === "any") {
      return skill.parents.some((p) => isMastered(p));
    }
    return skill.parents.every((p) => isMastered(p));
  }

  function parentsUnlocked(skill) {
    if (!skill.parents || skill.parents.length === 0) return true;
    if (skill.parentMode === "any") {
      return skill.parents.some((p) => isUnlocked(p));
    }
    return skill.parents.every((p) => isUnlocked(p));
  }

  function isUnlocked(skillId) {
    const skill = skillById(skillId);
    if (!skill) return false;
    if (skill.startUnlocked || state.forceUnlocked[skillId]) return true;
    // Auto path: parent mastery unlocks children
    return parentsMastered(skill);
  }

  function ticketAvailable(ticket) {
    return ticket.requires.every((r) => isUnlocked(r));
  }

  function fillInbox() {
    const openIds = new Set(state.inbox);
    const pool = state.catalog.tickets.filter(
      (t) => ticketAvailable(t) && !openIds.has(t.id)
    );
    // Prefer uncleared tickets, then allow farming cleared ones
    pool.sort((a, b) => {
      const ac = state.cleared[a.id] ? 1 : 0;
      const bc = state.cleared[b.id] ? 1 : 0;
      return ac - bc;
    });
    while (state.inbox.length < state.inboxSlots && pool.length) {
      state.inbox.push(pool.shift().id);
    }
  }

  function getActiveTicket() {
    if (!state.activeId) return null;
    return state.catalog.tickets.find((t) => t.id === state.activeId) || null;
  }

  function forceUnlockCost(skillId) {
    const skill = skillById(skillId);
    if (!skill || isUnlocked(skillId)) return 0;
    if (!parentsUnlocked(skill)) return Infinity;
    const base = skill.forceCost || 40;
    return Math.max(1, Math.round(base * (1 - state.forceDiscount)));
  }

  function applyUpgrade(upgrade) {
    const effect = upgrade.effect;
    if (effect.type === "inboxSlots") {
      state.inboxSlots += effect.value;
      fillInbox();
    } else if (effect.type === "repMultiplier") {
      state.repMultiplier = Math.max(state.repMultiplier, effect.value);
    } else if (effect.type === "hintTokens") {
      state.hintTokens += effect.value;
    } else if (effect.type === "forceDiscount") {
      state.forceDiscount = Math.max(state.forceDiscount, effect.value);
    }
  }

  function creditMastery(credits) {
    const unlockedNow = [];
    for (const id of credits) {
      const skill = skillById(id);
      if (!skill) continue;
      const before = state.mastery[id] || 0;
      const after = Math.min(skill.quota, before + 1);
      state.mastery[id] = after;
      if (before < skill.quota && after >= skill.quota) {
        unlockedNow.push(id);
      }
    }
    // Re-evaluate children that may now unlock via parent mastery
    fillInbox();
    return unlockedNow;
  }

  async function loadRunner() {
    const dbPath = DB_BASE + state.catalog.database;
    if (state.runner?.close) state.runner.close();
    state.runner = await SqlRunner.createFromFile(dbPath);
    const tablesEl = el.tables;
    if (tablesEl) {
      const tables = state.runner.getTableNames();
      tablesEl.textContent = tables.length ? tables.join(", ") : "none";
    }
  }

  function setStatus(msg, kind) {
    state.statusMsg = msg || "";
    if (!el.status) return;
    if (!msg) {
      el.status.innerHTML = "";
      return;
    }
    const cls =
      kind === "success"
        ? "alert-success"
        : kind === "danger"
          ? "alert-danger"
          : kind === "warning"
            ? "alert-warning"
            : "alert-info";
    el.status.innerHTML = `<div class="alert ${cls} mb-0 py-2">${msg}</div>`;
  }

  function renderHeader() {
    el.rep.textContent = String(Math.floor(state.rep));
    el.hints.textContent = String(state.hintTokens);
    el.slots.textContent = String(state.inboxSlots);
  }

  function renderInbox() {
    fillInbox();
    el.inbox.innerHTML = "";
    if (!state.inbox.length) {
      el.inbox.innerHTML =
        '<li class="list-group-item text-muted small">No tickets available yet — unlock more skills.</li>';
      return;
    }
    for (const id of state.inbox) {
      const ticket = state.catalog.tickets.find((t) => t.id === id);
      if (!ticket) continue;
      const li = document.createElement("button");
      li.type = "button";
      li.className =
        "list-group-item list-group-item-action bytebrew-inbox-item" +
        (id === state.activeId ? " active" : "");
      const cleared = state.cleared[id]
        ? '<span class="badge text-bg-secondary ms-1">done</span>'
        : "";
      li.innerHTML = `<span class="fw-semibold">${escapeHtml(ticket.title)}</span>${cleared}<div class="small opacity-75">${escapeHtml(ticket.from)}</div>`;
      li.addEventListener("click", () => selectTicket(id));
      el.inbox.appendChild(li);
    }
  }

  function renderSkills() {
    el.skills.innerHTML = "";
    for (const skill of state.catalog.skills) {
      const unlocked = isUnlocked(skill.id);
      const mastered = isMastered(skill.id);
      const progress = state.mastery[skill.id] || 0;
      const row = document.createElement("div");
      row.className = "bytebrew-skill" + (unlocked ? "" : " is-locked");

      let badge = "○";
      if (mastered) badge = "✓";
      else if (unlocked) badge = "·";

      const forceBtn =
        !unlocked && parentsUnlocked(skill) && skill.forceCost > 0
          ? `<button type="button" class="btn btn-outline-secondary btn-sm py-0 px-1 ms-auto bytebrew-force" data-skill="${skill.id}">Force ${forceUnlockCost(skill.id)}</button>`
          : "";

      row.innerHTML = `
        <span class="bytebrew-skill-mark">${badge}</span>
        <span class="bytebrew-skill-label">${escapeHtml(skill.label)}</span>
        <span class="bytebrew-skill-prog text-muted small">${unlocked ? `${progress}/${skill.quota}` : "locked"}</span>
        ${forceBtn}
      `;
      el.skills.appendChild(row);
    }

    el.skills.querySelectorAll(".bytebrew-force").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        forceUnlock(btn.dataset.skill);
      });
    });
  }

  function renderShop() {
    el.shop.innerHTML = "";
    for (const upgrade of state.catalog.upgrades) {
      const owned = !!state.purchased[upgrade.id];
      const reqOk =
        !upgrade.requires ||
        upgrade.requires.every((r) => state.purchased[r]);
      const canBuy =
        reqOk &&
        state.rep >= upgrade.cost &&
        (upgrade.repeatable || !owned);

      const item = document.createElement("div");
      item.className = "bytebrew-shop-item";
      item.innerHTML = `
        <div class="d-flex justify-content-between gap-2 align-items-start">
          <div>
            <div class="fw-semibold">${escapeHtml(upgrade.label)}</div>
            <div class="small text-muted">${escapeHtml(upgrade.description)}</div>
          </div>
          <button type="button" class="btn btn-sm ${owned && !upgrade.repeatable ? "btn-secondary" : "btn-outline-primary"} bytebrew-buy" data-id="${upgrade.id}" ${canBuy ? "" : "disabled"}>
            ${owned && !upgrade.repeatable ? "Owned" : upgrade.cost + " rep"}
          </button>
        </div>
      `;
      el.shop.appendChild(item);
    }

    el.shop.querySelectorAll(".bytebrew-buy").forEach((btn) => {
      btn.addEventListener("click", () => buyUpgrade(btn.dataset.id));
    });
  }

  function renderTicket() {
    const ticket = getActiveTicket();
    if (!ticket) {
      el.ticketMeta.innerHTML =
        '<p class="text-muted mb-0">Pick a ticket from the inbox to get started.</p>';
      el.sandbox.classList.add("d-none");
      return;
    }

    el.sandbox.classList.remove("d-none");
    const tags = ticket.requires
      .map((r) => `<span class="badge text-bg-secondary me-1">${escapeHtml(r)}</span>`)
      .join("");
    el.ticketMeta.innerHTML = `
      <div class="d-flex flex-wrap justify-content-between gap-2 mb-2">
        <div>
          <div class="text-muted small">Ticket ${escapeHtml(ticket.id)} — ${escapeHtml(ticket.from)} (${escapeHtml(ticket.role)})</div>
          <h2 class="h5 mb-1">${escapeHtml(ticket.title)}</h2>
        </div>
        <div>${tags}</div>
      </div>
      <p class="mb-0">${escapeHtml(ticket.prompt)}</p>
    `;

    if (el.editor && el.editor.dataset.ticketId !== ticket.id) {
      el.editor.value = ticket.starterSql || "SELECT ";
      el.editor.dataset.ticketId = ticket.id;
      el.output.innerHTML = "";
      el.feedback.innerHTML = "";
      state.failCount = 0;
      loadRunner().catch((err) => {
        setStatus(`Failed to load database: ${err.message}`, "danger");
      });
    }
  }

  function renderAll() {
    renderHeader();
    renderInbox();
    renderSkills();
    renderShop();
    renderTicket();
  }

  function selectTicket(id) {
    state.activeId = id;
    state.failCount = 0;
    setStatus("");
    renderAll();
  }

  function forceUnlock(skillId) {
    const skill = skillById(skillId);
    if (!skill || isUnlocked(skillId)) return;
    if (!parentsUnlocked(skill)) {
      setStatus("Unlock prerequisite skills first.", "warning");
      return;
    }
    const cost = forceUnlockCost(skillId);
    if (state.rep < cost) {
      setStatus(`Need ${cost} reputation to force-unlock ${skill.label}.`, "warning");
      return;
    }
    state.rep -= cost;
    state.forceUnlocked[skillId] = true;
    setStatus(`Force-unlocked ${skill.label} (−${cost} rep).`, "success");
    fillInbox();
    renderAll();
  }

  function buyUpgrade(id) {
    const upgrade = state.catalog.upgrades.find((u) => u.id === id);
    if (!upgrade) return;
    if (!upgrade.repeatable && state.purchased[id]) return;
    if (upgrade.requires && !upgrade.requires.every((r) => state.purchased[r])) {
      setStatus("Buy the prerequisite upgrade first.", "warning");
      return;
    }
    if (state.rep < upgrade.cost) {
      setStatus(`Need ${upgrade.cost} reputation.`, "warning");
      return;
    }
    state.rep -= upgrade.cost;
    if (!upgrade.repeatable) state.purchased[id] = true;
    applyUpgrade(upgrade);
    setStatus(`Purchased ${upgrade.label}.`, "success");
    renderAll();
  }

  function useHint() {
    const ticket = getActiveTicket();
    if (!ticket) return;
    if (state.hintTokens <= 0) {
      setStatus("No hint tokens — buy a pack in Upgrades.", "warning");
      return;
    }
    state.hintTokens -= 1;
    setStatus(`Hint: ${ticket.hint || "Try matching the expected result shape."}`, "info");
    renderHeader();
  }

  async function onRun() {
    const ticket = getActiveTicket();
    if (!ticket || !state.runner) return;
    el.feedback.innerHTML = "";
    try {
      const sql = el.editor.value.trim();
      if (!sql) return;
      if (Exercise.isMutation(sql)) {
        state.runner.db.run(sql);
        const tables = state.runner.getTableNames();
        const preview = tables.map((t) => {
          const r = state.runner.query(`SELECT * FROM ${t}`);
          return { table: t, ...r };
        });
        el.output.innerHTML = preview
          .map(
            (r) =>
              `<h6 class="mt-2 mb-1">${r.table}</h6><div class="result-block" data-table="${r.table}"></div>`
          )
          .join("");
        preview.forEach((r) => {
          const block = el.output.querySelector(`[data-table="${r.table}"]`);
          Exercise.renderResultTable(block, r);
        });
      } else {
        const result = state.runner.query(sql);
        Exercise.renderResultTable(el.output, result);
      }
    } catch (err) {
      el.feedback.innerHTML = `<div class="alert alert-danger mb-0">${escapeHtml(err.message)}</div>`;
    }
  }

  async function onSubmit() {
    const ticket = getActiveTicket();
    if (!ticket) return;
    el.feedback.innerHTML = "";
    try {
      const sql = el.editor.value.trim();
      if (!sql) {
        el.feedback.innerHTML =
          '<div class="alert alert-warning mb-0">Write a query first.</div>';
        return;
      }

      const fresh = await SqlRunner.createFromFile(DB_BASE + state.catalog.database);
      const result = new Exercise.Validator(fresh).validate(sql, ticket.validation);

      if (result.actual) {
        Exercise.renderResultTable(el.output, result.actual);
      }

      if (!result.passed) {
        state.failCount += 1;
        el.feedback.innerHTML = `<div class="alert alert-danger mb-0"><i class="bi bi-x-circle me-1"></i>${escapeHtml(result.message)}</div>`;
        if (state.failCount >= 1 && state.hintTokens > 0) {
          setStatus("Stuck? Use a hint token from the toolbar.", "info");
        }
        return;
      }

      const reward = Math.round(state.catalog.baseRepReward * state.repMultiplier);
      state.rep += reward;
      state.cleared[ticket.id] = true;
      const newlyMastered = creditMastery(ticket.credits || []);

      // Remove from inbox and refill
      state.inbox = state.inbox.filter((id) => id !== ticket.id);
      fillInbox();
      state.activeId = state.inbox[0] || null;
      state.failCount = 0;

      let msg = `Correct! +${reward} rep.`;
      for (const id of ticket.credits || []) {
        const skill = skillById(id);
        if (skill) {
          msg += ` ${skill.label} ${state.mastery[id] || 0}/${skill.quota}.`;
        }
      }
      if (newlyMastered.length) {
        msg += ` Mastered: ${newlyMastered.map((id) => skillById(id).label).join(", ")}.`;
      }

      el.feedback.innerHTML = `<div class="alert alert-success mb-0"><i class="bi bi-check-circle me-1"></i>${escapeHtml(msg)}</div>`;
      setStatus(msg, "success");
      renderAll();
    } catch (err) {
      el.feedback.innerHTML = `<div class="alert alert-danger mb-0">${escapeHtml(err.message)}</div>`;
    }
  }

  async function onReset() {
    const ticket = getActiveTicket();
    if (!ticket) return;
    el.feedback.innerHTML = "";
    el.output.innerHTML = "";
    el.editor.value = ticket.starterSql || "SELECT ";
    await loadRunner();
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function cacheEls() {
    el.rep = document.getElementById("bb-rep");
    el.hints = document.getElementById("bb-hints");
    el.slots = document.getElementById("bb-slots");
    el.inbox = document.getElementById("bb-inbox");
    el.skills = document.getElementById("bb-skills");
    el.shop = document.getElementById("bb-shop");
    el.ticketMeta = document.getElementById("bb-ticket-meta");
    el.status = document.getElementById("bb-status");
    el.sandbox = document.getElementById("bb-sandbox");
    el.editor = document.querySelector("#bb-sandbox .sql-editor");
    el.output = document.querySelector("#bb-sandbox .sql-output");
    el.feedback = document.querySelector("#bb-sandbox .sql-feedback");
    el.tables = document.querySelector("#bb-sandbox .sql-tables");
  }

  async function init() {
    cacheEls();
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error("Could not load Byte Brew catalog.");
    state.catalog = await res.json();
    state.rep = state.catalog.startingRep || 0;
    state.inboxSlots = state.catalog.defaultInboxSlots || 1;

    for (const skill of state.catalog.skills) {
      state.mastery[skill.id] = 0;
    }

    fillInbox();
    if (state.inbox.length) state.activeId = state.inbox[0];

    document.getElementById("bb-run")?.addEventListener("click", onRun);
    document.getElementById("bb-submit")?.addEventListener("click", onSubmit);
    document.getElementById("bb-reset")?.addEventListener("click", onReset);
    document.getElementById("bb-hint")?.addEventListener("click", useHint);

    renderAll();
    if (state.activeId) await loadRunner();
  }

  document.addEventListener("DOMContentLoaded", () => {
    init().catch((err) => {
      const main = document.getElementById("bb-status");
      if (main) {
        main.innerHTML = `<div class="alert alert-danger">${escapeHtml(err.message)}</div>`;
      }
    });
  });
})();
