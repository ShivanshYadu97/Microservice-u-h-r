(function () {
  const STYLE_ID = "codex-naukri-skill-blocker-style";
  const PANEL_ID = "codex-naukri-skill-blocker-panel";
  const HIDDEN_CLASS = "codex-skill-blocked-job";
  const MATCH_ATTR = "data-codex-blocked-by";
  const STORAGE_KEY = "codexNaukriBlockedSkills";

  const CARD_SELECTORS = [
    "article",
    ".srp-jobtuple-wrapper",
    ".cust-job-tuple",
    ".jobTuple",
    ".jobTupleHeader",
    "[data-job-id]",
    "div[class*='jobTuple']",
    "div[class*='job-tuple']",
    "div[class*='srp-jobtuple']"
  ];

  let blockedKeywords = [];
  let totalHidden = 0;

  function normalize(text) {
    return (text || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function parseKeywords(value) {
    return normalize(value)
      .split(/[,\n|]+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .filter((item, index, arr) => arr.indexOf(item) === index);
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function keywordMatches(text, keyword) {
    const safe = escapeRegExp(keyword);
    const startsWord = /^[a-z0-9]/i.test(keyword) ? "\\b" : "";
    const endsWord = /[a-z0-9]$/i.test(keyword) ? "\\b" : "";
    return new RegExp(`${startsWord}${safe}${endsWord}`, "i").test(text);
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
        right: 14px;
        bottom: 14px;
        z-index: 2147483647;
        width: 292px;
        background: #163b63;
        color: #fff;
        font: 12px/1.35 Arial, sans-serif;
        padding: 10px;
        border-radius: 6px;
        box-shadow: 0 4px 16px rgba(0,0,0,.22);
        letter-spacing: 0;
      }
      #${PANEL_ID} label {
        display: block;
        font-weight: 700;
        margin-bottom: 5px;
      }
      #${PANEL_ID} textarea {
        width: 100%;
        box-sizing: border-box;
        min-height: 58px;
        resize: vertical;
        border: 0;
        border-radius: 4px;
        padding: 7px;
        font: 12px Arial, sans-serif;
        color: #1f2933;
      }
      #${PANEL_ID} button {
        margin-top: 7px;
        margin-right: 5px;
        border: 0;
        border-radius: 4px;
        padding: 5px 8px;
        background: #fff;
        color: #163b63;
        cursor: pointer;
        font: 12px Arial, sans-serif;
      }
      #${PANEL_ID} .status {
        margin-top: 6px;
        color: #dbe8f5;
        font-size: 11px;
      }
    `;
    document.documentElement.appendChild(style);
  }

  function looksLikeCard(card) {
    if (!card || card === document.body || card === document.documentElement) return false;
    const rect = card.getBoundingClientRect();
    if (rect.width < 250 || rect.height < 45) return false;
    const text = normalize(card.innerText || card.textContent || "");
    if (text.length < 35) return false;
    return (
      text.includes("yrs") ||
      text.includes("years") ||
      text.includes("not disclosed") ||
      text.includes("posted") ||
      text.includes("experience") ||
      Boolean(card.querySelector("a[href*='job-listings'], a[href*='jobs-careers']"))
    );
  }

  function findCards() {
    const cards = new Set();
    for (const selector of CARD_SELECTORS) {
      document.querySelectorAll(selector).forEach((card) => {
        if (looksLikeCard(card)) cards.add(card);
      });
    }

    document.querySelectorAll("a[href*='job-listings'], a[href*='jobs-careers']").forEach((link) => {
      let current = link;
      for (let depth = 0; depth < 8 && current && current.parentElement; depth += 1) {
        current = current.parentElement;
        if (looksLikeCard(current)) {
          cards.add(current);
          break;
        }
      }
    });

    return Array.from(cards);
  }

  function scan() {
    totalHidden = 0;
    const cards = findCards();

    for (const card of cards) {
      card.classList.remove(HIDDEN_CLASS);
      card.removeAttribute(MATCH_ATTR);

      const text = normalize(card.innerText || card.textContent || "");
      const matched = blockedKeywords.find((keyword) => keywordMatches(text, keyword));
      if (matched) {
        card.classList.add(HIDDEN_CLASS);
        card.setAttribute(MATCH_ATTR, matched);
        totalHidden += 1;
      }
    }

    updateStatus(cards.length);
  }

  function updateStatus(totalCards) {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;
    const status = panel.querySelector(".status");
    const words = blockedKeywords.length ? blockedKeywords.join(", ") : "none";
    status.textContent = `Hidden: ${totalHidden}/${totalCards || 0} | Blocked: ${words}`;
  }

  function saveKeywords(value) {
    blockedKeywords = parseKeywords(value);
    chrome.storage.local.set({ [STORAGE_KEY]: blockedKeywords });
    scan();
  }

  function ensurePanel() {
    ensureStyle();
    if (document.getElementById(PANEL_ID)) return;

    const panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.innerHTML = `
      <label for="codex-blocked-skills">Hide jobs containing</label>
      <textarea id="codex-blocked-skills" placeholder="python, php, .net, react"></textarea>
      <button id="codex-save-blocked-skills" type="button">Save & scan</button>
      <button id="codex-clear-blocked-skills" type="button">Clear</button>
      <button id="codex-rescan-blocked-skills" type="button">Rescan</button>
      <div class="status">Loading...</div>
    `;
    document.body.appendChild(panel);

    const input = panel.querySelector("#codex-blocked-skills");
    panel.querySelector("#codex-save-blocked-skills").addEventListener("click", () => saveKeywords(input.value));
    panel.querySelector("#codex-clear-blocked-skills").addEventListener("click", () => {
      input.value = "";
      saveKeywords("");
    });
    panel.querySelector("#codex-rescan-blocked-skills").addEventListener("click", scan);
    input.addEventListener("keydown", (event) => {
      if (event.ctrlKey && event.key === "Enter") saveKeywords(input.value);
    });

    chrome.storage.local.get([STORAGE_KEY], (result) => {
      blockedKeywords = Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : [];
      input.value = blockedKeywords.join(", ");
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
  const observer = new MutationObserver(debouncedScan);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
