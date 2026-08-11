(function () {
  const STORAGE_KEY = "naukriJobCardBlocker.items";
  const ENABLED_KEY = "naukriJobCardBlocker.enabled";
  const STATS_KEY = "naukriJobCardBlocker.stats";
  const STYLE_ID = "naukri-job-card-blocker-style";
  const HIDDEN_CLASS = "naukri-job-card-blocker-hidden";
  const MATCH_ATTR = "data-naukri-job-card-blocker-match";

  const CARD_SELECTORS = [
    "article",
    "[data-job-id]",
    ".srp-jobtuple-wrapper",
    ".cust-job-tuple",
    ".jobTuple",
    ".jobTupleHeader",
    ".tuple",
    ".job-tuple",
    ".styles_jlc__main__VdwtF",
    "div[class*='srp-jobtuple']",
    "div[class*='jobTuple']",
    "div[class*='job-tuple']",
    "div[class*='cust-job']",
    "div[class*='tuple']"
  ];

  const JOB_LINK_SELECTOR = [
    "a[href*='job-listings']",
    "a[href*='jobs-careers']",
    "a[href*='naukri.com/job']",
    "a[href*='/job-listings-']"
  ].join(",");

  let items = [];
  let enabled = true;
  let scanTimer = null;

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/\u00a0/g, " ")
      .replace(/[()_[\]{}]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function cleanItems(values) {
    const seen = new Set();
    return (Array.isArray(values) ? values : [])
      .map((value) => String(value || "").replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .filter((value) => {
        const key = normalize(value);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function keywordMatches(text, item) {
    const keyword = normalize(item);
    if (!keyword) return false;

    const escaped = escapeRegExp(keyword).replace(/\\ /g, "\\s+");
    const leftBoundary = /^[a-z0-9]/i.test(keyword) ? "(^|[^a-z0-9])" : "";
    const rightBoundary = /[a-z0-9]$/i.test(keyword) ? "($|[^a-z0-9])" : "";

    return new RegExp(`${leftBoundary}${escaped}${rightBoundary}`, "i").test(text);
  }

  function textOf(node) {
    return normalize(node && (node.innerText || node.textContent));
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .${HIDDEN_CLASS} {
        display: none !important;
      }
    `;
    document.documentElement.appendChild(style);
  }

  function hasJobSignal(node, text) {
    return (
      Boolean(node.querySelector && node.querySelector(JOB_LINK_SELECTOR)) ||
      Boolean(node.getAttribute && node.getAttribute("data-job-id")) ||
      text.includes("years") ||
      text.includes("yrs") ||
      text.includes("experience") ||
      text.includes("not disclosed") ||
      text.includes("posted") ||
      text.includes("apply")
    );
  }

  function looksLikeCard(node) {
    if (!node || node === document.body || node === document.documentElement) return false;

    const rect = node.getBoundingClientRect();
    if (!node.classList.contains(HIDDEN_CLASS) && (rect.width < 260 || rect.height < 48)) return false;

    const text = textOf(node);
    if (text.length < 35 || text.length > 9000) return false;

    return hasJobSignal(node, text);
  }

  function nearestCard(node) {
    for (const selector of CARD_SELECTORS) {
      const card = node.closest && node.closest(selector);
      if (looksLikeCard(card)) return card;
    }

    let current = node;
    for (let depth = 0; depth < 10 && current && current.parentElement; depth += 1) {
      current = current.parentElement;
      if (looksLikeCard(current)) return current;
    }

    return null;
  }

  function findCards() {
    const cards = new Set();

    CARD_SELECTORS.forEach((selector) => {
      document.querySelectorAll(selector).forEach((node) => {
        if (looksLikeCard(node)) cards.add(node);
      });
    });

    document.querySelectorAll(JOB_LINK_SELECTOR).forEach((link) => {
      const card = nearestCard(link);
      if (card) cards.add(card);
    });

    return Array.from(cards).filter((card) => card.isConnected);
  }

  function showCard(card) {
    card.classList.remove(HIDDEN_CLASS);
    card.removeAttribute(MATCH_ATTR);
  }

  function scan() {
    ensureStyle();

    const cards = findCards();
    let hidden = 0;

    cards.forEach((card) => {
      showCard(card);
      if (!enabled || items.length === 0) return;

      const text = textOf(card);
      const matched = items.find((item) => keywordMatches(text, item));

      if (matched) {
        card.classList.add(HIDDEN_CLASS);
        card.setAttribute(MATCH_ATTR, matched);
        hidden += 1;
      }
    });

    chrome.storage.local.set({
      [STATS_KEY]: {
        hidden,
        total: cards.length,
        updatedAt: Date.now()
      }
    });
  }

  function scheduleScan(delay) {
    window.clearTimeout(scanTimer);
    scanTimer = window.setTimeout(scan, delay);
  }

  function loadState(callback) {
    chrome.storage.local.get([STORAGE_KEY, ENABLED_KEY], (result) => {
      items = cleanItems(result[STORAGE_KEY]);
      enabled = typeof result[ENABLED_KEY] === "boolean" ? result[ENABLED_KEY] : true;
      callback();
    });
  }

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;

    if (changes[STORAGE_KEY]) items = cleanItems(changes[STORAGE_KEY].newValue);
    if (changes[ENABLED_KEY]) enabled = changes[ENABLED_KEY].newValue !== false;

    scheduleScan(50);
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || message.type !== "NAUKRI_BLOCKER_SCAN") return false;

    loadState(() => {
      scan();
      sendResponse({ ok: true });
    });
    return true;
  });

  loadState(() => {
    ensureStyle();
    scan();
    scheduleScan(500);
    scheduleScan(1500);
  });

  window.addEventListener("scroll", () => scheduleScan(200), { passive: true });
  window.addEventListener("hashchange", () => scheduleScan(100));
  window.addEventListener("popstate", () => scheduleScan(100));

  new MutationObserver(() => scheduleScan(250)).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
