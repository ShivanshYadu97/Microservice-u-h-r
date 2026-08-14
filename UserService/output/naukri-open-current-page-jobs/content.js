(function () {
  const JOB_LINK_SELECTOR = [
    "a[href*='job-listings']",
    "a[href*='jobs-careers']",
    "a[href*='/job-listings-']",
    "a[href*='naukri.com/job']"
  ].join(",");

  const CARD_SELECTORS = [
    "article",
    "[data-job-id]",
    ".srp-jobtuple-wrapper",
    ".cust-job-tuple",
    ".jobTuple",
    ".jobTupleHeader",
    ".tuple",
    ".job-tuple",
    "div[class*='srp-jobtuple']",
    "div[class*='jobTuple']",
    "div[class*='job-tuple']",
    "div[class*='cust-job']",
    "div[class*='tuple']"
  ];

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function textOf(node) {
    return normalize(node && (node.innerText || node.textContent));
  }

  function isUsefulJobUrl(url) {
    if (!/^https?:\/\/([^/]+\.)?naukri\.com\//i.test(url || "")) return false;

    let parsed;
    try {
      parsed = new URL(url);
    } catch (_error) {
      return false;
    }

    const path = parsed.pathname.toLowerCase();

    if (
      path.includes("/career-advice/") ||
      path.includes("/job-apply-agent") ||
      path.includes("/mnjuser/") ||
      path.includes("/recruiter/") ||
      path.includes("/companies-hiring/") ||
      path.includes("/jobs-careers-")
    ) {
      return false;
    }

    return path.includes("/job-listings-");
  }

  function cleanUrl(url) {
    try {
      const parsed = new URL(url, window.location.href);
      parsed.hash = "";
      return parsed.href;
    } catch (_error) {
      return "";
    }
  }

  function looksLikeCard(node) {
    if (!node || node === document.body || node === document.documentElement) return false;

    const rect = node.getBoundingClientRect();
    if (rect.width < 240 || rect.height < 42) return false;

    const text = textOf(node);
    if (text.length < 30 || text.length > 9000) return false;

    return (
      Boolean(node.querySelector && node.querySelector(JOB_LINK_SELECTOR)) ||
      Boolean(node.getAttribute && node.getAttribute("data-job-id")) ||
      text.includes("years") ||
      text.includes("yrs") ||
      text.includes("experience") ||
      text.includes("not disclosed") ||
      text.includes("posted")
    );
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

  function getCards() {
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

    return Array.from(cards)
      .filter((card) => card.isConnected)
      .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
  }

  function getJobLinkFromCard(card) {
    const links = Array.from(card.querySelectorAll("a[href]"));
    const preferred = links.find((link) => isUsefulJobUrl(cleanUrl(link.href)));
    return preferred ? cleanUrl(preferred.href) : "";
  }

  function collectCurrentPageJobs() {
    const seen = new Set();
    const jobs = [];

    getCards().forEach((card) => {
      const url = getJobLinkFromCard(card);
      if (!url || seen.has(url)) return;

      seen.add(url);
      jobs.push({
        url,
        title: textOf(card).slice(0, 120)
      });
    });

    if (jobs.length === 0) {
      document.querySelectorAll(JOB_LINK_SELECTOR).forEach((link) => {
        const url = cleanUrl(link.href);
        if (!isUsefulJobUrl(url) || seen.has(url)) return;
        seen.add(url);
        jobs.push({
          url,
          title: normalize(link.textContent).slice(0, 120)
        });
      });
    }

    return jobs;
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || message.type !== "NAUKRI_COLLECT_CURRENT_PAGE_JOBS") return false;
    sendResponse({
      ok: true,
      url: window.location.href,
      jobs: collectCurrentPageJobs()
    });
    return false;
  });
})();
