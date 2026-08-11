const ENABLED_KEY = "naukriCompanySiteTabCloser.enabled";
const DELAY_KEY = "naukriCompanySiteTabCloser.delayMs";
const CLOSE_REASON_KEY = "naukriCompanySiteTabCloser.lastClose";

const enabled = document.getElementById("enabled");
const delay = document.getElementById("delay");
const scanButton = document.getElementById("scanButton");
const status = document.getElementById("status");

function save() {
  chrome.storage.local.set({
    [ENABLED_KEY]: enabled.checked,
    [DELAY_KEY]: Number(delay.value)
  });
}

function scanCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab || !tab.id || !/https?:\/\/(www\.)?naukri\.com\//i.test(tab.url || "")) {
      status.textContent = "Open a Naukri tab first.";
      return;
    }

    chrome.tabs.sendMessage(tab.id, { type: "NAUKRI_COMPANY_SITE_SCAN" }, () => {
      status.textContent = chrome.runtime.lastError ? "Refresh the Naukri tab, then scan again." : "Scan sent to current Naukri tab.";
    });
  });
}

function renderLastClose(lastClose) {
  if (!lastClose || !lastClose.closedAt) {
    status.textContent = "Ready on Naukri tabs.";
    return;
  }

  const time = new Date(lastClose.closedAt).toLocaleTimeString();
  status.textContent = `Last closed at ${time}: ${lastClose.matchedText || "company-site apply"}`;
}

enabled.addEventListener("change", () => {
  save();
  status.textContent = enabled.checked ? "Auto-close enabled." : "Auto-close paused.";
  scanCurrentTab();
});

delay.addEventListener("change", save);
scanButton.addEventListener("click", scanCurrentTab);

chrome.storage.local.get([ENABLED_KEY, DELAY_KEY, CLOSE_REASON_KEY], (result) => {
  enabled.checked = result[ENABLED_KEY] !== false;
  delay.value = String(Number.isFinite(result[DELAY_KEY]) ? result[DELAY_KEY] : 700);
  renderLastClose(result[CLOSE_REASON_KEY]);
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !changes[CLOSE_REASON_KEY]) return;
  renderLastClose(changes[CLOSE_REASON_KEY].newValue);
});
