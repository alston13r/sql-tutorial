/**
 * Byte Brew practice desk — session-only ticket game with staged onboarding.
 * Depends on SqlRunner + Exercise (globals from sql-runner.js / exercise.js).
 */
(function () {
  const DATA_URL = "../data/bytebrew-game.json";
  const DB_BASE = "../data/databases/";

  const STAGES = [
    "intro-1",
    "intro-2",
    "reveal-inbox",
    "reveal-ticket",
    "reveal-sandbox",
    "early",
    "full",
  ];

  const state = {
    catalog: null,
    stage: "intro-1",
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
    columnOrders: {},
    skillsIntroShown: false,
  };

  const el = {};

  function stageIndex(stage) {
    return STAGES.indexOf(stage);
  }

  function stageAtLeast(minStage) {
    return stageIndex(state.stage) >= stageIndex(minStage);
  }

  function isEarlyGame() {
    return !stageAtLeast("full");
  }

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
    return parentsMastered(skill);
  }

  function ticketAvailable(ticket) {
    if (!ticket.requires.every((r) => isUnlocked(r))) return false;
    // Early game: SELECT-only tickets
    if (isEarlyGame()) {
      return ticket.requires.every((r) => r === "select");
    }
    return true;
  }

  function fillInbox() {
    if (!stageAtLeast("reveal-inbox")) return;
    const openIds = new Set(state.inbox);
    const pool = state.catalog.tickets.filter(
      (t) => ticketAvailable(t) && !openIds.has(t.id)
    );
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

  function shuffleInPlace(arr) {
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function ensureColumnOrder(ticket) {
    if (!ticket.columns || ticket.columns.length < 2) return null;
    if (!state.columnOrders[ticket.id]) {
      state.columnOrders[ticket.id] = shuffleInPlace([...ticket.columns]);
    }
    return state.columnOrders[ticket.id];
  }

  function resolveTicket(ticket) {
    const ordered = ensureColumnOrder(ticket);
    let prompt = ticket.prompt;
    const validation = { ...ticket.validation };

    if (ordered) {
      const labels = ordered.map((c) => c.label || c.expr);
      const exprs = ordered.map((c) => c.expr);
      const base = ticket.prompt
        .replace(/\s*\([^)]*\)\s*\.?$/, "")
        .trim()
        .replace(/\.$/, "");
      prompt = `${base} (${labels.join(", ")}).`;
      if (validation.queryTemplate) {
        validation.type = "orderedResultMatch";
        validation.query = validation.queryTemplate.replace(
          "{columns}",
          exprs.join(", ")
        );
      }
    }

    return { prompt, validation };
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

  function unlockedIds() {
    return new Set(
      state.catalog.skills.filter((s) => isUnlocked(s.id)).map((s) => s.id)
    );
  }

  function newlyUnlocked(before, after) {
    return [...after].filter((id) => !before.has(id));
  }

  function creditMastery(credits) {
    const before = unlockedIds();
    const masteredNow = [];
    for (const id of credits) {
      const skill = skillById(id);
      if (!skill) continue;
      const prev = state.mastery[id] || 0;
      const after = Math.min(skill.quota, prev + 1);
      state.mastery[id] = after;
      if (prev < skill.quota && after >= skill.quota) {
        masteredNow.push(id);
      }
    }
    fillInbox();
    return {
      masteredNow,
      unlockedNow: newlyUnlocked(before, unlockedIds()),
    };
  }

  function alertHtml(msg, kind, { dismissible = false } = {}) {
    const cls =
      kind === "success"
        ? "alert-success"
        : kind === "danger"
          ? "alert-danger"
          : kind === "warning"
            ? "alert-warning"
            : "alert-info";
    const dismissClass = dismissible ? " alert-dismissible fade show" : "";
    const closeBtn = dismissible
      ? '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>'
      : "";
    return `<div class="alert ${cls}${dismissClass} mb-0${dismissible ? "" : " py-2"}" role="alert">${msg}${closeBtn}</div>`;
  }

  async function loadRunner() {
    const dbPath = DB_BASE + state.catalog.database;
    if (state.runner?.close) state.runner.close();
    state.runner = await SqlRunner.createFromFile(dbPath);
    if (el.tables) {
      const tables = state.runner.getTableNames();
      el.tables.textContent = tables.length ? tables.join(", ") : "none";
    }
  }

  function setStatus(msg, kind) {
    state.statusMsg = msg || "";
    if (!el.status) return;
    if (!msg) {
      el.status.innerHTML = "";
      return;
    }
    el.status.innerHTML = alertHtml(msg, kind, {
      dismissible: kind === "success",
    });
  }

  function showModal(title, bodyHtml) {
    if (!el.skillModalTitle || !el.skillModalBody) return;
    el.skillModalTitle.textContent = title;
    el.skillModalBody.innerHTML = bodyHtml;
    if (window.bootstrap?.Modal) {
      bootstrap.Modal.getOrCreateInstance(el.skillModal).show();
    }
  }

  function showSkillInfo(skillId, { unlockedBanner = false, alsoUnlocked = [] } = {}) {
    const skill = skillById(skillId);
    if (!skill) return;

    const examples = (skill.examples || []).map((ex) => escapeHtml(ex)).join("\n");
    const moduleLink =
      skill.moduleHref && skill.moduleLabel
        ? `<p class="mb-0"><a href="${escapeHtml(skill.moduleHref)}">Learn more: ${escapeHtml(skill.moduleLabel)}</a></p>`
        : "";
    const alsoNote =
      alsoUnlocked.length > 0
        ? `<p class="small text-muted">Also unlocked: ${alsoUnlocked
            .map((id) => escapeHtml(skillById(id)?.label || id))
            .join(", ")}. Open any skill’s <i class="bi bi-info-circle"></i> for details.</p>`
        : "";

    showModal(unlockedBanner ? `Unlocked: ${skill.label}` : skill.label, `
      ${unlockedBanner ? '<p class="text-success small mb-2">New skill available in your tree.</p>' : ""}
      ${alsoNote}
      <p>${escapeHtml(skill.summary || "")}</p>
      <div class="text-muted small text-uppercase fw-semibold mb-1">Syntax</div>
      <pre class="bytebrew-skill-examples mb-3"><code>${escapeHtml(skill.syntax || "")}</code></pre>
      <div class="text-muted small text-uppercase fw-semibold mb-1">Examples</div>
      <p class="small text-muted mb-1">Using the tutorial <code>employees</code> database:</p>
      <pre class="bytebrew-skill-examples mb-3"><code>${examples}</code></pre>
      ${moduleLink}
    `);
  }

  function maybeShowUnlockInfo(skillIds) {
    if (!skillIds || !skillIds.length) return;
    // During early game, suppress mass-unlock modals until skills panel opens
    if (isEarlyGame()) return;
    showSkillInfo(skillIds[0], {
      unlockedBanner: true,
      alsoUnlocked: skillIds.slice(1),
    });
  }

  function showSkillsIntro() {
    const intro = state.catalog.skillsIntro || {
      title: "Skills unlocked",
      body: "The Skills panel and Upgrades are now available.",
    };
    const paragraphs = String(intro.body)
      .split(/\n\n+/)
      .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
      .join("");
    showModal(intro.title, paragraphs);
    state.skillsIntroShown = true;
  }

  function advanceStage() {
    const i = stageIndex(state.stage);
    if (i < 0 || i >= STAGES.length - 1) return;
    const next = STAGES[i + 1];
    state.stage = next;

    if (
      next === "reveal-inbox" ||
      next === "reveal-ticket" ||
      next === "reveal-sandbox" ||
      next === "early"
    ) {
      fillInbox();
    }
    if (next === "reveal-sandbox" || next === "early") {
      if (!state.activeId && state.inbox.length) {
        state.activeId = state.inbox[0];
      }
    }

    renderAll();
    if (state.activeId && stageAtLeast("reveal-sandbox")) {
      loadRunner().catch((err) => {
        setStatus(`Failed to load database: ${err.message}`, "danger");
      });
    }
  }

  function enterFullDesk() {
    if (state.stage === "full") return;
    state.stage = "full";
    // Drop SELECT-only gate; refill with newly unlocked tickets
    state.inbox = state.inbox.filter((id) => {
      const t = state.catalog.tickets.find((x) => x.id === id);
      return t && ticketAvailable(t);
    });
    fillInbox();
    renderAll();
    if (!state.skillsIntroShown) showSkillsIntro();
  }

  function applyStageVisibility() {
    const showInbox = stageAtLeast("reveal-inbox");
    const showTicket = stageAtLeast("reveal-ticket");
    const showSandbox = stageAtLeast("reveal-sandbox");
    const showSkills = stageAtLeast("full");
    const showShop = stageAtLeast("full");
    const showExtraStats = stageAtLeast("full");
    const showDesk = stageAtLeast("reveal-inbox");

    el.panelInbox?.classList.toggle("d-none", !showInbox);
    el.panelTicket?.classList.toggle("d-none", !showTicket);
    el.panelSkills?.classList.toggle("d-none", !showSkills);
    el.colSkills?.classList.toggle("d-none", !showSkills);
    el.panelShop?.classList.toggle("d-none", !showShop);
    el.colLeft?.classList.toggle("d-none", !showDesk);

    document.querySelectorAll(".bb-stat-extra").forEach((node) => {
      node.classList.toggle("d-none", !showExtraStats);
    });

    // Sandbox visibility also depends on active ticket (handled in renderTicket)
    if (!showSandbox) {
      el.sandbox?.classList.add("d-none");
    }

    // Widen main column while skills column is hidden
    if (el.colMain) {
      el.colMain.classList.toggle("col-lg-6", showSkills);
      el.colMain.classList.toggle("col-lg-9", showDesk && !showSkills);
      el.colMain.classList.toggle("col-lg-12", !showDesk);
    }
  }

  function renderOnboarding() {
    if (!el.onboarding) return;
    if (stageAtLeast("early")) {
      el.onboarding.innerHTML = "";
      el.onboarding.classList.add("d-none");
      return;
    }

    el.onboarding.classList.remove("d-none");
    const step = (state.catalog.onboarding || []).find((s) => s.id === state.stage);
    if (!step) {
      el.onboarding.innerHTML = "";
      return;
    }

    const body = escapeHtml(step.body).replace(/\n/g, "<br>");
    el.onboarding.innerHTML = `
      <div class="bytebrew-onboarding-card">
        <h2 class="h5 mb-2">${escapeHtml(step.title)}</h2>
        <div class="mb-3">${body}</div>
        <button type="button" class="btn btn-primary" id="bb-onboarding-next">${escapeHtml(step.nextLabel || "Continue")}</button>
      </div>
    `;
    document.getElementById("bb-onboarding-next")?.addEventListener("click", advanceStage);
  }

  function renderHeader() {
    if (el.rep) el.rep.textContent = String(Math.floor(state.rep));
    if (el.hints) el.hints.textContent = String(state.hintTokens);
    if (el.slots) el.slots.textContent = String(state.inboxSlots);
  }

  function renderInbox() {
    if (!el.inbox || !stageAtLeast("reveal-inbox")) return;
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
      li.addEventListener("click", () => {
        if (stageAtLeast("reveal-ticket")) selectTicket(id);
      });
      el.inbox.appendChild(li);
    }
  }

  function skillRowHtml(skill) {
    const unlocked = isUnlocked(skill.id);
    const mastered = isMastered(skill.id);
    const progress = state.mastery[skill.id] || 0;

    let badge = "○";
    if (mastered) badge = "✓";
    else if (unlocked) badge = "·";

    const infoBtn = unlocked
      ? `<button type="button" class="btn btn-link btn-sm text-decoration-none px-1 py-0 bytebrew-skill-info" data-skill="${skill.id}" title="Syntax & examples" aria-label="Info for ${escapeHtml(skill.label)}"><i class="bi bi-info-circle"></i></button>`
      : "";

    const forceBtn =
      !unlocked && parentsUnlocked(skill) && skill.forceCost > 0
        ? `<button type="button" class="btn btn-outline-secondary btn-sm py-0 px-1 bytebrew-force" data-skill="${skill.id}">Force ${forceUnlockCost(skill.id)}</button>`
        : "";

    return `
      <div class="bytebrew-skill${unlocked ? "" : " is-locked"}">
        <span class="bytebrew-skill-mark">${badge}</span>
        <span class="bytebrew-skill-label">${escapeHtml(skill.label)}</span>
        <span class="bytebrew-skill-prog text-muted small">${unlocked ? `${progress}/${skill.quota}` : "locked"}</span>
        <span class="ms-auto d-inline-flex align-items-center gap-1">${infoBtn}${forceBtn}</span>
      </div>
    `;
  }

  function renderTreeNodes(nodes, accordionId, depth) {
    if (!nodes || !nodes.length) return "";
    return nodes
      .map((node, index) => {
        const collapseId = `${accordionId}-${node.id || index}-${depth}`;
        const children = node.children || [];

        if (node.type === "group") {
          const childHtml = renderTreeNodes(children, collapseId, depth + 1);
          return `
            <div class="bytebrew-tree-node">
              <div class="bytebrew-tree-row">
                <button type="button" class="btn btn-sm btn-link text-decoration-none px-1 bytebrew-tree-toggle collapsed" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-label="Expand ${escapeHtml(node.label || "group")}">
                  <i class="bi bi-chevron-right"></i>
                </button>
                <span class="fw-semibold small">${escapeHtml(node.label || "Group")}</span>
              </div>
              <div id="${collapseId}" class="collapse">
                <div class="bytebrew-tree-children">${childHtml}</div>
              </div>
            </div>
          `;
        }

        const skill = skillById(node.id);
        if (!skill) return "";
        const row = skillRowHtml(skill);

        if (!children.length) {
          return `<div class="bytebrew-tree-node bytebrew-tree-leaf"><div class="bytebrew-tree-row"><span class="bytebrew-tree-spacer"></span>${row}</div></div>`;
        }

        const childHtml = renderTreeNodes(children, collapseId, depth + 1);
        const open = depth === 0;
        return `
          <div class="bytebrew-tree-node">
            <div class="bytebrew-tree-row">
              <button type="button" class="btn btn-sm btn-link text-decoration-none px-1 bytebrew-tree-toggle${open ? "" : " collapsed"}" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="${open ? "true" : "false"}" aria-label="Expand ${escapeHtml(skill.label)}">
                <i class="bi bi-chevron-right"></i>
              </button>
              ${row}
            </div>
            <div id="${collapseId}" class="collapse${open ? " show" : ""}">
              <div class="bytebrew-tree-children">${childHtml}</div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  function bindSkillControls(root) {
    root.querySelectorAll(".bytebrew-force").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        forceUnlock(btn.dataset.skill);
      });
    });
    root.querySelectorAll(".bytebrew-skill-info").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        showSkillInfo(btn.dataset.skill);
      });
    });
  }

  function renderSkills() {
    if (!el.skills || !stageAtLeast("full")) return;
    const tree = state.catalog.skillTree || [];
    el.skills.innerHTML = `<div class="bytebrew-skill-tree" id="bb-skill-tree-root">${renderTreeNodes(tree, "bb-skill-tree-root", 0)}</div>`;
    bindSkillControls(el.skills);
  }

  function renderShop() {
    if (!el.shop || !stageAtLeast("full")) return;
    el.shop.innerHTML = "";
    for (const upgrade of state.catalog.upgrades) {
      const owned = !!state.purchased[upgrade.id];
      const reqOk =
        !upgrade.requires || upgrade.requires.every((r) => state.purchased[r]);
      const canBuy =
        reqOk && state.rep >= upgrade.cost && (upgrade.repeatable || !owned);

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
    if (!el.ticketMeta || !stageAtLeast("reveal-ticket")) return;

    const ticket = getActiveTicket();
    if (!ticket) {
      el.ticketMeta.innerHTML =
        '<p class="text-muted mb-0">Select a ticket from the inbox, then write your SQL in the sandbox.</p>';
      el.sandbox?.classList.add("d-none");
      if (el.editor) {
        delete el.editor.dataset.ticketId;
      }
      return;
    }

    const resolved = resolveTicket(ticket);
    const showSandbox = stageAtLeast("reveal-sandbox");
    if (showSandbox) el.sandbox?.classList.remove("d-none");
    else el.sandbox?.classList.add("d-none");

    const tags = ticket.requires
      .map(
        (r) =>
          `<button type="button" class="badge text-bg-secondary me-1 border-0 bytebrew-skill-badge" data-skill="${escapeHtml(r)}" title="View ${escapeHtml(r)} syntax">${escapeHtml(r)}</button>`
      )
      .join("");

    el.ticketMeta.innerHTML = `
      <div class="d-flex flex-wrap justify-content-between gap-2 mb-2">
        <div>
          <div class="text-muted small">Ticket ${escapeHtml(ticket.id)} — ${escapeHtml(ticket.from)} (${escapeHtml(ticket.role)})</div>
          <h2 class="h5 mb-1">${escapeHtml(ticket.title)}</h2>
        </div>
        <div class="bytebrew-ticket-tags">${tags}</div>
      </div>
      <p class="mb-0">${escapeHtml(resolved.prompt)}</p>
    `;

    el.ticketMeta.querySelectorAll(".bytebrew-skill-badge").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (stageAtLeast("full") || isUnlocked(btn.dataset.skill)) {
          showSkillInfo(btn.dataset.skill);
        }
      });
    });

    if (showSandbox && el.editor && el.editor.dataset.ticketId !== ticket.id) {
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
    applyStageVisibility();
    renderOnboarding();
    renderHeader();
    renderInbox();
    renderSkills();
    renderShop();
    renderTicket();
  }

  function selectTicket(id) {
    if (state.activeId !== id) {
      delete state.columnOrders[id];
    }
    state.activeId = id;
    state.failCount = 0;
    setStatus("");
    renderAll();
  }

  function forceUnlock(skillId) {
    if (!stageAtLeast("full")) return;
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
    const before = unlockedIds();
    state.rep -= cost;
    state.forceUnlocked[skillId] = true;
    setStatus(`Force-unlocked ${skill.label} (−${cost} rep).`, "success");
    fillInbox();
    renderAll();
    maybeShowUnlockInfo(newlyUnlocked(before, unlockedIds()));
  }

  function buyUpgrade(id) {
    if (!stageAtLeast("full")) return;
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
      setStatus(
        stageAtLeast("full")
          ? "No hint tokens — buy a pack in Upgrades."
          : "Hints unlock with the Upgrades panel after you master SELECT.",
        "warning"
      );
      return;
    }
    state.hintTokens -= 1;
    setStatus(`Hint: ${ticket.hint || "Try matching the expected result shape."}`, "info");
    renderHeader();
  }

  async function onRun() {
    if (!stageAtLeast("reveal-sandbox")) return;
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
    if (!stageAtLeast("reveal-sandbox")) return;
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
      const resolved = resolveTicket(ticket);
      const result = new Exercise.Validator(fresh).validate(sql, resolved.validation);

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
      const wasEarly = isEarlyGame();
      const { masteredNow, unlockedNow } = creditMastery(ticket.credits || []);

      state.inbox = state.inbox.filter((id) => id !== ticket.id);
      delete state.columnOrders[ticket.id];
      fillInbox();
      state.activeId = null;
      state.failCount = 0;
      if (el.editor) {
        delete el.editor.dataset.ticketId;
      }
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      let msg = `Correct! +${reward} rep.`;
      for (const id of ticket.credits || []) {
        const skill = skillById(id);
        if (skill) {
          msg += ` ${skill.label} ${state.mastery[id] || 0}/${skill.quota}.`;
        }
      }
      if (masteredNow.length) {
        msg += ` Mastered: ${masteredNow.map((id) => skillById(id).label).join(", ")}.`;
      }
      if (!wasEarly && unlockedNow.length) {
        msg += ` Unlocked: ${unlockedNow.map((id) => skillById(id).label).join(", ")}.`;
      }
      msg += " Select a ticket from the inbox for your next request.";

      el.feedback.innerHTML = alertHtml(
        `<i class="bi bi-check-circle me-1"></i>${escapeHtml(msg)}`,
        "success",
        { dismissible: true }
      );
      setStatus(escapeHtml(msg), "success");

      if (wasEarly && masteredNow.includes("select")) {
        enterFullDesk();
      } else {
        renderAll();
        maybeShowUnlockInfo(unlockedNow);
      }
    } catch (err) {
      el.feedback.innerHTML = `<div class="alert alert-danger mb-0">${escapeHtml(err.message)}</div>`;
    }
  }

  async function onReset() {
    if (!stageAtLeast("reveal-sandbox")) return;
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
    el.skillModal = document.getElementById("bb-skill-modal");
    el.skillModalTitle = document.getElementById("bb-skill-modal-title");
    el.skillModalBody = document.getElementById("bb-skill-modal-body");
    el.onboarding = document.getElementById("bb-onboarding");
    el.panelInbox = document.getElementById("bb-panel-inbox");
    el.panelShop = document.getElementById("bb-panel-shop");
    el.panelSkills = document.getElementById("bb-panel-skills");
    el.panelTicket = document.getElementById("bb-panel-ticket");
    el.colLeft = document.getElementById("bb-col-left");
    el.colSkills = document.getElementById("bb-col-skills");
    el.colMain = document.getElementById("bb-col-main");
  }

  async function init() {
    cacheEls();
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error("Could not load Byte Brew catalog.");
    state.catalog = await res.json();
    state.rep = state.catalog.startingRep || 0;
    state.inboxSlots = state.catalog.defaultInboxSlots || 1;
    state.stage = "intro-1";

    for (const skill of state.catalog.skills) {
      state.mastery[skill.id] = 0;
    }

    document.getElementById("bb-run")?.addEventListener("click", onRun);
    document.getElementById("bb-submit")?.addEventListener("click", onSubmit);
    document.getElementById("bb-reset")?.addEventListener("click", onReset);
    document.getElementById("bb-hint")?.addEventListener("click", useHint);

    renderAll();
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
