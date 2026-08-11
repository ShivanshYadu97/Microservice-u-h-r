(function () {
  const STORAGE_KEY = "naukriJobSkillHider.blockedKeywords";
  const ENABLED_KEY = "naukriJobSkillHider.enabled";
  const STYLE_ID = "naukri-job-skill-hider-style";
  const PANEL_ID = "naukri-job-skill-hider-panel";
  const HIDDEN_CLASS = "naukri-job-skill-hider-hidden";
  const MATCH_ATTR = "data-naukri-job-skill-hider-match";

  const CARD_SELECTORS = [
    "article",
    ".srp-jobtuple-wrapper",
    ".cust-job-tuple",
    ".jobTuple",
    ".jobTupleHeader",
    "[data-job-id]",
    "div[class*='jobTuple']",
    "div[class*='job-tuple']",
    "div[class*='srp-jobtuple']",
    "div[class*='job-tuple-wrapper']"
  ];

  let blockedKeywords = [];
  let enabled = true;
  let lastTotal = 0;
  let lastHidden = 0;

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function parseKeywords(value) {
    const seen = new Set();
    return normalize(value)
      .split(/[,;\n|]+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .filter((item) => {
        if (seen.has(item)) return false;
        seen.add(item);
        return true;
      });
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function keywordMatches(text, keyword) {
    const escaped = escapeRegExp(keyword).replace(/\\ /g, "\\s+");
    const startsWord = /^[a-z0-9]/i.test(keyword) ? "(^|[^a-z0-9])" : "";
    const endsWord = /[a-z0-9]$/i.test(keyword) ? "($|[^a-z0-9])" : "";
    return new RegExp(`${startsWord}${escaped}${endsWord}`, "i").test(text);
  }

  function textOf(node) {
    return normalize(node && (node.innerText || node.textContent));
  }

  function isVisibleEnough(node) {
    const rect = node.getBoundingClientRect();
    return rect.width >= 250 && rect.height >= 45;
  }

  function looksLikeJobCard(node) {
    if (!node || node === document.body || node === document.documentElement) return false;
    if (!isVisibleEnough(node) && !node.classList.contains(HIDDEN_CLASS)) return false;

    const text = textOf(node);
    if (text.length < 35) return false;

    return (
      text.includes("yrs") ||
      text.includes("years") ||
      text.includes("experience") ||
      text.includes("not disclosed") ||
      text.includes("posted") ||
      text.includes("apply") ||
      Boolean(node.querySelector("a[href*='job-listings'], a[href*='jobs-careers']"))
    );
  }

  function nearestJobCard(node) {
    for (const selector of CARD_SELECTORS) {
      const card = node.closest && node.closest(selector);
      if (looksLikeJobCard(card)) return card;
    }

    let current = node;
    for (let depth = 0; depth < 8 && current && current.parentElement; depth += 1) {
      current = current.parentElement;
      if (looksLikeJobCard(current)) return current;
    }
    return null;
  }

  function findJobCards() {
    const cards = new Set();

    for (const selector of CARD_SELECTORS) {
      document.querySelectorAll(selector).forEach((node) => {
        if (looksLikeJobCard(node)) cards.add(node);
      });
    }

    document.querySelectorAll("a[href*='job-listings'], a[href*='jobs-careers']").forEach((link) => {
      const card = nearestJobCard(link);
      if (card) cards.add(card);
    });

    return Array.from(cards).filter((card) => card.isConnected);
  }

  function setCardVisible(card) {
    card.classList.remove(HIDDEN_CLASS);
    card.removeAttribute(MATCH_ATTR);
  }

  function scan() {
    const cards = findJobCards();
    lastTotal = cards.length;
    lastHidden = 0;

    for (const card of cards) {
      setCardVisible(card);
      if (!enabled || blockedKeywords.length === 0) continue;

      const text = textOf(card);
      const matched = blockedKeywords.find((keyword) => keywordMatches(text, keyword));
      if (matched) {
        card.classList.add(HIDDEN_CLASS);
        card.setAttribute(MATCH_ATTR, matched);
        lastHidden += 1;
      }
    }

    updateStatus();
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .${HIDDEN_CLASS} {
        display: none !important;
      }

      #${PANEL_ID} {
        position: fixed;
        right: 16px;
        bottom: 16px;
        z-index: 2147483647;
        width: 310px;
        box-sizing: border-box;
        background: #172033;
        color: #f8fafc;
        border: 1px solid rgba(255,255,255,.16);
        border-radius: 8px;
        box-shadow: 0 12px 34px rgba(15,23,42,.34);
        padding: 12px;
        font: 12px/1.35 Arial, sans-serif;
        letter-spacing: 0;
      }

      #${PANEL_ID} * {
        box-sizing: border-box;
        letter-spacing: 0;
      }

      #${PANEL_ID} .njsh-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 8px;
      }

      #${PANEL_ID} .njsh-title {
        font-size: 13px;
        font-weight: 700;
      }

      #${PANEL_ID} .njsh-toggle {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        white-space: nowrap;
        color: #dbeafe;
      }

      #${PANEL_ID} textarea {
        width: 100%;
        min-height: 72px;
        resize: vertical;
        border: 1px solid #46566f;
        border-radius: 6px;
        padding: 8px;
        color: #0f172a;
        background: #ffffff;
        font: 12px/1.35 Arial, sans-serif;
      }

      #${PANEL_ID} .njsh-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 8px;
      }

      #${PANEL_ID} button {
        border: 0;
        border-radius: 6px;
        padding: 6px 9px;
        background: #e2e8f0;
        color: #0f172a;
        cursor: pointer;
        font: 12px Arial, sans-serif;
      }

      #${PANEL_ID} button[data-primary="true"] {
        background: #38bdf8;
        color: #082f49;
        font-weight: 700;
      }

      #${PANEL_ID} .njsh-status {
        margin-top: 8px;
        color: #cbd5e1;
        font-size: 11px;
        overflow-wrap: anywhere;
      }

      #${PANEL_ID}.njsh-collapsed {
        width: auto;
        padding: 8px 10px;
      }

      #${PANEL_ID}.njsh-collapsed .njsh-body {
        display: none;
      }
    `;
    document.documentElement.appendChild(style);
  }

  function updateStatus() {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;

    const status = panel.querySelector(".njsh-status");
    const toggle = panel.querySelector("#njsh-enabled");
    if (toggle) toggle.checked = enabled;

    const keywordText = blockedKeywords.length ? blockedKeywords.join(", ") : "none";
    status.textContent = `${enabled ? "Active" : "Paused"} | hidden ${lastHidden}/${lastTotal} | keywords: ${keywordText}`;
  }

  function saveState(inputValue) {
    blockedKeywords = parseKeywords(inputValue);
    chrome.storage.local.set({
      [STORAGE_KEY]: blockedKeywords,
      [ENABLED_KEY]: enabled
    });
    scan();
  }

  function showAllCards() {
    findJobCards().forEach(setCardVisible);
    lastHidden = 0;
    updateStatus();
  }

  function ensurePanel() {
    ensureStyle();
    if (document.getElementById(PANEL_ID)) return;

    const panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.innerHTML = `
      <div class="njsh-header">
        <div class="njsh-title">Naukri Skill Hider</div>
        <label class="njsh-toggle">
          <input id="njsh-enabled" type="checkbox" />
          On
        </label>
      </div>
      <div class="njsh-body">
        <textarea id="njsh-keywords" placeholder="python, php, wordpress, .net"></textarea>
        <div class="njsh-actions">
          <button id="njsh-save" data-primary="true" type="button">Save & scan</button>
          <button id="njsh-rescan" type="button">Rescan</button>
          <button id="njsh-clear" type="button">Clear</button>
          <button id="njsh-collapse" type="button">Minimize</button>
        </div>
        <div class="njsh-status">Loading...</div>
      </div>
    `;
    document.body.appendChild(panel);

    const input = panel.querySelector("#njsh-keywords");
    const enabledToggle = panel.querySelector("#njsh-enabled");

    panel.querySelector("#njsh-save").addEventListener("click", () => saveState(input.value));
    panel.querySelector("#njsh-rescan").addEventListener("click", scan);
    panel.querySelector("#njsh-clear").addEventListener("click", () => {
      input.value = "";
      saveState("");
      showAllCards();
    });
    panel.querySelector("#njsh-collapse").addEventListener("click", () => {
      panel.classList.toggle("njsh-collapsed");
    });
    enabledToggle.addEventListener("change", () => {
      enabled = enabledToggle.checked;
      saveState(input.value);
      if (!enabled) showAllCards();
    });
    input.addEventListener("keydown", (event) => {
      if (event.ctrlKey && event.key === "Enter") saveState(input.value);
    });

    chrome.storage.local.get([STORAGE_KEY, ENABLED_KEY], (result) => {
      blockedKeywords = Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : [];
      enabled = typeof result[ENABLED_KEY] === "boolean" ? result[ENABLED_KEY] : true;
      input.value = blockedKeywords.join(", ");
      enabledToggle.checked = enabled;
      scan();
    });
  }

  const debouncedScan = (() => {
    let timer = null;
    return () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(scan, 250);
    };
  })();

  ensurePanel();
  window.addEventListener("scroll", debouncedScan, { passive: true });
  window.addEventListener("popstate", debouncedScan);

  new MutationObserver(debouncedScan).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
