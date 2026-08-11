(function () {
  const ENABLED_KEY = "naukriCompanySiteTabCloser.enabled";
  const DELAY_KEY = "naukriCompanySiteTabCloser.delayMs";
  const STATE_ATTR = "data-naukri-company-site-tab-closer";

  const BLOCK_PHRASES = [
    "apply on company site",
    "apply to company site",
    "apply on company's site",
    "apply on external site",
    "apply to external site",
    "external apply"
  ];

  let enabled = true;
  let delayMs = 700;
  let closeTimer = null;
  let closeRequested = false;

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function visibleText(node) {
    const rect = node.getBoundingClientRect();
    const style = window.getComputedStyle(node);

    if (rect.width <= 0 || rect.height <= 0) return "";
    if (style.visibility === "hidden" || style.display === "none" || Number(style.opacity) === 0) return "";

    return normalize(node.innerText || node.textContent);
  }

  function findMatchedPhrase() {
    const controls = Array.from(document.querySelectorAll("button, a, [role='button'], span, div"))
      .filter((node) => {
        const text = visibleText(node);
        if (!text || !text.includes("apply")) return false;

        const rect = node.getBoundingClientRect();
        if (rect.bottom <= 0 || rect.top >= window.innerHeight) return false;
        if (rect.right <= 0 || rect.left >= window.innerWidth) return false;

        return BLOCK_PHRASES.some((phrase) => text.includes(phrase));
      });

    if (controls.length) {
      const text = visibleText(controls[0]);
      return BLOCK_PHRASES.find((phrase) => text.includes(phrase)) || "apply on company site";
    }

    const pageText = normalize(document.body && document.body.innerText);
    return BLOCK_PHRASES.find((phrase) => pageText.includes(phrase)) || "";
  }

  function requestClose(matchedText) {
    if (closeRequested) return;
    closeRequested = true;
    document.documentElement.setAttribute(STATE_ATTR, "closing");

    chrome.runtime.sendMessage({
      type: "NAUKRI_CLOSE_COMPANY_SITE_TAB",
      matchedText
    });
  }

  function scan() {
    if (!enabled || closeRequested) return;

    const matched = findMatchedPhrase();
    if (!matched) return;

    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => requestClose(matched), delayMs);
  }

  function scheduleScan(delay) {
    if (!enabled || closeRequested) return;
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(scan, delay);
  }

  function loadState(callback) {
    chrome.storage.local.get([ENABLED_KEY, DELAY_KEY], (result) => {
      enabled = result[ENABLED_KEY] !== false;
      delayMs = Number.isFinite(result[DELAY_KEY]) ? Math.max(0, result[DELAY_KEY]) : 700;
      callback();
    });
  }

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;
    if (changes[ENABLED_KEY]) enabled = changes[ENABLED_KEY].newValue !== false;
    if (changes[DELAY_KEY]) {
      const nextDelay = changes[DELAY_KEY].newValue;
      delayMs = Number.isFinite(nextDelay) ? Math.max(0, nextDelay) : 700;
    }
    scheduleScan(100);
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || message.type !== "NAUKRI_COMPANY_SITE_SCAN") return false;
    loadState(() => {
      scan();
      sendResponse({ ok: true });
    });
    return true;
  });

  loadState(() => {
    scan();
    scheduleScan(600);
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
