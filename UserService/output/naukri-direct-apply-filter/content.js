(function () {
  const BLOCK_TEXTS = [
    "apply on company site",
    "apply to company site",
    "apply on company's site",
    "apply on external site"
  ];

  const DIRECT_TEXTS = [
    "apply",
    "apply now",
    "register to apply",
    "login to apply"
  ];

  const CARD_SELECTORS = [
    "article",
    ".srp-jobtuple-wrapper",
    ".cust-job-tuple",
    ".jobTuple",
    "[data-job-id]",
    "div[class*='jobTuple']",
    "div[class*='job-tuple']",
    "div[class*='srp-jobtuple']"
  ];

  const STYLE_ID = "codex-naukri-apply-scanner-style";
  const PANEL_ID = "codex-naukri-apply-scanner-panel";
  const STATE = "data-codex-apply-scanner-state";

  let running = false;
  let scanned = 0;
  let opened = 0;
  let skipped = 0;
  let unknown = 0;

  function textOf(node) {
    return (node && (node.innerText || node.textContent) || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .codex-card-scanning {
        outline: 3px solid #1f78d1 !important;
        outline-offset: 2px !important;
      }
      .codex-card-direct {
        outline: 3px solid #0a8f3c !important;
        outline-offset: 2px !important;
      }
      .codex-card-skip {
        opacity: .38 !important;
      }
      #${PANEL_ID} {
        position: fixed;
        right: 14px;
        bottom: 14px;
        z-index: 2147483647;
        width: 260px;
        background: #163b63;
        color: #fff;
        font: 12px/1.35 Arial, sans-serif;
        padding: 10px;
        border-radius: 6px;
        box-shadow: 0 4px 16px rgba(0,0,0,.22);
        letter-spacing: 0;
      }
      #${PANEL_ID} button {
        margin-top: 7px;
        margin-right: 5px;
        border: 0;
        border-radius: 4px;
        padding: 4px 7px;
        background: #fff;
        color: #163b63;
        cursor: pointer;
        font: 12px Arial, sans-serif;
      }
      #${PANEL_ID} .muted {
        color: #dbe8f5;
        font-size: 11px;
        margin-top: 4px;
      }
    `;
    document.documentElement.appendChild(style);
  }

  function updatePanel(message) {
    ensureStyle();
    let panel = document.getElementById(PANEL_ID);
    if (!panel) {
      panel = document.createElement("div");
      panel.id = PANEL_ID;
      panel.innerHTML = `
        <div id="codex-scanner-status"></div>
        <div class="muted">Scan cards one by one. Direct Apply jobs open in new tabs.</div>
        <button id="codex-start-scan" type="button">Scan & open Apply jobs</button>
        <button id="codex-stop-scan" type="button">Stop</button>
        <button id="codex-reset-scan" type="button">Reset marks</button>
      `;
      document.body.appendChild(panel);
      panel.querySelector("#codex-start-scan").addEventListener("click", () => scanAndOpen());
      panel.querySelector("#codex-stop-scan").addEventListener("click", () => {
        running = false;
        updatePanel("Stopping after current card...");
      });
      panel.querySelector("#codex-reset-scan").addEventListener("click", resetMarks);
    }
    panel.querySelector("#codex-scanner-status").textContent =
      message || `Scanned: ${scanned} | Opened: ${opened} | Skipped: ${skipped} | Unknown: ${unknown}`;
  }

  function looksLikeCard(card) {
    if (!card || card === document.body || card === document.documentElement) return false;
    const rect = card.getBoundingClientRect();
    if (rect.height < 45 || rect.width < 260) return false;
    const text = textOf(card);
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

  function cardFromNode(node) {
    for (const selector of CARD_SELECTORS) {
      const card = node.closest(selector);
      if (looksLikeCard(card)) return card;
    }
    let current = node;
    for (let depth = 0; depth < 8 && current && current.parentElement; depth += 1) {
      current = current.parentElement;
      if (looksLikeCard(current)) return current;
    }
    return null;
  }

  function getCards() {
    const cards = new Set();
    for (const selector of CARD_SELECTORS) {
      document.querySelectorAll(selector).forEach((card) => {
        if (looksLikeCard(card)) cards.add(card);
      });
    }
    document.querySelectorAll("a[href*='job-listings'], a[href*='jobs-careers']").forEach((link) => {
      const card = cardFromNode(link);
      if (card) cards.add(card);
    });
    return Array.from(cards)
      .filter((card) => card.isConnected)
      .filter((card) => !card.hasAttribute(STATE))
      .filter((card) => card.getBoundingClientRect().top > -300)
      .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
  }

  function jobUrl(card) {
    const anchors = Array.from(card.querySelectorAll("a[href]"));
    const preferred = anchors.find((a) => /job-listings|jobs-careers/i.test(a.href));
    const naukri = anchors.find((a) => /naukri\.com/i.test(a.href));
    const any = anchors.find((a) => /^https?:/i.test(a.href));
    return preferred ? preferred.href : naukri ? naukri.href : any ? any.href : "";
  }

  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function blockAnchorNavigation(event) {
    const link = event.target && event.target.closest && event.target.closest("a[href]");
    if (!link) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }

  function selectCardOnly(card) {
    const rect = card.getBoundingClientRect();
    const x = rect.left + Math.max(18, Math.min(48, rect.width * 0.08));
    const y = rect.top + Math.max(22, Math.min(rect.height * 0.5, rect.height - 12));

    document.addEventListener("click", blockAnchorNavigation, true);
    try {
      for (const type of ["pointerdown", "mousedown", "pointerup", "mouseup", "click"]) {
        card.dispatchEvent(new MouseEvent(type, {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: x,
          clientY: y
        }));
      }
    } finally {
      window.setTimeout(() => document.removeEventListener("click", blockAnchorNavigation, true), 50);
    }
  }

  async function waitForDetailToSettle(before) {
    const start = before.slice(0, 1500);
    let changed = false;
    for (let i = 0; i < 18; i += 1) {
      await wait(200);
      const now = (document.body.innerText || "").slice(0, 1500);
      if (now !== start) changed = true;
      if (changed) return;
    }
  }

  function visibleApplyControls() {
    return Array.from(document.querySelectorAll("button, a, [role='button'], span, div"))
      .filter((node) => {
        const text = textOf(node);
        if (!text.includes("apply")) return false;
        const rect = node.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return false;
        if (rect.bottom <= 0 || rect.top >= window.innerHeight) return false;
        if (rect.right <= 0 || rect.left >= window.innerWidth) return false;
        return true;
      })
      .sort((a, b) => {
        const ar = a.getBoundingClientRect();
        const br = b.getBoundingClientRect();
        return (br.width * br.height) - (ar.width * ar.height);
      });
  }

  function classifyDetail() {
    const controls = visibleApplyControls();
    for (const node of controls) {
      const text = textOf(node);
      if (BLOCK_TEXTS.some((blocked) => text.includes(blocked))) return "company-site";
    }
    for (const node of controls) {
      const text = textOf(node);
      if (DIRECT_TEXTS.some((direct) => text === direct)) return "direct";
    }
    return "unknown";
  }

  async function inspectAndMaybeOpen(card, index, total) {
    if (!running || !card.isConnected) return;

    card.classList.add("codex-card-scanning");
    card.scrollIntoView({ block: "center", behavior: "instant" });
    await wait(180);

    const before = document.body.innerText || "";
    selectCardOnly(card);
    await waitForDetailToSettle(before);
    await wait(650);

    const result = classifyDetail();
    card.classList.remove("codex-card-scanning");
    card.setAttribute(STATE, result);
    scanned += 1;

    if (result === "company-site") {
      skipped += 1;
      card.classList.add("codex-card-skip");
    } else if (result === "direct") {
      opened += 1;
      card.classList.add("codex-card-direct");
      const url = jobUrl(card);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } else {
      unknown += 1;
    }

    updatePanel(`Scanning ${index}/${total} | Last: ${result} | Opened: ${opened} | Skipped: ${skipped}`);
  }

  async function scanAndOpen() {
    if (running) return;
    running = true;
    const cards = getCards();
    updatePanel(`Starting scan: ${cards.length} visible cards`);

    for (let i = 0; i < cards.length && running; i += 1) {
      await inspectAndMaybeOpen(cards[i], i + 1, cards.length);
      await wait(350);
    }

    running = false;
    updatePanel(`Done | Scanned: ${scanned} | Opened: ${opened} | Skipped: ${skipped} | Unknown: ${unknown}`);
  }

  function resetMarks() {
    running = false;
    scanned = 0;
    opened = 0;
    skipped = 0;
    unknown = 0;
    document.querySelectorAll(`[${STATE}], .codex-card-scanning, .codex-card-direct, .codex-card-skip`).forEach((card) => {
      card.removeAttribute(STATE);
      card.classList.remove("codex-card-scanning", "codex-card-direct", "codex-card-skip");
    });
    updatePanel("Reset done. Click scan again.");
  }

  ensureStyle();
  updatePanel();
})();
