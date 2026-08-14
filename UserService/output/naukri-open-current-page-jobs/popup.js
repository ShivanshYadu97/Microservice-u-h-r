const SETTINGS_KEY = "naukriOpenCurrentPageJobs.settings";

const count = document.getElementById("count");
const delayInput = document.getElementById("delay");
const limitInput = document.getElementById("limit");
const refreshButton = document.getElementById("refreshButton");
const openButton = document.getElementById("openButton");
const preview = document.getElementById("preview");
const status = document.getElementById("status");

let currentJobs = [];
let activeTabId = null;

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isNaukriUrl(url) {
  return /^https?:\/\/(www\.)?naukri\.com\//i.test(url || "");
}

function isUsefulJobUrl(url) {
  if (!isNaukriUrl(url)) return false;

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

function getSettings() {
  return {
    delayMs: Number(delayInput.value) || 0,
    limit: Math.max(1, Math.min(100, Number(limitInput.value) || 30))
  };
}

function saveSettings() {
  chrome.storage.local.set({ [SETTINGS_KEY]: getSettings() });
}

function renderJobs() {
  const settings = getSettings();
  const openable = currentJobs.slice(0, settings.limit);

  count.textContent = `${currentJobs.length} job links found`;
  openButton.disabled = openable.length === 0;
  preview.innerHTML = "";

  openable.slice(0, 8).forEach((job, index) => {
    const row = document.createElement("div");
    row.title = job.url;
    row.textContent = `${index + 1}. ${job.title || job.url}`;
    preview.appendChild(row);
  });

  if (currentJobs.length > openable.length) {
    const row = document.createElement("div");
    row.textContent = `${currentJobs.length - openable.length} more skipped by max tabs limit`;
    preview.appendChild(row);
  }

  status.textContent = currentJobs.length
    ? "Ready. This will open only current loaded page jobs."
    : "No job cards found on this tab.";
}

function collectJobs() {
  count.textContent = "Checking current page...";
  status.textContent = "Reading loaded job cards...";
  openButton.disabled = true;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    activeTabId = tab && tab.id;

    if (!tab || !tab.id || !isNaukriUrl(tab.url)) {
      currentJobs = [];
      count.textContent = "Open a Naukri page first";
      preview.innerHTML = "";
      status.textContent = "Go to Naukri search results, then click Refresh count.";
      return;
    }

    chrome.tabs.sendMessage(tab.id, { type: "NAUKRI_COLLECT_CURRENT_PAGE_JOBS" }, (response) => {
      if (chrome.runtime.lastError || !response || !response.ok) {
        currentJobs = [];
        count.textContent = "Refresh Naukri tab";
        preview.innerHTML = "";
        status.textContent = "Refresh the Naukri page once, then try again.";
        return;
      }

      currentJobs = (Array.isArray(response.jobs) ? response.jobs : [])
        .filter((job) => job && isUsefulJobUrl(job.url));
      renderJobs();
    });
  });
}

async function openJobs() {
  const settings = getSettings();
  const jobsToOpen = currentJobs
    .filter((job) => job && isUsefulJobUrl(job.url))
    .slice(0, settings.limit);

  if (jobsToOpen.length === 0) return;

  openButton.disabled = true;
  refreshButton.disabled = true;
  status.textContent = `Opening 0/${jobsToOpen.length} tabs...`;

  for (let index = 0; index < jobsToOpen.length; index += 1) {
    chrome.tabs.create({
      url: jobsToOpen[index].url,
      active: false,
      openerTabId: activeTabId || undefined
    });

    status.textContent = `Opening ${index + 1}/${jobsToOpen.length} tabs...`;
    if (settings.delayMs > 0) await wait(settings.delayMs);
  }

  status.textContent = `Done. Opened ${jobsToOpen.length} current page jobs.`;
  refreshButton.disabled = false;
  openButton.disabled = false;
}

refreshButton.addEventListener("click", collectJobs);
openButton.addEventListener("click", openJobs);
delayInput.addEventListener("change", saveSettings);
limitInput.addEventListener("change", () => {
  saveSettings();
  renderJobs();
});

chrome.storage.local.get([SETTINGS_KEY], (result) => {
  const settings = result[SETTINGS_KEY] || {};
  delayInput.value = String(Number.isFinite(settings.delayMs) ? settings.delayMs : 100);
  limitInput.value = String(Number.isFinite(settings.limit) ? settings.limit : 30);
  collectJobs();
});
